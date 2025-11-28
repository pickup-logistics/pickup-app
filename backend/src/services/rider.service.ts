import { PrismaClient, VehicleType, RiderStatus } from '@prisma/client';
import { deleteFile } from '../utils/upload.util';
import { monnifyService } from './monnify.service';

const prisma = new PrismaClient();

export interface RiderRegistrationData {
  userId: string;
  vehicleType: VehicleType;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  plateNumber: string;
  licenseNumber: string;
  licenseExpiryDate?: Date;
  insuranceNumber?: string;
  insuranceExpiryDate?: Date;
  vehiclePhoto?: string;
  licensePhoto?: string;
  companyId?: string;
}

/**
 * Register as a rider
 */
export const registerRider = async (data: RiderRegistrationData) => {
  const { userId, plateNumber, licenseNumber, ...restData } = data;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if user already has a rider profile
  const existingRider = await prisma.rider.findUnique({
    where: { userId },
  });

  if (existingRider) {
    throw new Error('User already has a rider profile');
  }

  // Check if plate number already exists
  const existingPlate = await prisma.rider.findUnique({
    where: { plateNumber },
  });

  if (existingPlate) {
    throw new Error('This plate number is already registered');
  }

  // Check if license number already exists
  const existingLicense = await prisma.rider.findUnique({
    where: { licenseNumber },
  });

  if (existingLicense) {
    throw new Error('This license number is already registered');
  }

  // Create rider profile
  const rider = await prisma.rider.create({
    data: {
      userId,
      plateNumber,
      licenseNumber,
      ...restData,
      status: RiderStatus.PENDING,
    },
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Reserve bank account
  let bankDetails = {};
  try {
    const accountDetails = await monnifyService.reserveAccount(user.name, user.email!, '23456789002');
    if (accountDetails) {
      bankDetails = {
        bankName: accountDetails.bankName,
        accountNumber: accountDetails.accountNumber,
        accountName: accountDetails.accountName,
        bankCode: accountDetails.bankCode,
        accountReference: accountDetails.accountReference,
      };
    }
  } catch (error) {
    console.error('Failed to reserve account:', error);
    // Continue with registration even if account reservation fails
  }

  // Update user role to RIDER and save bank details
  await prisma.user.update({
    where: { id: userId },
    data: {
      role: 'RIDER',
      ...bankDetails
    },
  });

  // Generate new tokens with updated role
  const { generateTokens } = await import('../utils/jwt.util');
  const tokens = generateTokens(userId, user.phone, 'RIDER');

  // Fetch the complete updated user profile with rider data
  const { getUserProfile } = await import('./auth.service');
  const updatedUserProfile = await getUserProfile(userId);

  return {
    rider,
    user: updatedUserProfile,
    tokens,
  };
};

/**
 * Get rider profile
 */
export const getRiderProfile = async (riderId: string) => {
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  if (!rider) {
    throw new Error('Rider not found');
  }

  return rider;
};

/**
 * Get rider by user ID
 */
export const getRiderByUserId = async (userId: string) => {
  const rider = await prisma.rider.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      company: true,
    },
  });

  return rider;
};

/**
 * Update rider profile
 */
export const updateRiderProfile = async (riderId: string, data: Partial<RiderRegistrationData>) => {
  // Don't allow updating certain fields after creation
  const { userId, plateNumber, licenseNumber, ...updateData } = data as any;

  const rider = await prisma.rider.update({
    where: { id: riderId },
    data: updateData,
    include: {
      user: true,
    },
  });

  return rider;
};

/**
 * Update rider documents
 */
export const updateRiderDocuments = async (
  riderId: string,
  documents: {
    vehiclePhoto?: string;
    licensePhoto?: string;
  }
) => {
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
  });

  if (!rider) {
    throw new Error('Rider not found');
  }

  // Delete old files if new ones provided
  if (documents.vehiclePhoto && rider.vehiclePhoto) {
    deleteFile(rider.vehiclePhoto);
  }
  if (documents.licensePhoto && rider.licensePhoto) {
    deleteFile(rider.licensePhoto);
  }

  // Update rider with new document paths
  const updatedRider = await prisma.rider.update({
    where: { id: riderId },
    data: documents,
  });

  return updatedRider;
};

/**
 * Toggle rider availability
 */
export const toggleRiderAvailability = async (riderId: string, isAvailable: boolean) => {
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
  });

  if (!rider) {
    throw new Error('Rider not found');
  }

  if (rider.status !== RiderStatus.APPROVED) {
    throw new Error('Only approved riders can change availability');
  }

  const updatedRider = await prisma.rider.update({
    where: { id: riderId },
    data: { isAvailable },
  });

  return updatedRider;
};

/**
 * Update rider online status
 */
export const updateRiderOnlineStatus = async (riderId: string, isOnline: boolean) => {
  const updatedRider = await prisma.rider.update({
    where: { id: riderId },
    data: { isOnline },
  });

  return updatedRider;
};

/**
 * Update rider location
 */
export const updateRiderLocation = async (
  riderId: string,
  latitude: number,
  longitude: number
) => {
  const updatedRider = await prisma.rider.update({
    where: { id: riderId },
    data: {
      currentLatitude: latitude,
      currentLongitude: longitude,
      lastLocationUpdate: new Date(),
    },
  });

  return updatedRider;
};

/**
 * Get all pending riders (for admin approval)
 */
export const getPendingRiders = async () => {
  const riders = await prisma.rider.findMany({
    where: { status: RiderStatus.PENDING },
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return riders;
};

/**
 * Get all approved riders
 */
export const getApprovedRiders = async () => {
  const riders = await prisma.rider.findMany({
    where: { status: RiderStatus.APPROVED },
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: { rating: 'desc' },
  });

  return riders;
};

/**
 * Approve rider (Admin only)
 */
export const approveRider = async (riderId: string) => {
  const rider = await prisma.rider.update({
    where: { id: riderId },
    data: {
      status: RiderStatus.APPROVED,
      approvedAt: new Date(),
    },
    include: {
      user: true,
    },
  });

  return rider;
};

/**
 * Reject rider (Admin only)
 */
export const rejectRider = async (riderId: string) => {
  const rider = await prisma.rider.update({
    where: { id: riderId },
    data: {
      status: RiderStatus.REJECTED,
    },
    include: {
      user: true,
    },
  });

  return rider;
};

/**
 * Suspend rider (Admin only)
 */
export const suspendRider = async (riderId: string) => {
  const rider = await prisma.rider.update({
    where: { id: riderId },
    data: {
      status: RiderStatus.SUSPENDED,
      isAvailable: false,
      isOnline: false,
    },
    include: {
      user: true,
    },
  });

  return rider;
};

/**
 * Get rider statistics
 */
export const getRiderStatistics = async (riderId: string) => {
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    select: {
      id: true,
      rating: true,
      totalRides: true,
      completedRides: true,
      cancelledRides: true,
      totalEarnings: true,
    },
  });

  if (!rider) {
    throw new Error('Rider not found');
  }

  // Calculate additional stats
  const completionRate =
    rider.totalRides > 0 ? (rider.completedRides / rider.totalRides) * 100 : 0;
  const cancellationRate =
    rider.totalRides > 0 ? (rider.cancelledRides / rider.totalRides) * 100 : 0;
  const averageEarningsPerRide =
    rider.completedRides > 0 ? rider.totalEarnings / rider.completedRides : 0;

  return {
    ...rider,
    completionRate: parseFloat(completionRate.toFixed(2)),
    cancellationRate: parseFloat(cancellationRate.toFixed(2)),
    averageEarningsPerRide: parseFloat(averageEarningsPerRide.toFixed(2)),
  };
};

/**
 * Search riders
 */
export const searchRiders = async (query: {
  status?: RiderStatus;
  vehicleType?: VehicleType;
  isAvailable?: boolean;
  isOnline?: boolean;
}) => {
  const riders = await prisma.rider.findMany({
    where: query,
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return riders;
};