import { PrismaClient } from '@prisma/client';
import { io } from '../server';

const prisma = new PrismaClient();

export interface CreateRatingData {
  rideId: string;
  fromUserId: string;
  toUserId: string;
  rating: number; // 1-5
  comment?: string;
}

/**
 * Create a rating for a completed ride
 */
export const createRating = async (data: CreateRatingData) => {
  const { rideId, fromUserId, toUserId, rating, comment } = data;

  // Verify ride exists and is completed
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      user: true,
      rider: {
        include: { user: true },
      },
    },
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  if (ride.status !== 'COMPLETED') {
    throw new Error('Can only rate completed rides');
  }

  // Check if user is part of the ride
  const isUser = ride.userId === fromUserId;
  const isRider = ride.rider?.userId === fromUserId;

  if (!isUser && !isRider) {
    throw new Error('You are not authorized to rate this ride');
  }

  // Check if rating already exists
  const existingRating = await prisma.rating.findUnique({
    where: { rideId },
  });

  if (existingRating) {
    throw new Error('This ride has already been rated');
  }

  // Validate toUserId matches the other party
  if (isUser && ride.rider?.userId !== toUserId) {
    throw new Error('Invalid recipient for rating');
  }

  if (isRider && ride.userId !== toUserId) {
    throw new Error('Invalid recipient for rating');
  }

  // Create rating
  const newRating = await prisma.rating.create({
    data: {
      rideId,
      fromUserId,
      toUserId,
      rating,
      comment,
    },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      ride: {
        select: {
          id: true,
          pickupAddress: true,
          dropoffAddress: true,
          finalFare: true,
          completedAt: true,
        },
      },
    },
  });

  // Update rider's rating if they were rated
  const riderProfile = await prisma.rider.findUnique({
    where: { userId: toUserId },
  });

  if (riderProfile) {
    await updateRiderRating(riderProfile.id);
  }

  // Send notification to rated user
  io.to(`user:${toUserId}`).emit('rating:received', {
    ratingId: newRating.id,
    rating: newRating.rating,
    fromUser: newRating.fromUser,
    rideId: newRating.rideId,
  });

  return newRating;
};

/**
 * Get rating for a specific ride
 */
export const getRideRating = async (rideId: string) => {
  const rating = await prisma.rating.findUnique({
    where: { rideId },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return rating;
};

/**
 * Get ratings given by a user
 */
export const getRatingsGivenByUser = async (userId: string, limit: number = 20) => {
  const ratings = await prisma.rating.findMany({
    where: { fromUserId: userId },
    include: {
      toUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      ride: {
        select: {
          id: true,
          pickupAddress: true,
          dropoffAddress: true,
          completedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return ratings;
};

/**
 * Get ratings received by a user
 */
export const getRatingsReceivedByUser = async (userId: string, limit: number = 20) => {
  const ratings = await prisma.rating.findMany({
    where: { toUserId: userId },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      ride: {
        select: {
          id: true,
          pickupAddress: true,
          dropoffAddress: true,
          completedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return ratings;
};

/**
 * Calculate and update rider's average rating
 */
export const updateRiderRating = async (riderId: string) => {
  // Get rider's user ID
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    select: { userId: true },
  });

  if (!rider) {
    throw new Error('Rider not found');
  }

  // Calculate average rating
  const ratings = await prisma.rating.findMany({
    where: { toUserId: rider.userId },
    select: { rating: true },
  });

  if (ratings.length === 0) {
    return; // No ratings yet
  }

  const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / ratings.length;

  // Update rider's rating
  await prisma.rider.update({
    where: { id: riderId },
    data: {
      rating: parseFloat(averageRating.toFixed(2)),
    },
  });

  return averageRating;
};

/**
 * Get rating statistics for a rider
 */
export const getRiderRatingStats = async (riderId: string) => {
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    select: { userId: true, rating: true },
  });

  if (!rider) {
    throw new Error('Rider not found');
  }

  // Get all ratings
  const ratings = await prisma.rating.findMany({
    where: { toUserId: rider.userId },
    select: { rating: true },
  });

  // Calculate distribution
  const distribution = {
    5: ratings.filter((r) => r.rating === 5).length,
    4: ratings.filter((r) => r.rating === 4).length,
    3: ratings.filter((r) => r.rating === 3).length,
    2: ratings.filter((r) => r.rating === 2).length,
    1: ratings.filter((r) => r.rating === 1).length,
  };

  return {
    averageRating: rider.rating,
    totalRatings: ratings.length,
    distribution,
  };
};

/**
 * Get rating statistics for a user
 */
export const getUserRatingStats = async (userId: string) => {
  // Get all ratings received
  const ratings = await prisma.rating.findMany({
    where: { toUserId: userId },
    select: { rating: true },
  });

  if (ratings.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  // Calculate average
  const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / ratings.length;

  // Calculate distribution
  const distribution = {
    5: ratings.filter((r) => r.rating === 5).length,
    4: ratings.filter((r) => r.rating === 4).length,
    3: ratings.filter((r) => r.rating === 3).length,
    2: ratings.filter((r) => r.rating === 2).length,
    1: ratings.filter((r) => r.rating === 1).length,
  };

  return {
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalRatings: ratings.length,
    distribution,
  };
};

/**
 * Check if user can rate a ride
 */
export const canRateRide = async (rideId: string, userId: string) => {
  // Get ride
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      rider: true,
      rating: true,
    },
  });

  if (!ride) {
    return {
      canRate: false,
      reason: 'Ride not found',
    };
  }

  // Check if completed
  if (ride.status !== 'COMPLETED') {
    return {
      canRate: false,
      reason: 'Ride is not completed yet',
    };
  }

  // Check if user is part of ride
  const isUser = ride.userId === userId;
  const isRider = ride.rider?.userId === userId;

  if (!isUser && !isRider) {
    return {
      canRate: false,
      reason: 'You are not part of this ride',
    };
  }

  // Check if already rated
  if (ride.rating) {
    return {
      canRate: false,
      reason: 'Ride has already been rated',
    };
  }

  return {
    canRate: true,
    rideDetails: {
      id: ride.id,
      pickupAddress: ride.pickupAddress,
      dropoffAddress: ride.dropoffAddress,
      completedAt: ride.completedAt,
      finalFare: ride.finalFare,
    },
  };
};

/**
 * Get recent ratings with comments (for display)
 */
export const getRecentRatingsWithComments = async (userId: string, limit: number = 10) => {
  const ratings = await prisma.rating.findMany({
    where: {
      toUserId: userId,
      comment: {
        not: null,
      },
    },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      ride: {
        select: {
          completedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return ratings;
};

/**
 * Get rides pending rating for a user
 */
export const getPendingRatings = async (userId: string) => {
  // Get completed rides where user participated
  const rides = await prisma.ride.findMany({
    where: {
      OR: [
        { userId },
        {
          rider: {
            userId,
          },
        },
      ],
      status: 'COMPLETED',
      rating: null, // No rating yet
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      rider: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: { completedAt: 'desc' },
    take: 10,
  });

  // Format response
  return rides.map((ride) => {
    const isUser = ride.userId === userId;
    const otherParty = isUser ? ride.rider?.user : ride.user;

    return {
      rideId: ride.id,
      pickupAddress: ride.pickupAddress,
      dropoffAddress: ride.dropoffAddress,
      completedAt: ride.completedAt,
      finalFare: ride.finalFare,
      otherParty,
      yourRole: isUser ? 'user' : 'rider',
    };
  });
};