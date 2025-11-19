import { Router } from 'express';
import * as rideController from '../controllers/ride.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * All ride routes require authentication
 */

// Create ride request
router.post('/', authenticate, rideController.createRide);

// Get active ride
router.get('/active', authenticate, rideController.getActiveRide);

// Get ride history
router.get('/history', authenticate, rideController.getRideHistory);

// Get specific ride
router.get('/:id', authenticate, rideController.getRide);

// Accept ride (Rider)
router.post('/:id/accept', authenticate, rideController.acceptRide);

// Decline ride (Rider)
router.post('/:id/decline', authenticate, rideController.declineRide);

// Mark arrived at pickup (Rider)
router.post('/:id/arrived', authenticate, rideController.markArrived);

// Start ride (Rider)
router.post('/:id/start', authenticate, rideController.startRide);

// Complete ride (Rider)
router.post('/:id/complete', authenticate, rideController.completeRide);

// Cancel ride (User)
router.post('/:id/cancel', authenticate, rideController.cancelRide);

export default router;