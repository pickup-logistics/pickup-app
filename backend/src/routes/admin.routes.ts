import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * All admin routes require authentication and ADMIN role
 */

// Get all pending riders
router.get(
  '/riders/pending',
  authenticate,
  authorize(UserRole.ADMIN),
  adminController.getPendingRiders
);

// Search riders
router.get(
  '/riders/search',
  authenticate,
  authorize(UserRole.ADMIN),
  adminController.searchRiders
);

// Get rider details
router.get(
  '/riders/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  adminController.getRiderDetails
);

// Get rider statistics
router.get(
  '/riders/:id/statistics',
  authenticate,
  authorize(UserRole.ADMIN),
  adminController.getRiderStatistics
);

// Approve rider
router.post(
  '/riders/:id/approve',
  authenticate,
  authorize(UserRole.ADMIN),
  adminController.approveRider
);

// Reject rider
router.post(
  '/riders/:id/reject',
  authenticate,
  authorize(UserRole.ADMIN),
  adminController.rejectRider
);

// Suspend rider
router.post(
  '/riders/:id/suspend',
  authenticate,
  authorize(UserRole.ADMIN),
  adminController.suspendRider
);

export default router;