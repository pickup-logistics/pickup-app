import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateTokens } from '../utils/jwt.util';
import { firebaseAuth } from '../config/firebase.config';
import { monnifyService } from './monnify.service';
import { createWallet } from './wallet.service';

const prisma = new PrismaClient();

export interface RegisterUserData {
  phone: string;
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  firebaseToken?: string; // Add Firebase token
}

export interface LoginData {
  email?: string;
  phone?: string;
  password?: string;
  firebaseToken?: string; // Add Firebase token
}

/**
 * Verify Firebase token and extract phone number
 */
export const verifyFirebaseToken = async (token: string) => {
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    return {
      phoneNumber: decodedToken.phone_number,
      uid: decodedToken.uid,
    };
  } catch (error) {
    throw new Error('Invalid Firebase token');
  }
};

/**
 * Register new user
 */
export const registerUser = async (data: RegisterUserData) => {
  const { phone, name, email, password, role = UserRole.USER, firebaseToken } = data;

  // Verify Firebase token if provided (optional for now)
  if (firebaseToken) {
    const firebaseData = await verifyFirebaseToken(firebaseToken);
    if (firebaseData.phoneNumber !== phone) {
      throw new Error('Phone number mismatch');
    }
  }

  // Check if user already exists by phone
  const existingUser = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingUser) {
    throw new Error('User with this phone number already exists');
  }

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Reserve bank account
  const accountDetails = await monnifyService.reserveAccount(name, email);

  // Create user
  const user = await prisma.user.create({
    data: {
      phone,
      name,
      email,
      password: hashedPassword,
      role,
      status: 'ACTIVE',
      isPhoneVerified: !!firebaseToken, // Mark as verified if Firebase token provided

      // Bank Account Details
      bankName: accountDetails?.bankName,
      accountNumber: accountDetails?.accountNumber,
      accountName: accountDetails?.accountName,
      bankCode: accountDetails?.bankCode,
      accountReference: accountDetails?.accountReference,
    },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      createdAt: true,
      bankName: true,
      accountNumber: true,
      accountName: true,
    },
  });

  // Create wallet for user
  try {
    await createWallet(user.id);
  } catch (error) {
    console.error('Failed to create wallet:', error);
    // Don't fail registration if wallet creation fails
  }

  // Generate tokens
  const tokens = generateTokens(user.id, user.phone, user.role);

  return {
    user,
    tokens,
  };
};

/**
 * Login user with Firebase token
 */
export const loginWithFirebase = async (firebaseToken: string) => {
  // Verify Firebase token
  const firebaseData = await verifyFirebaseToken(firebaseToken);
  const phone = firebaseData.phoneNumber;

  if (!phone) {
    throw new Error('Phone number not found in Firebase token');
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw new Error('User not found. Please register first.');
  }

  // Check if user is active
  if (user.status !== 'ACTIVE') {
    throw new Error('Your account has been suspended. Please contact support.');
  }

  // Update last login and mark phone as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      isPhoneVerified: true,
    },
  });

  // Generate tokens
  const tokens = generateTokens(user.id, user.phone, user.role);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    tokens,
  };
};

/**
 * Login user with email/phone and password (fallback)
 */
export const loginUser = async (data: LoginData) => {
  const { email, phone, password, firebaseToken } = data;

  // If Firebase token provided, use Firebase login
  if (firebaseToken) {
    return loginWithFirebase(firebaseToken);
  }

  // Otherwise, use password login
  if (!password) {
    throw new Error('Password or Firebase token required');
  }

  // Find user by email or phone
  let user;
  if (email) {
    user = await prisma.user.findUnique({
      where: { email },
    });
  } else if (phone) {
    user = await prisma.user.findUnique({
      where: { phone },
    });
  } else {
    throw new Error('Email or phone number required');
  }

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (user.status !== 'ACTIVE') {
    throw new Error('Your account has been suspended. Please contact support.');
  }

  //  Verify password
  if (!user.password) {
    throw new Error('Password not set. Please use phone authentication.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate tokens
  const tokens = generateTokens(user.id, user.phone, user.role);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    tokens,
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string) => {
  const { verifyToken } = await import('../utils/jwt.util');

  // Verify refresh token
  const decoded = verifyToken(refreshToken);

  if (!decoded || decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }

  // Check if user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new Error('User not found or inactive');
  }

  // Generate new tokens
  const tokens = generateTokens(user.id, user.phone, user.role);

  return tokens;
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatar: true,
      dateOfBirth: true,
      gender: true,
      address: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
      rider: {
        select: {
          id: true,
          vehicleType: true,
          plateNumber: true,
          status: true,
          isAvailable: true,
          rating: true,
          completedRides: true,
          totalEarnings: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, data: Partial<User>) => {
  // Don't allow updating sensitive fields
  const { id, phone, password, role, status, ...updateData } = data as any;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      dateOfBirth: true,
      gender: true,
      address: true,
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });

  return user;
};

/**
 * Change password
 */
export const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.password) {
    throw new Error('No password set. Please set a password first.');
  }

  // Verify old password
  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: 'Password changed successfully' };
};