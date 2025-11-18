import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateTokens } from '../utils/jwt.util';
import { sendOTP, verifyOTP } from '../utils/otp.util';

const prisma = new PrismaClient();

export interface RegisterUserData {
  phone: string;
  name: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface LoginData {
  phone: string;
  password?: string;
}

/**
 * Register new user
 */
export const registerUser = async (data: RegisterUserData) => {
  const { phone, name, email, password, role = UserRole.USER } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingUser) {
    throw new Error('User with this phone number already exists');
  }

  // Check email if provided
  if (email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new Error('User with this email already exists');
    }
  }

  // Hash password if provided
  let hashedPassword: string | undefined;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      phone,
      name,
      email,
      password: hashedPassword,
      role,
      status: 'ACTIVE',
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
    },
  });

  // Generate tokens
  const tokens = generateTokens(user.id, user.phone, user.role);

  return {
    user,
    tokens,
  };
};

/**
 * Login user with phone and password
 */
export const loginUser = async (data: LoginData) => {
  const { phone, password } = data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw new Error('Invalid phone number or password');
  }

  // Check if user is active
  if (user.status !== 'ACTIVE') {
    throw new Error('Your account has been suspended. Please contact support.');
  }

  // Verify password if provided
  if (password) {
    if (!user.password) {
      throw new Error('Password not set. Please use OTP login.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid phone number or password');
    }
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
 * Send OTP for phone verification
 */
export const sendLoginOTP = async (phone: string) => {
  // Check if user exists (optional - you can create user on OTP verify instead)
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw new Error('User not found. Please register first.');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Your account has been suspended. Please contact support.');
  }

  // Send OTP
  const result = await sendOTP(phone);

  if (!result.success) {
    throw new Error(result.message);
  }

  return result;
};

/**
 * Verify OTP and login
 */
export const verifyLoginOTP = async (phone: string, otp: string) => {
  // Verify OTP
  const otpResult = verifyOTP(phone, otp);

  if (!otpResult.valid) {
    throw new Error(otpResult.message);
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Mark phone as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPhoneVerified: true,
      lastLoginAt: new Date(),
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