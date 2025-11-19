import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as locationService from '../services/location.service';
import * as riderService from '../services/rider.service';

/**
 * Update rider location (called frequently by rider app)
 * PATCH /api/v1/location/update
 */
export const updateLocation = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Validate request
    await body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude')
      .run(req);
    await body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude')
      .run(req);
    await body('heading')
      .optional()
      .isFloat({ min: 0, max: 360 })
      .withMessage('Heading must be between 0 and 360')
      .run(req);
    await body('speed')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Speed must be positive')
      .run(req);
    await body('accuracy')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Accuracy must be positive')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    // Get rider
    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    const { latitude, longitude, heading, speed, accuracy } = req.body;

    // Update location
    const result = await locationService.updateRiderLocation({
      riderId: rider.id,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      heading: heading ? parseFloat(heading) : undefined,
      speed: speed ? parseFloat(speed) : undefined,
      accuracy: accuracy ? parseFloat(accuracy) : undefined,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Location updated',
      data: result,
    });
  } catch (error: any) {
    console.error('Update location error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to update location',
    });
  }
};

/**
 * Get real-time tracking info for a ride
 * GET /api/v1/location/tracking/:rideId
 */
export const getTracking = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { rideId } = req.params;

    const tracking = await locationService.getRideTracking(rideId);

    return res.status(200).json({
      status: 'success',
      data: tracking,
    });
  } catch (error: any) {
    console.error('Get tracking error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get tracking info',
    });
  }
};

/**
 * Start location tracking for a ride
 * POST /api/v1/location/tracking/:rideId/start
 */
export const startTracking = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { rideId } = req.params;

    // Get rider
    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    const result = await locationService.startLocationTracking(rideId, rider.id);

    return res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error: any) {
    console.error('Start tracking error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to start tracking',
    });
  }
};

/**
 * Stop location tracking for a ride
 * POST /api/v1/location/tracking/:rideId/stop
 */
export const stopTracking = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { rideId } = req.params;

    const result = await locationService.stopLocationTracking(rideId);

    return res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error: any) {
    console.error('Stop tracking error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to stop tracking',
    });
  }
};

/**
 * Get route polyline between two points
 * GET /api/v1/location/route
 */
export const getRoute = async (req: Request, res: Response) => {
  try {
    const { startLat, startLng, endLat, endLng } = req.query;

    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: startLat, startLng, endLat, endLng',
      });
    }

    const route = await locationService.getRoutePolyline(
      parseFloat(startLat as string),
      parseFloat(startLng as string),
      parseFloat(endLat as string),
      parseFloat(endLng as string)
    );

    return res.status(200).json({
      status: 'success',
      data: route,
    });
  } catch (error: any) {
    console.error('Get route error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get route',
    });
  }
};