import { PrismaClient, VehicleType, RiderStatus } from '@prisma/client';
import { findNearbyRiders } from './ride.service';
import { io } from '../server';

const prisma = new PrismaClient();

export interface MatchingPreferences {
  prioritizeRating?: boolean; // Prioritize highly-rated riders
  prioritizeDistance?: boolean; // Prioritize nearest riders (default)
  maxSearchRadius?: number; // Maximum search radius in km (default: 5km)
  notificationTimeout?: number; // Time to wait for rider response in seconds (default: 30s)
}

/**
 * Find and notify nearby riders about a new ride request
 */
export const findAndNotifyRiders = async (
  rideId: string,
  pickupLatitude: number,
  pickupLongitude: number,
  vehicleType: VehicleType,
  preferences: MatchingPreferences = {}
) => {
  const {
    prioritizeRating = false,
    prioritizeDistance = true,
    maxSearchRadius = 5,
    notificationTimeout = 30,
  } = preferences;

  try {
    // Find nearby available riders
    let nearbyRiders = await findNearbyRiders(
      pickupLatitude,
      pickupLongitude,
      vehicleType,
      maxSearchRadius
    );

    if (nearbyRiders.length === 0) {
      // No riders found - expand search radius
      console.log(`No riders found within ${maxSearchRadius}km, expanding search...`);
      nearbyRiders = await findNearbyRiders(
        pickupLatitude,
        pickupLongitude,
        vehicleType,
        maxSearchRadius * 2 // Double the radius
      );
    }

    if (nearbyRiders.length === 0) {
      return {
        success: false,
        message: 'No available riders found in your area',
        ridersNotified: 0,
      };
    }

    // Sort riders based on preferences
    if (prioritizeRating && !prioritizeDistance) {
      // Sort by rating (highest first)
      nearbyRiders.sort((a, b) => b.rating - a.rating);
    } else if (prioritizeDistance && !prioritizeRating) {
      // Already sorted by distance in findNearbyRiders
    } else {
      // Balanced approach: combine rating and distance
      nearbyRiders.sort((a, b) => {
        const scoreA = a.rating * 0.4 - a.distanceFromPickup * 0.6;
        const scoreB = b.rating * 0.4 - b.distanceFromPickup * 0.6;
        return scoreB - scoreA;
      });
    }

    // Get the ride details
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    // Notify riders via WebSocket
    const notificationPromises = nearbyRiders.map((rider) => {
      return new Promise<void>((resolve) => {
        io.to(`rider:${rider.id}`).emit('ride:new-request', {
          rideId: ride.id,
          user: ride.user,
          pickupLocation: {
            latitude: ride.pickupLatitude,
            longitude: ride.pickupLongitude,
            address: ride.pickupAddress,
          },
          dropoffLocation: {
            latitude: ride.dropoffLatitude,
            longitude: ride.dropoffLongitude,
            address: ride.dropoffAddress,
          },
          distance: ride.distance,
          estimatedFare: ride.finalFare,
          distanceFromYou: rider.distanceFromPickup,
          expiresIn: notificationTimeout,
        });

        console.log(`✅ Notified rider ${rider.id} about ride ${rideId}`);
        resolve();
      });
    });

    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);

    // Set timeout for ride request
    setTimeout(async () => {
      // Check if ride is still pending
      const currentRide = await prisma.ride.findUnique({
        where: { id: rideId },
      });

      if (currentRide && currentRide.status === 'PENDING') {
        // No rider accepted - try expanding search or cancel
        console.log(`⏰ Ride ${rideId} expired - no rider accepted`);
        
        // Notify user
        io.to(`user:${currentRide.userId}`).emit('ride:no-riders-available', {
          rideId: currentRide.id,
          message: 'No riders available at the moment. Please try again.',
        });

        // Optionally auto-cancel the ride
        await prisma.ride.update({
          where: { id: rideId },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: 'No riders available',
          },
        });
      }
    }, notificationTimeout * 1000);

    return {
      success: true,
      message: `Notified ${nearbyRiders.length} rider(s)`,
      ridersNotified: nearbyRiders.length,
      nearestRider: nearbyRiders[0],
    };
  } catch (error) {
    console.error('Error in findAndNotifyRiders:', error);
    throw error;
  }
};

/**
 * Automatically assign ride to the best available rider
 */
export const autoAssignRider = async (
  rideId: string,
  pickupLatitude: number,
  pickupLongitude: number,
  vehicleType: VehicleType
) => {
  try {
    // Find nearby riders
    const nearbyRiders = await findNearbyRiders(
      pickupLatitude,
      pickupLongitude,
      vehicleType,
      5
    );

    if (nearbyRiders.length === 0) {
      return {
        success: false,
        message: 'No available riders found',
      };
    }

    // Get the best rider (nearest with good rating)
    const bestRider = nearbyRiders[0];

    // Check if rider is still available
    const rider = await prisma.rider.findUnique({
      where: { id: bestRider.id },
    });

    if (!rider || !rider.isAvailable || !rider.isOnline) {
      return {
        success: false,
        message: 'Selected rider is no longer available',
      };
    }

    // Assign ride
    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        riderId: bestRider.id,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: {
        user: true,
        rider: {
          include: { user: true },
        },
      },
    });

    // Mark rider as unavailable
    await prisma.rider.update({
      where: { id: bestRider.id },
      data: { isAvailable: false },
    });

    // Notify both user and rider
    io.to(`user:${updatedRide.userId}`).emit('ride:accepted', {
      rideId: updatedRide.id,
      rider: updatedRide.rider,
    });

    io.to(`rider:${bestRider.id}`).emit('ride:auto-assigned', {
      rideId: updatedRide.id,
      ride: updatedRide,
    });

    return {
      success: true,
      message: 'Ride auto-assigned successfully',
      ride: updatedRide,
    };
  } catch (error) {
    console.error('Error in autoAssignRider:', error);
    throw error;
  }
};

/**
 * Handle rider accepting a ride
 */
export const handleRiderAcceptance = async (rideId: string, riderId: string) => {
  try {
    // Get the ride
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    // Check if ride is still pending
    if (ride.status !== 'PENDING') {
      return {
        success: false,
        message: 'Ride is no longer available',
      };
    }

    // Check if rider is available
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider || !rider.isAvailable || !rider.isOnline) {
      return {
        success: false,
        message: 'You are not available to accept rides',
      };
    }

    // Accept the ride
    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        riderId,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: {
        user: true,
        rider: {
          include: { user: true },
        },
      },
    });

    // Mark rider as unavailable
    await prisma.rider.update({
      where: { id: riderId },
      data: { isAvailable: false },
    });

    // Notify user that ride was accepted
    io.to(`user:${updatedRide.userId}`).emit('ride:accepted', {
      rideId: updatedRide.id,
      rider: updatedRide.rider,
      message: `${updatedRide.rider?.user.name} is on the way!`,
    });

    // Notify other riders that ride was taken
    io.emit('ride:no-longer-available', {
      rideId: updatedRide.id,
    });

    console.log(`✅ Ride ${rideId} accepted by rider ${riderId}`);

    return {
      success: true,
      message: 'Ride accepted successfully',
      ride: updatedRide,
    };
  } catch (error) {
    console.error('Error in handleRiderAcceptance:', error);
    throw error;
  }
};

/**
 * Handle rider declining a ride
 */
export const handleRiderDecline = async (rideId: string, riderId: string) => {
  try {
    console.log(`Rider ${riderId} declined ride ${rideId}`);

    // Just log it - no need to do anything else
    // Other riders can still accept

    return {
      success: true,
      message: 'Ride declined',
    };
  } catch (error) {
    console.error('Error in handleRiderDecline:', error);
    throw error;
  }
};

/**
 * Get estimated time of arrival for rider
 */
export const getEstimatedArrivalTime = (distanceKm: number): number => {
  // Assume average speed of 30 km/h in Lagos traffic
  const averageSpeed = 30;
  const timeInMinutes = (distanceKm / averageSpeed) * 60;
  
  // Add buffer time (2-5 minutes)
  const bufferTime = Math.min(5, Math.max(2, timeInMinutes * 0.2));
  
  return Math.ceil(timeInMinutes + bufferTime);
};