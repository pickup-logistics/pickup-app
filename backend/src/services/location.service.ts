import { PrismaClient } from '@prisma/client';
import { io } from '../server';
import { calculateDistance } from './ride.service';

const prisma = new PrismaClient();

export interface LocationUpdate {
  riderId: string;
  latitude: number;
  longitude: number;
  heading?: number; // Direction in degrees (0-360)
  speed?: number; // Speed in km/h
  accuracy?: number; // GPS accuracy in meters
}

export interface ETACalculation {
  distanceRemaining: number; // in km
  estimatedMinutes: number;
  estimatedArrival: Date;
}

/**
 * Update rider's current location
 */
export const updateRiderLocation = async (locationUpdate: LocationUpdate) => {
  const { riderId, latitude, longitude, heading, speed, accuracy } = locationUpdate;

  try {
    // Update rider location in database
    await prisma.rider.update({
      where: { id: riderId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    });

    // Get rider's active ride
    const activeRide = await prisma.ride.findFirst({
      where: {
        riderId,
        status: {
          in: ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'],
        },
      },
      include: {
        user: true,
      },
    });

    if (!activeRide) {
      // No active ride, just update location
      return { success: true, message: 'Location updated' };
    }

    // Calculate distance and ETA based on ride status
    let targetLatitude: number;
    let targetLongitude: number;
    let targetLabel: string;

    if (activeRide.status === 'ACCEPTED' || activeRide.status === 'ARRIVED') {
      // Heading to pickup
      targetLatitude = activeRide.pickupLatitude;
      targetLongitude = activeRide.pickupLongitude;
      targetLabel = 'pickup';
    } else {
      // Heading to dropoff
      targetLatitude = activeRide.dropoffLatitude;
      targetLongitude = activeRide.dropoffLongitude;
      targetLabel = 'dropoff';
    }

    // Calculate distance remaining
    const distanceRemaining = calculateDistance(
      latitude,
      longitude,
      targetLatitude,
      targetLongitude
    );

    // Calculate ETA
    const eta = calculateETA(distanceRemaining, speed);

    // Broadcast location update to user
    io.to(`user:${activeRide.userId}`).emit('rider:location-update', {
      rideId: activeRide.id,
      location: {
        latitude,
        longitude,
        heading,
        speed,
        accuracy,
      },
      distanceRemaining,
      eta,
      target: targetLabel,
    });

    // Check for milestone notifications
    await checkMilestones(activeRide.id, activeRide.userId, distanceRemaining, eta.estimatedMinutes);

    // Check for geofence (arrival detection)
    await checkGeofence(
      activeRide.id,
      riderId,
      activeRide.userId,
      distanceRemaining,
      activeRide.status,
      targetLabel
    );

    return {
      success: true,
      distanceRemaining,
      eta,
    };
  } catch (error) {
    console.error('Error updating rider location:', error);
    throw error;
  }
};

/**
 * Calculate ETA based on distance and current speed
 */
export const calculateETA = (
  distanceKm: number,
  currentSpeed?: number
): ETACalculation => {
  // Use current speed if available, otherwise assume average Lagos speed
  const speed = currentSpeed && currentSpeed > 0 ? currentSpeed : 30; // 30 km/h average

  // Calculate time in hours, convert to minutes
  const timeInMinutes = (distanceKm / speed) * 60;

  // Add buffer based on distance (more buffer for longer distances)
  const bufferMinutes = Math.min(5, Math.max(2, timeInMinutes * 0.2));

  const totalMinutes = Math.ceil(timeInMinutes + bufferMinutes);

  // Calculate estimated arrival time
  const estimatedArrival = new Date();
  estimatedArrival.setMinutes(estimatedArrival.getMinutes() + totalMinutes);

  return {
    distanceRemaining: parseFloat(distanceKm.toFixed(2)),
    estimatedMinutes: totalMinutes,
    estimatedArrival,
  };
};

/**
 * Check and send milestone notifications
 * e.g., "Rider is 5 minutes away", "Rider is 1 km away"
 */
const checkMilestones = async (
  rideId: string,
  userId: string,
  distanceKm: number,
  etaMinutes: number
) => {
  // Define milestones
  const milestones = [
    { distance: 5, message: 'Rider is 5 km away' },
    { distance: 2, message: 'Rider is 2 km away' },
    { distance: 1, message: 'Rider is 1 km away' },
    { distance: 0.5, message: 'Rider is 500 meters away' },
    { time: 5, message: 'Rider will arrive in 5 minutes' },
    { time: 2, message: 'Rider will arrive in 2 minutes' },
    { time: 1, message: 'Rider will arrive in 1 minute' },
  ];

  // Check distance-based milestones
  for (const milestone of milestones.filter((m) => m.distance)) {
    if (distanceKm <= milestone.distance! && distanceKm > milestone.distance! - 0.1) {
      io.to(`user:${userId}`).emit('ride:milestone', {
        rideId,
        type: 'distance',
        value: milestone.distance,
        message: milestone.message,
      });
    }
  }

  // Check time-based milestones
  for (const milestone of milestones.filter((m) => m.time)) {
    if (etaMinutes <= milestone.time! && etaMinutes > milestone.time! - 0.5) {
      io.to(`user:${userId}`).emit('ride:milestone', {
        rideId,
        type: 'time',
        value: milestone.time,
        message: milestone.message,
      });
    }
  }
};

/**
 * Check if rider has entered geofence (arrived at location)
 */
const checkGeofence = async (
  rideId: string,
  riderId: string,
  userId: string,
  distanceKm: number,
  currentStatus: string,
  targetLabel: string
) => {
  // Geofence radius (100 meters = 0.1 km)
  const GEOFENCE_RADIUS = 0.1;

  if (distanceKm <= GEOFENCE_RADIUS) {
    if (currentStatus === 'ACCEPTED' && targetLabel === 'pickup') {
      // Rider has arrived at pickup
      io.to(`user:${userId}`).emit('ride:geofence-entered', {
        rideId,
        location: 'pickup',
        message: 'Your rider has arrived at the pickup location!',
      });

      io.to(`rider:${riderId}`).emit('ride:geofence-entered', {
        rideId,
        location: 'pickup',
        message: 'You have arrived at the pickup location',
      });
    } else if (currentStatus === 'IN_PROGRESS' && targetLabel === 'dropoff') {
      // Rider has arrived at dropoff
      io.to(`user:${userId}`).emit('ride:geofence-entered', {
        rideId,
        location: 'dropoff',
        message: 'You have arrived at your destination!',
      });

      io.to(`rider:${riderId}`).emit('ride:geofence-entered', {
        rideId,
        location: 'dropoff',
        message: 'You have arrived at the dropoff location',
      });
    }
  }
};

/**
 * Get real-time ride tracking info
 */
export const getRideTracking = async (rideId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      rider: {
        select: {
          id: true,
          currentLatitude: true,
          currentLongitude: true,
          lastLocationUpdate: true,
        },
      },
    },
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  if (!ride.rider) {
    return {
      rideId,
      status: ride.status,
      hasRider: false,
      message: 'No rider assigned yet',
    };
  }

  // Determine target location
  let targetLatitude: number;
  let targetLongitude: number;
  let targetLabel: string;

  if (ride.status === 'ACCEPTED' || ride.status === 'ARRIVED') {
    targetLatitude = ride.pickupLatitude;
    targetLongitude = ride.pickupLongitude;
    targetLabel = 'pickup';
  } else if (ride.status === 'IN_PROGRESS') {
    targetLatitude = ride.dropoffLatitude;
    targetLongitude = ride.dropoffLongitude;
    targetLabel = 'dropoff';
  } else {
    return {
      rideId,
      status: ride.status,
      message: 'Ride is not in active tracking state',
    };
  }

  // Calculate current distance and ETA
  const distanceRemaining = calculateDistance(
    ride.rider.currentLatitude!,
    ride.rider.currentLongitude!,
    targetLatitude,
    targetLongitude
  );

  const eta = calculateETA(distanceRemaining);

  return {
    rideId,
    status: ride.status,
    hasRider: true,
    riderLocation: {
      latitude: ride.rider.currentLatitude,
      longitude: ride.rider.currentLongitude,
      lastUpdate: ride.rider.lastLocationUpdate,
    },
    targetLocation: {
      latitude: targetLatitude,
      longitude: targetLongitude,
      label: targetLabel,
    },
    distanceRemaining,
    eta,
  };
};

/**
 * Start location tracking for a ride
 */
export const startLocationTracking = async (rideId: string, riderId: string) => {
  // Verify ride exists and rider is assigned
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  if (ride.riderId !== riderId) {
    throw new Error('You are not assigned to this ride');
  }

  if (!['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(ride.status)) {
    throw new Error('Ride is not in a trackable state');
  }

  // Notify user that tracking has started
  io.to(`user:${ride.userId}`).emit('ride:tracking-started', {
    rideId,
    message: 'Real-time tracking activated',
  });

  return {
    success: true,
    message: 'Location tracking started',
  };
};

/**
 * Stop location tracking for a ride
 */
export const stopLocationTracking = async (rideId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  // Notify user that tracking has stopped
  io.to(`user:${ride.userId}`).emit('ride:tracking-stopped', {
    rideId,
    message: 'Real-time tracking ended',
  });

  return {
    success: true,
    message: 'Location tracking stopped',
  };
};

/**
 * Calculate route polyline points for map display
 * This is a simplified version - in production, use Google Maps Directions API
 */
export const getRoutePolyline = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
) => {
  // For now, return a simple straight line
  // In production, integrate with Google Maps Directions API
  return {
    points: [
      { latitude: startLat, longitude: startLng },
      { latitude: endLat, longitude: endLng },
    ],
    distance: calculateDistance(startLat, startLng, endLat, endLng),
  };
};