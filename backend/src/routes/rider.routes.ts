import { Router } from 'express';
import * as riderController from '../controllers/rider.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadFields } from '../utils/upload.util';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * Public routes
 */

// Get all approved riders
router.get('/', riderController.getApprovedRiders);

/**
 * Protected routes (authentication required)
 */

// Register as a rider with documents
router.post(
  '/register',
  authenticate,
  uploadFields([
    { name: 'vehiclePhoto', maxCount: 1 },
    { name: 'licensePhoto', maxCount: 1 },
  ]),
  riderController.register
);

// Get rider profile
router.get('/profile', authenticate, riderController.getProfile);

// Update rider profile
router.patch('/profile', authenticate, riderController.updateProfile);

// Upload/update rider documents
router.post(
  '/documents',
  authenticate,
  uploadFields([
    { name: 'vehiclePhoto', maxCount: 1 },
    { name: 'licensePhoto', maxCount: 1 },
  ]),
  riderController.uploadDocuments
);

// Toggle availability
router.patch('/availability', authenticate, riderController.toggleAvailability);

// Update location
router.patch('/location', authenticate, riderController.updateLocation);

// Get rider statistics
router.get('/statistics', authenticate, riderController.getStatistics);

export default router;