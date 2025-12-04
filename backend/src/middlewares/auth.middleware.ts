import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.util';
import { UserRole } from '@prisma/client';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
    }

    // Check if it's an access token
    if (decoded.type !== 'access') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token type',
      });
    }

    // Attach user info to request
    req.user = decoded;

    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
    });
  }
};

/**
 * Authorization middleware - checks user role
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this resource',
      });
    }

    return next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded && decoded.type === 'access') {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Silent fail - continue without user
    next();
  }
};

/**
 * Check if user is authenticated (for conditions)
 */
export const isAuthenticated = (req: Request): boolean => {
  return !!req.user;
};

/**
 * Check if user has specific role
 */
export const hasRole = (req: Request, role: UserRole): boolean => {
  return req.user?.role === role || false;
};

/**
 * Check if user is admin
 */
export const isAdmin = (req: Request): boolean => {
  return hasRole(req, UserRole.ADMIN);
};

/**
 * Check if user is rider
 */
export const isRider = (req: Request): boolean => {
  return hasRole(req, UserRole.RIDER);
};