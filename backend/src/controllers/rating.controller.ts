import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as ratingService from '../services/rating.service';

/**
 * Create a rating for a completed ride
 * POST /api/v1/ratings
 */
export const createRating = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Validate request
    await body('rideId')
      .trim()
      .notEmpty()
      .withMessage('Ride ID is required')
      .run(req);
    await body('toUserId')
      .trim()
      .notEmpty()
      .withMessage('Recipient user ID is required')
      .run(req);
    await body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5')
      .run(req);
    await body('comment')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Comment must not exceed 500 characters')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { rideId, toUserId, rating, comment } = req.body;

    const newRating = await ratingService.createRating({
      rideId,
      fromUserId: req.user.userId,
      toUserId,
      rating: parseInt(rating),
      comment,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Rating submitted successfully',
      data: newRating,
    });
  } catch (error: any) {
    console.error('Create rating error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to create rating',
    });
  }
};

/**
 * Get rating for a specific ride
 * GET /api/v1/ratings/ride/:rideId
 */
export const getRideRating = async (req: Request, res: Response) => {
  try {
    const { rideId } = req.params;

    const rating = await ratingService.getRideRating(rideId);

    if (!rating) {
      return res.status(404).json({
        status: 'error',
        message: 'Rating not found for this ride',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: rating,
    });
  } catch (error: any) {
    console.error('Get ride rating error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get rating',
    });
  }
};

/**
 * Get ratings given by current user
 * GET /api/v1/ratings/given
 */
export const getGivenRatings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const limit = parseInt(req.query.limit as string) || 20;

    const ratings = await ratingService.getRatingsGivenByUser(req.user.userId, limit);

    return res.status(200).json({
      status: 'success',
      data: ratings,
    });
  } catch (error: any) {
    console.error('Get given ratings error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get ratings',
    });
  }
};

/**
 * Get ratings received by current user
 * GET /api/v1/ratings/received
 */
export const getReceivedRatings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const limit = parseInt(req.query.limit as string) || 20;

    const ratings = await ratingService.getRatingsReceivedByUser(req.user.userId, limit);

    return res.status(200).json({
      status: 'success',
      data: ratings,
    });
  } catch (error: any) {
    console.error('Get received ratings error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get ratings',
    });
  }
};

/**
 * Get rating statistics for current user
 * GET /api/v1/ratings/stats
 */
export const getRatingStats = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const stats = await ratingService.getUserRatingStats(req.user.userId);

    return res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error: any) {
    console.error('Get rating stats error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get rating statistics',
    });
  }
};

/**
 * Get rating statistics for a rider
 * GET /api/v1/ratings/rider/:riderId/stats
 */
export const getRiderStats = async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;

    const stats = await ratingService.getRiderRatingStats(riderId);

    return res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error: any) {
    console.error('Get rider stats error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get rider statistics',
    });
  }
};

/**
 * Check if user can rate a ride
 * GET /api/v1/ratings/can-rate/:rideId
 */
export const checkCanRate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { rideId } = req.params;

    const result = await ratingService.canRateRide(rideId, req.user.userId);

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error: any) {
    console.error('Check can rate error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to check rating eligibility',
    });
  }
};

/**
 * Get recent ratings with comments for a user
 * GET /api/v1/ratings/user/:userId/comments
 */
export const getUserComments = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const ratings = await ratingService.getRecentRatingsWithComments(userId, limit);

    return res.status(200).json({
      status: 'success',
      data: ratings,
    });
  } catch (error: any) {
    console.error('Get user comments error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get comments',
    });
  }
};

/**
 * Get rides pending rating for current user
 * GET /api/v1/ratings/pending
 */
export const getPendingRatings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const pendingRides = await ratingService.getPendingRatings(req.user.userId);

    return res.status(200).json({
      status: 'success',
      data: pendingRides,
    });
  } catch (error: any) {
    console.error('Get pending ratings error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get pending ratings',
    });
  }
};