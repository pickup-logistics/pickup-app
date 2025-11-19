import { PrismaClient, RideStatus, PaymentMethod, PaymentStatus, VehicleType, RiderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateRideData {
  userId: string;
  vehicleType: VehicleType;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  dropoffAddress: string;
  notes?: string;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return parseFloat(distance.toFixed(2));
};

/**
 * Calculate fare based on distance
 */
export const calculateFare = (distance: number): { baseFare: number; perKmRate: number; totalFare: number } => {
  const baseFare = parseFloat(process.env.BASE_FARE || '200');
  const perKmRate = parseFloat(process.env.PER_KM_RATE || '100');
  const totalFare = baseFare + distance * perKmRate;

  return {
    baseFare,
    perKmRate,
    totalFare: parseFloat(totalFare.toFixed(2)),
  };
};

/**
 * Find nearby available riders
 */
export const findNearbyRiders = async (
  latitude: number,
  longitude: number,
  vehicleType: VehicleType,
  radiusKm: number = 5
) => {
  // Get all available riders of the requested vehicle type
  const riders = await prisma.rider.findMany({
    where: {
      vehicleType,
      status: RiderStatus.APPROVED,
      isAvailable: true,
      isOnline: true,
      currentLatitude: { not: null },
      currentLongitude: { not: null },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
        },
      },
    },
  });

  // Calculate distance to each rider and filter by radius
  const ridersWithDistance = riders
    .map((rider) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        rider.currentLatitude!,
        rider.currentLongitude!
      );

      return {
        ...rider,
        distanceFromPickup: distance,
      };
    })
    .filter((rider) => rider.distanceFromPickup <= radiusKm)
    .sort((a, b) => a.distanceFromPickup - b.distanceFromPickup);

  return ridersWithDistance;
};

/**
 * Create a new ride request
 */
export const createRide = async (data: CreateRideData) => {
  const {
    userId,
    vehicleType,
    pickupLatitude,
    pickupLongitude,
    pickupAddress,
    dropoffLatitude,
    dropoffLongitude,
    dropoffAddress,
    notes,
  } = data;

  // Calculate distance
  const distance = calculateDistance(pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude);

  // Calculate fare
  const { baseFare, perKmRate, totalFare } = calculateFare(distance);

  // Create ride
  const ride = await prisma.ride.create({
    data: {
      userId,
      vehicleType,
      pickupLatitude,
      pickupLongitude,
      pickupAddress,
      dropoffLatitude,
      dropoffLongitude,
      dropoffAddress,
      distance,
      baseFare,
      perKmRate,
      totalFare,
      finalFare: totalFare,
      notes,
      status: RideStatus.PENDING,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PENDING,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
        },
      },
    },
  });

  // Find nearby riders
  const nearbyRiders = await findNearbyRiders(pickupLatitude, pickupLongitude, vehicleType);

  return {
    ride,
    nearbyRiders,
  };
};

/**
 * Get ride by ID
 */
export const getRideById = async (rideId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
        },
      },
      rider: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
      rating: true,
    },
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  return ride;
};

/**
 * Accept ride (Rider)
 */
export const acceptRide = async (rideId: string, riderId: string) => {
  // Get ride
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  if (ride.status !== RideStatus.PENDING) {
    throw new Error('Ride is not available for acceptance');
  }

  // Get rider
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
  });

  if (!rider) {
    throw new Error('Rider not found');
  }

  if (rider.status !== RiderStatus.APPROVED) {
    throw new Error('Rider is not approved');
  }

  if (!rider.isAvailable || !rider.isOnline) {
    throw new Error('Rider is not available');
  }

  // Accept ride
  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      riderId,
      status: RideStatus.ACCEPTED,
      acceptedAt: new Date(),
    },
    include: {
      user: true,
      rider: {
        include: {
          user: true,
        },
      },
    },
  });

  // Mark rider as unavailable
  await prisma.rider.update({
    where: { id: riderId },
    data: { isAvailable: false },
  });

  return updatedRide;
};

/**
 * Decline ride (Rider)
 */
export const declineRide = async (rideId: string, riderId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  // Just return - rider can't decline if already accepted by someone else
  return { message: 'Ride declined' };
};

/**
 * Mark rider arrived at pickup
 */
export const markRiderArrived = async (rideId: string, riderId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  if (ride.riderId !== riderId) {
    throw new Error('You are not assigned to this ride');
  }

  if (ride.status !== RideStatus.ACCEPTED) {
    throw new Error('Cannot mark arrived for this ride status');
  }

  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: RideStatus.ARRIVED,
      arrivedAt: new Date(),
    },
    include: {
      user: true,
      rider: {
        include: { user: true },
      },
    },
  });

  return updatedRide;
};

/**
 * Start ride
 */
export const startRide = async (rideId: string, riderId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  if (ride.riderId !== riderId) {
    throw new Error('You are not assigned to this ride');
  }

  if (ride.status !== RideStatus.ARRIVED) {
    throw new Error('Cannot start ride from this status');
  }

  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: RideStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
    include: {
      user: true,
      rider: {
        include: { user: true },
      },
    },
  });

  return updatedRide;
};

/**
 * Complete ride
 */
export const completeRide = async (rideId: string, riderId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  if (ride.riderId !== riderId) {
    throw new Error('You are not assigned to this ride');
  }

  if (ride.status !== RideStatus.IN_PROGRESS) {
    throw new Error('Cannot complete ride from this status');
  }

  // Complete ride
  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: RideStatus.COMPLETED,
      completedAt: new Date(),
      paymentStatus: PaymentStatus.COMPLETED, // Auto-complete for cash
    },
    include: {
      user: true,
      rider: {
        include: { user: true },
      },
    },
  });

  // Update rider statistics
  await prisma.rider.update({
    where: { id: riderId },
    data: {
      totalRides: { increment: 1 },
      completedRides: { increment: 1 },
      totalEarnings: { increment: ride.finalFare },
      isAvailable: true, // Make available again
    },
  });

  return updatedRide;
};

/**
 * Cancel ride
 */
export const cancelRide = async (rideId: string, userId: string, reason?: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: { rider: true },
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  if (ride.userId !== userId) {
    throw new Error('You can only cancel your own rides');
  }

  if (ride.status === RideStatus.COMPLETED || ride.status === RideStatus.CANCELLED) {
    throw new Error('Cannot cancel this ride');
  }

  // Cancel ride
  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: RideStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledBy: userId,
      cancellationReason: reason,
    },
  });

  // If rider was assigned, make them available again and update stats
  if (ride.riderId) {
    await prisma.rider.update({
      where: { id: ride.riderId },
      data: {
        isAvailable: true,
        totalRides: { increment: 1 },
        cancelledRides: { increment: 1 },
      },
    });
  }

  return updatedRide;
};

/**
 * Get user's ride history
 */
export const getUserRideHistory = async (userId: string, limit: number = 20) => {
  const rides = await prisma.ride.findMany({
    where: { userId },
    include: {
      rider: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
      rating: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return rides;
};

/**
 * Get rider's ride history
 */
export const getRiderRideHistory = async (riderId: string, limit: number = 20) => {
  const rides = await prisma.ride.findMany({
    where: { riderId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
        },
      },
      rating: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return rides;
};

/**
 * Get active ride for user
 */
export const getActiveUserRide = async (userId: string) => {
  const ride = await prisma.ride.findFirst({
    where: {
      userId,
      status: {
        in: [RideStatus.PENDING, RideStatus.ACCEPTED, RideStatus.ARRIVED, RideStatus.IN_PROGRESS],
      },
    },
    include: {
      rider: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return ride;
};

/**
 * Get active ride for rider
 */
export const getActiveRiderRide = async (riderId: string) => {
  const ride = await prisma.ride.findFirst({
    where: {
      riderId,
      status: {
        in: [RideStatus.ACCEPTED, RideStatus.ARRIVED, RideStatus.IN_PROGRESS],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return ride;
};