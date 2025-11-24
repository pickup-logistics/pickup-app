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
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address')
      .run(req);
    await body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .run(req);
    await body('firebaseToken')
      .optional()
      .isString()
      .withMessage('Firebase token must be a string')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { phone, name, email, password, firebaseToken } = req.body;

    const result = await authService.registerUser({
      phone,
      name,
      email,
      password,
      firebaseToken,
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
 * Login with Firebase token or password
 * POST /api/v1/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Validate request - accept either email or phone
    await body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address')
      .run(req);
    await body('phone')
      .optional()
      .matches(/^\+234[0-9]{10}$/)
      .withMessage('Invalid Nigerian phone number format')
      .run(req);
    await body('password')
      .optional()
      .notEmpty()
      .withMessage('Password is required')
      .run(req);
    await body('firebaseToken')
      .optional()
      .isString()
      .withMessage('Firebase token must be a string')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, phone, password, firebaseToken } = req.body;

    // Require either email or phone
    if (!email && !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Email or phone number required',
      });
    }

    const result = await authService.loginUser({ email, phone, password, firebaseToken });

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
 * Verify Firebase token and login
 * POST /api/v1/auth/verify-firebase
 */
export const verifyFirebase = async (req: Request, res: Response) => {
  try {
    await body('firebaseToken')
      .notEmpty()
      .withMessage('Firebase token is required')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { firebaseToken } = req.body;

    const result = await authService.loginWithFirebase(firebaseToken);

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    console.error('Firebase verification error:', error);
    return res.status(401).json({
      status: 'error',
      message: error.message || 'Firebase verification failed',
    });
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req: Request, res: Response) => {
  try {
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
 * Logout
 * POST /api/v1/auth/logout
 */
export const logout = async (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};