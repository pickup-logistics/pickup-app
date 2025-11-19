import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as rideService from '../services/ride.service';
import { VehicleType } from '@prisma/client';
import * as riderService from '../services/rider.service';
import * as matchingService from '../services/matching.service';

/**
 * Create ride request
 * POST /api/v1/rides
 */
export const createRide = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Validate request
    await body('vehicleType')
      .isIn(Object.values(VehicleType))
      .withMessage('Invalid vehicle type')
      .run(req);
    await body('pickupLatitude').isFloat().withMessage('Invalid pickup latitude').run(req);
    await body('pickupLongitude').isFloat().withMessage('Invalid pickup longitude').run(req);
    await body('pickupAddress').trim().notEmpty().withMessage('Pickup address is required').run(req);
    await body('dropoffLatitude').isFloat().withMessage('Invalid dropoff latitude').run(req);
    await body('dropoffLongitude').isFloat().withMessage('Invalid dropoff longitude').run(req);
    await body('dropoffAddress').trim().notEmpty().withMessage('Dropoff address is required').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    // Check if user has an active ride
    const activeRide = await rideService.getActiveUserRide(req.user.userId);
    if (activeRide) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active ride',
        data: activeRide,
      });
    }

    const {
      vehicleType,
      pickupLatitude,
      pickupLongitude,
      pickupAddress,
      dropoffLatitude,
      dropoffLongitude,
      dropoffAddress,
      notes,
    } = req.body;

    // Create ride
    const result = await rideService.createRide({
      userId: req.user.userId,
      vehicleType,
      pickupLatitude: parseFloat(pickupLatitude),
      pickupLongitude: parseFloat(pickupLongitude),
      pickupAddress,
      dropoffLatitude: parseFloat(dropoffLatitude),
      dropoffLongitude: parseFloat(dropoffLongitude),
      dropoffAddress,
      notes,
    });

    // Find and notify nearby riders
    const matchingResult = await matchingService.findAndNotifyRiders(
      result.ride.id,
      parseFloat(pickupLatitude),
      parseFloat(pickupLongitude),
      vehicleType
    );

    return res.status(201).json({
      status: 'success',
      message: matchingResult.success
        ? `Ride created successfully. ${matchingResult.message}`
        : 'Ride created but no riders available at the moment',
      data: {
        ride: result.ride,
        nearbyRiders: result.nearbyRiders,
        ridersNotified: matchingResult.ridersNotified,
      },
    });
  } catch (error: any) {
    console.error('Create ride error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to create ride',
    });
  }
};

/**
 * Get ride details
 * GET /api/v1/rides/:id
 */
export const getRide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ride = await rideService.getRideById(id);

    return res.status(200).json({
      status: 'success',
      data: ride,
    });
  } catch (error: any) {
    console.error('Get ride error:', error);
    return res.status(404).json({
      status: 'error',
      message: error.message || 'Ride not found',
    });
  }
};

/**
 * Accept ride (Rider)
 * POST /api/v1/rides/:id/accept
 */
export const acceptRide = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    // Get rider profile
    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    // Check if rider has an active ride
    const activeRide = await rideService.getActiveRiderRide(rider.id);
    if (activeRide) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active ride',
        data: activeRide,
      });
    }

    // Use matching service to handle acceptance
    const result = await matchingService.handleRiderAcceptance(id, rider.id);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.message,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: result.message,
      data: result.ride,
    });
  } catch (error: any) {
    console.error('Accept ride error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to accept ride',
    });
  }
};

/**
 * Decline ride (Rider)
 * POST /api/v1/rides/:id/decline
 */
export const declineRide = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    const result = await matchingService.handleRiderDecline(id, rider.id);

    return res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error: any) {
    console.error('Decline ride error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to decline ride',
    });
  }
};

/**
 * Mark arrived at pickup
 * POST /api/v1/rides/:id/arrived
 */
export const markArrived = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    const ride = await rideService.markRiderArrived(id, rider.id);

    return res.status(200).json({
      status: 'success',
      message: 'Marked as arrived at pickup location',
      data: ride,
    });
  } catch (error: any) {
    console.error('Mark arrived error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to mark arrived',
    });
  }
};

/**
 * Start ride
 * POST /api/v1/rides/:id/start
 */
export const startRide = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    const ride = await rideService.startRide(id, rider.id);

    return res.status(200).json({
      status: 'success',
      message: 'Ride started',
      data: ride,
    });
  } catch (error: any) {
    console.error('Start ride error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to start ride',
    });
  }
};

/**
 * Complete ride
 * POST /api/v1/rides/:id/complete
 */
export const completeRide = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    const ride = await rideService.completeRide(id, rider.id);

    return res.status(200).json({
      status: 'success',
      message: 'Ride completed successfully',
      data: ride,
    });
  } catch (error: any) {
    console.error('Complete ride error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to complete ride',
    });
  }
};

/**
 * Cancel ride
 * POST /api/v1/rides/:id/cancel
 */
export const cancelRide = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const ride = await rideService.cancelRide(id, req.user.userId, reason);

    return res.status(200).json({
      status: 'success',
      message: 'Ride cancelled',
      data: ride,
    });
  } catch (error: any) {
    console.error('Cancel ride error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to cancel ride',
    });
  }
};

/**
 * Get ride history
 * GET /api/v1/rides/history
 */
export const getRideHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const limit = parseInt(req.query.limit as string) || 20;

    // Check if user is a rider
    const rider = await riderService.getRiderByUserId(req.user.userId);

    let rides;
    if (rider) {
      // Get rider's ride history
      rides = await rideService.getRiderRideHistory(rider.id, limit);
    } else {
      // Get user's ride history
      rides = await rideService.getUserRideHistory(req.user.userId, limit);
    }

    return res.status(200).json({
      status: 'success',
      data: rides,
    });
  } catch (error: any) {
    console.error('Get ride history error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get ride history',
    });
  }
};

/**
 * Get active ride
 * GET /api/v1/rides/active
 */
export const getActiveRide = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Check if user is a rider
    const rider = await riderService.getRiderByUserId(req.user.userId);

    let ride;
    if (rider) {
      // Get rider's active ride
      ride = await rideService.getActiveRiderRide(rider.id);
    } else {
      // Get user's active ride
      ride = await rideService.getActiveUserRide(req.user.userId);
    }

    if (!ride) {
      return res.status(404).json({
        status: 'error',
        message: 'No active ride found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: ride,
    });
  } catch (error: any) {
    console.error('Get active ride error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get active ride',
    });
  }
};