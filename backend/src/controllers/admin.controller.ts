import { Request, Response } from 'express';
import * as riderService from '../services/rider.service';
import { RiderStatus, VehicleType } from '@prisma/client';

/**
 * Get all pending riders
 * GET /api/v1/admin/riders/pending
 */
export const getPendingRiders = async (req: Request, res: Response) => {
  try {
    const riders = await riderService.getPendingRiders();

    return res.status(200).json({
      status: 'success',
      data: riders,
    });
  } catch (error: any) {
    console.error('Get pending riders error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get pending riders',
    });
  }
};

/**
 * Approve rider
 * POST /api/v1/admin/riders/:id/approve
 */
export const approveRider = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rider = await riderService.approveRider(id);

    // TODO: Send notification to rider about approval

    return res.status(200).json({
      status: 'success',
      message: 'Rider approved successfully',
      data: rider,
    });
  } catch (error: any) {
    console.error('Approve rider error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to approve rider',
    });
  }
};

/**
 * Reject rider
 * POST /api/v1/admin/riders/:id/reject
 */
export const rejectRider = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rider = await riderService.rejectRider(id);

    // TODO: Send notification to rider about rejection

    return res.status(200).json({
      status: 'success',
      message: 'Rider rejected',
      data: rider,
    });
  } catch (error: any) {
    console.error('Reject rider error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to reject rider',
    });
  }
};

/**
 * Suspend rider
 * POST /api/v1/admin/riders/:id/suspend
 */
export const suspendRider = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rider = await riderService.suspendRider(id);

    // TODO: Send notification to rider about suspension

    return res.status(200).json({
      status: 'success',
      message: 'Rider suspended',
      data: rider,
    });
  } catch (error: any) {
    console.error('Suspend rider error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to suspend rider',
    });
  }
};

/**
 * Get rider details
 * GET /api/v1/admin/riders/:id
 */
export const getRiderDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rider = await riderService.getRiderProfile(id);

    return res.status(200).json({
      status: 'success',
      data: rider,
    });
  } catch (error: any) {
    console.error('Get rider details error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get rider details',
    });
  }
};

/**
 * Search riders
 * GET /api/v1/admin/riders/search
 */
export const searchRiders = async (req: Request, res: Response) => {
  try {
    const { status, vehicleType, isAvailable, isOnline } = req.query;

    const query: any = {};

    if (status) query.status = status as RiderStatus;
    if (vehicleType) query.vehicleType = vehicleType as VehicleType;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
    if (isOnline !== undefined) query.isOnline = isOnline === 'true';

    const riders = await riderService.searchRiders(query);

    return res.status(200).json({
      status: 'success',
      data: riders,
    });
  } catch (error: any) {
    console.error('Search riders error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to search riders',
    });
  }
};

/**
 * Get rider statistics
 * GET /api/v1/admin/riders/:id/statistics
 */
export const getRiderStatistics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const statistics = await riderService.getRiderStatistics(id);

    return res.status(200).json({
      status: 'success',
      data: statistics,
    });
  } catch (error: any) {
    console.error('Get rider statistics error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get rider statistics',
    });
  }
};