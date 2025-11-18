import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as riderService from '../services/rider.service';
import { VehicleType } from '@prisma/client';
import { getFileUrl } from '../utils/upload.util';

/**
 * Register as a rider
 * POST /api/v1/riders/register
 */
export const register = async (req: Request, res: Response) => {
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
    await body('plateNumber')
      .trim()
      .notEmpty()
      .withMessage('Plate number is required')
      .run(req);
    await body('licenseNumber')
      .trim()
      .notEmpty()
      .withMessage('License number is required')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      vehicleType,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleColor,
      plateNumber,
      licenseNumber,
      licenseExpiryDate,
      insuranceNumber,
      insuranceExpiryDate,
      companyId,
    } = req.body;

    // Get uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const vehiclePhoto = files?.vehiclePhoto?.[0]?.filename;
    const licensePhoto = files?.licensePhoto?.[0]?.filename;

    const rider = await riderService.registerRider({
      userId: req.user.userId,
      vehicleType,
      vehicleMake,
      vehicleModel,
      vehicleYear: vehicleYear ? parseInt(vehicleYear) : undefined,
      vehicleColor,
      plateNumber: plateNumber.toUpperCase(),
      licenseNumber: licenseNumber.toUpperCase(),
      licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : undefined,
      insuranceNumber,
      insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : undefined,
      vehiclePhoto: vehiclePhoto ? `vehicles/${vehiclePhoto}` : undefined,
      licensePhoto: licensePhoto ? `licenses/${licensePhoto}` : undefined,
      companyId,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Rider registration submitted successfully. Awaiting approval.',
      data: rider,
    });
  } catch (error: any) {
    console.error('Rider registration error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Rider registration failed',
    });
  }
};

/**
 * Get rider profile
 * GET /api/v1/riders/profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: rider,
    });
  } catch (error: any) {
    console.error('Get rider profile error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get rider profile',
    });
  }
};

/**
 * Update rider profile
 * PATCH /api/v1/riders/profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    // Allowed update fields
    const allowedFields = [
      'vehicleMake',
      'vehicleModel',
      'vehicleYear',
      'vehicleColor',
      'insuranceNumber',
      'insuranceExpiryDate',
    ];

    const updates = Object.keys(req.body)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const updatedRider = await riderService.updateRiderProfile(rider.id, updates);

    return res.status(200).json({
      status: 'success',
      message: 'Rider profile updated successfully',
      data: updatedRider,
    });
  } catch (error: any) {
    console.error('Update rider profile error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to update rider profile',
    });
  }
};

/**
 * Upload rider documents
 * POST /api/v1/riders/documents
 */
export const uploadDocuments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files uploaded',
      });
    }

    const documents: any = {};

    if (files.vehiclePhoto) {
      documents.vehiclePhoto = `vehicles/${files.vehiclePhoto[0].filename}`;
    }

    if (files.licensePhoto) {
      documents.licensePhoto = `licenses/${files.licensePhoto[0].filename}`;
    }

    const updatedRider = await riderService.updateRiderDocuments(rider.id, documents);

    return res.status(200).json({
      status: 'success',
      message: 'Documents uploaded successfully',
      data: updatedRider,
    });
  } catch (error: any) {
    console.error('Upload documents error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to upload documents',
    });
  }
};

/**
 * Toggle availability
 * PATCH /api/v1/riders/availability
 */
export const toggleAvailability = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    await body('isAvailable')
      .isBoolean()
      .withMessage('isAvailable must be a boolean')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { isAvailable } = req.body;

    const updatedRider = await riderService.toggleRiderAvailability(rider.id, isAvailable);

    return res.status(200).json({
      status: 'success',
      message: `Rider is now ${isAvailable ? 'available' : 'unavailable'}`,
      data: updatedRider,
    });
  } catch (error: any) {
    console.error('Toggle availability error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to toggle availability',
    });
  }
};

/**
 * Update location
 * PATCH /api/v1/riders/location
 */
export const updateLocation = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    await body('latitude').isFloat().withMessage('Invalid latitude').run(req);
    await body('longitude').isFloat().withMessage('Invalid longitude').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { latitude, longitude } = req.body;

    await riderService.updateRiderLocation(
      rider.id,
      parseFloat(latitude),
      parseFloat(longitude)
    );

    return res.status(200).json({
      status: 'success',
      message: 'Location updated successfully',
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
 * Get rider statistics
 * GET /api/v1/riders/statistics
 */
export const getStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const rider = await riderService.getRiderByUserId(req.user.userId);

    if (!rider) {
      return res.status(404).json({
        status: 'error',
        message: 'Rider profile not found',
      });
    }

    const statistics = await riderService.getRiderStatistics(rider.id);

    return res.status(200).json({
      status: 'success',
      data: statistics,
    });
  } catch (error: any) {
    console.error('Get statistics error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get statistics',
    });
  }
};

/**
 * Get all approved riders (public)
 * GET /api/v1/riders
 */
export const getApprovedRiders = async (req: Request, res: Response) => {
  try {
    const riders = await riderService.getApprovedRiders();

    return res.status(200).json({
      status: 'success',
      data: riders,
    });
  } catch (error: any) {
    console.error('Get approved riders error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get riders',
    });
  }
};