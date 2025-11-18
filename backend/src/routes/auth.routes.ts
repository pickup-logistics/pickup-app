import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Public routes (no authentication required)
 */

// Register new user
router.post('/register', authController.register);

// Login with password
router.post('/login', authController.login);

// Send OTP for login
router.post('/send-otp', authController.sendOTP);

// Verify OTP and login
router.post('/verify-otp', authController.verifyOTP);

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