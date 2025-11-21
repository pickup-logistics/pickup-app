// User roles
export type UserRole = 'USER' | 'RIDER' | 'ADMIN';

// User interface
export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

// Rider-specific data
export interface Rider extends User {
  role: 'RIDER';
  bikeDetails?: {
    plateNumber: string;
    color: string;
    model: string;
  };
  licenseNumber?: string;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  rating?: number;
  totalRides?: number;
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

// Login credentials
export interface LoginCredentials {
  phone: string;
  password?: string;
}

// Registration data for users
export interface UserRegisterData {
  phone: string;
  name: string;
  email?: string;
  password?: string;
}

// Registration data for riders
export interface RiderRegisterData {
  phone: string;
  name: string;
  email?: string;
  password?: string;
  bikeDetails: {
    plateNumber: string;
    color: string;
    model: string;
  };
  licenseNumber: string;
}

// OTP verification
export interface OTPVerification {
  phone: string;
  otp: string;
}

// Auth response from backend
export interface AuthResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    user: User | Rider;
    token: string;
    refreshToken?: string;
  };
}

// OTP response from backend
export interface OTPResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}

// Error response
export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}