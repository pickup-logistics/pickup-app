import axios from './axios.config';
import type {
  LoginCredentials,
  UserRegisterData,
  RiderRegisterData,
  OTPVerification,
  AuthResponse,
  OTPResponse,
} from '@/types/auth.types';

export const authAPI = {
  // ============= USER AUTH =============
  
  /**
   * Register a new user (rider/passenger)
   */
  registerUser: async (data: UserRegisterData): Promise<AuthResponse> => {
    console.log('Registering user with data:', data);
    const response = await axios.post('/v1/auth/register', data);
    return response.data; // Returns { status, message, data: { user, token } }
  },

  /**
   * Send OTP for user login
   */
  sendLoginOTP: async (phone: string): Promise<OTPResponse> => {
    const response = await axios.post('/v1/auth/send-otp', { phone });
    return response.data; // Returns { status, message }
  },

  /**
   * Verify OTP and complete authentication
   */
  verifyUserOTP: async (data: OTPVerification): Promise<AuthResponse> => {
    const response = await axios.post('/v1/auth/verify-otp', data);
    return response.data; // Returns { status, message, data: { user, token } }
  },
  
  /**
   * Login with password (alternative to OTP)
   */
  loginUser: async (data: LoginCredentials): Promise<AuthResponse> => {
    const response = await axios.post('/v1/auth/login', data);
    return response.data; // Returns { status, message, data: { user, token } }
  },

  // ============= RIDER AUTH =============

  /**
   * Register a new rider (bike rider)
   */
  registerRider: async (data: RiderRegisterData): Promise<AuthResponse> => {
    const response = await axios.post('/v1/rider/register', data);
    return response.data;
  },

  /**
   * Upload rider documents (license, bike photos)
   */
  uploadRiderDocuments: async (formData: FormData): Promise<{ status: string; message: string }> => {
    const response = await axios.post('/v1/rider/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Send OTP for rider login
   */
  loginRider: async (data: LoginCredentials): Promise<OTPResponse> => {
    const response = await axios.post('/v1/auth/send-otp', data);
    return response.data;
  },

  /**
   * Verify OTP for rider and complete authentication
   */
  verifyRiderOTP: async (data: OTPVerification): Promise<AuthResponse> => {
    const response = await axios.post('/v1/auth/verify-otp', data);
    return response.data;
  },

  // ============= COMMON AUTH =============

  /**
   * Refresh authentication token
   */
  refreshToken: async (): Promise<{ status: string; message: string; data: { token: string } }> => {
    const refreshToken = localStorage.getItem('refresh-token');
    const response = await axios.post('/v1/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Logout user/rider
   */
  logout: async (): Promise<{ status: string; message: string }> => {
    const response = await axios.post('/v1/auth/logout');
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await axios.get('/v1/auth/me');
    return response.data;
  },

  /**
   * Resend OTP
   */
  resendOTP: async (phone: string): Promise<OTPResponse> => {
    const response = await axios.post('/v1/auth/send-otp', { phone });
    return response.data;
  },
};