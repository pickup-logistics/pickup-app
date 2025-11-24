import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Public routes (no authentication required)
 */

// Register new user (with Firebase token)
router.post('/register', authController.register);

// Login with password (fallback/alternative method)
router.post('/login', authController.login);

// Verify Firebase token and login (primary method)
router.post('/verify-firebase', authController.verifyFirebase);

// Legacy OTP routes (can be removed if fully migrating to Firebase)
// router.post('/send-otp', authController.sendOTP);
// router.post('/verify-otp', authController.verifyOTP);

// Refresh access token
router.post('/refresh', authController.refresh);

/**
 * Protected routes (authentication required)
 */

// Get current user profile
router.get('/me', authenticate, authController.getMe);

// Update user profile
router.patch('/profile', authenticate, authController.updateProfile);

// Change password
router.post('/change-password', authenticate, authController.changePassword);

// Logout
router.post('/logout', authenticate, authController.logout);

export default router;