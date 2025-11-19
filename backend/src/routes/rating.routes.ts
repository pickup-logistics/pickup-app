import { Router } from 'express';
import * as ratingController from '../controllers/rating.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * All rating routes require authentication
 */

// Create a rating
router.post('/', authenticate, ratingController.createRating);

// Get rides pending rating
router.get('/pending', authenticate, ratingController.getPendingRatings);

// Get ratings given by current user
router.get('/given', authenticate, ratingController.getGivenRatings);

// Get ratings received by current user
router.get('/received', authenticate, ratingController.getReceivedRatings);

// Get current user's rating statistics
router.get('/stats', authenticate, ratingController.getRatingStats);

// Check if user can rate a ride
router.get('/can-rate/:rideId', authenticate, ratingController.checkCanRate);

// Get rating for a specific ride
router.get('/ride/:rideId', ratingController.getRideRating);

// Get rider's rating statistics (public)
router.get('/rider/:riderId/stats', ratingController.getRiderStats);

// Get user's comments/reviews
router.get('/user/:userId/comments', ratingController.getUserComments);

export default router;