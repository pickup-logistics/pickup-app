import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

export interface JwtPayload {
  userId: string;
  phone: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

/**
 * Generate access token
 */
export const generateAccessToken = (userId: string, phone: string, role: UserRole): string => {
  const payload: JwtPayload = {
    userId,
    phone,
    role,
    type: 'access',
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string, phone: string, role: UserRole): string => {
  const payload: JwtPayload = {
    userId,
    phone,
    role,
    type: 'refresh',
  };

  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokens = (userId: string, phone: string, role: UserRole) => {
  return {
    accessToken: generateAccessToken(userId, phone, role),
    refreshToken: generateRefreshToken(userId, phone, role),
    expiresIn: JWT_EXPIRES_IN,
  };
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};