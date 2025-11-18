import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../services/auth.service';

/**
 * Register new user
 * POST /api/v1/auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    // Validate request
    await body('phone')
      .matches(/^\+234[0-9]{10}$/)
      .withMessage('Invalid Nigerian phone number format (+234XXXXXXXXXX)')
      .run(req);
    await body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .run(req);
    await body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address')
      .run(req);
    await body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { phone, name, email, password } = req.body;

    const result = await authService.registerUser({
      phone,
      name,
      email,
      password,
    });

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Registration failed',
    });
  }
};

/**
 * Login with phone and password
 * POST /api/v1/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Validate request
    await body('phone')
      .matches(/^\+234[0-9]{10}$/)
      .withMessage('Invalid Nigerian phone number format')
      .run(req);
    await body('password')
      .notEmpty()
      .withMessage('Password is required')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { phone, password } = req.body;

    const result = await authService.loginUser({ phone, password });

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(401).json({
      status: 'error',
      message: error.message || 'Login failed',
    });
  }
};

/**
 * Send OTP for login
 * POST /api/v1/auth/send-otp
 */
export const sendOTP = async (req: Request, res: Response) => {
  try {
    // Validate request
    await body('phone')
      .matches(/^\+234[0-9]{10}$/)
      .withMessage('Invalid Nigerian phone number format')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { phone } = req.body;

    const result = await authService.sendLoginOTP(phone);

    return res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to send OTP',
    });
  }
};

/**
 * Verify OTP and login
 * POST /api/v1/auth/verify-otp
 */
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    // Validate request
    await body('phone')
      .matches(/^\+234[0-9]{10}$/)
      .withMessage('Invalid Nigerian phone number format')
      .run(req);
    await body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('OTP must be a 6-digit number')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { phone, otp } = req.body;

    const result = await authService.verifyLoginOTP(phone, otp);

    return res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'OTP verification failed',
    });
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    // Validate request
    await body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { refreshToken } = req.body;

    const tokens = await authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: tokens,
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return res.status(401).json({
      status: 'error',
      message: error.message || 'Token refresh failed',
    });
  }
};

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const user = await authService.getUserProfile(req.user.userId);

    return res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get profile',
    });
  }
};

/**
 * Update user profile
 * PATCH /api/v1/auth/profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Validate allowed fields
    const allowedFields = ['name', 'email', 'avatar', 'dateOfBirth', 'gender', 'address'];
    const updates = Object.keys(req.body)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const user = await authService.updateUserProfile(req.user.userId, updates);

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to update profile',
    });
  }
};

/**
 * Change password
 * POST /api/v1/auth/change-password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Validate request
    await body('oldPassword')
      .notEmpty()
      .withMessage('Current password is required')
      .run(req);
    await body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { oldPassword, newPassword } = req.body;

    const result = await authService.changePassword(req.user.userId, oldPassword, newPassword);

    return res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to change password',
    });
  }
};

/**
 * Logout (client-side token removal)
 * POST /api/v1/auth/logout
 */
export const logout = async (req: Request, res: Response) => {
  // In a stateless JWT system, logout is handled client-side
  // The client should remove the tokens from storage
  // Optionally, implement token blacklisting here

  return res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};