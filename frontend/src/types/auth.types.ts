// User roles
export type UserRole = 'USER' | 'RIDER' | 'ADMIN';

// Rider status
export type RiderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

// Vehicle type
export type VehicleType = 'BIKE' | 'TRICYCLE' | 'BUS' | 'TRUCK';

// Rider data interface (from backend Rider model)
export interface RiderData {
  id: string;
  vehicleType: VehicleType;
  plateNumber: string;
  status: RiderStatus;
  isAvailable: boolean;
  rating: number;
  completedRides: number;
  totalEarnings: number;
}

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
  isPhoneVerified: boolean;
  rider?: RiderData; // Optional rider data if user has applied as rider
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
  email?: string;
  phone?: string;
  password: string;
}

// Registration data for users
export interface UserRegisterData {
  phone: string;
  name: string;
  email: string;
  password: string;
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

// Auth response from backend
export interface AuthResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    user: User | Rider;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: string;
    };
  };
}

// Error response
export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}