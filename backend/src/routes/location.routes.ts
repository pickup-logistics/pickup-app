import { Router } from 'express';
import * as locationController from '../controllers/location.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * All location routes require authentication
 */

// Update rider location (rider app calls this every few seconds)
router.patch('/update', authenticate, locationController.updateLocation);

// Get tracking info for a ride
router.get('/tracking/:rideId', authenticate, locationController.getTracking);

// Start tracking for a ride
router.post('/tracking/:rideId/start', authenticate, locationController.startTracking);

// Stop tracking for a ride
router.post('/tracking/:rideId/stop', authenticate, locationController.stopTracking);

// Get route polyline
router.get('/route', locationController.getRoute);

export default router;