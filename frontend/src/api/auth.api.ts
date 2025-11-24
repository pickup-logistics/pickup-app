import axios from './axios.config';
import type {
  LoginCredentials,
  UserRegisterData,
  RiderRegisterData,
  FirebaseVerification,
  AuthResponse,
  OTPResponse,
} from '@/types/auth.types';

export const authAPI = {
  // ============= USER AUTH WITH FIREBASE =============
  
  /**
   * Register a new user with Firebase token
   */
  registerUser: async (data: UserRegisterData & { firebaseToken?: string }): Promise<AuthResponse> => {
    console.log('Registering user with data:', data);
    const response = await axios.post('/v1/auth/register', data);
    return response.data;
  },

  /**
   * Login with Firebase token
   */
  loginWithFirebase: async (data: FirebaseVerification): Promise<AuthResponse> => {
    const response = await axios.post('/v1/auth/verify-firebase', data);
    return response.data;
  },

  /**
   * Verify Firebase token and complete authentication
   */
  verifyUserOTP: async (data: { phone: string; firebaseToken: string }): Promise<AuthResponse> => {
    const response = await axios.post('/v1/auth/verify-firebase', data);
    return response.data;
  },
  
  /**
   * Login with password (alternative to Firebase)
   */
  loginUser: async (data: LoginCredentials): Promise<AuthResponse> => {
    const response = await axios.post('/v1/auth/login', data);
    return response.data;
  },

  // ============= RIDER AUTH =============

  /**
   * Register a new rider
   */
  registerRider: async (data: RiderRegisterData & { firebaseToken?: string }): Promise<AuthResponse> => {
    const response = await axios.post('/v1/rider/register', data);
    return response.data;
  },

  /**
   * Upload rider documents
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
   * Login rider with Firebase
   */
  loginRider: async (data: { phone: string; firebaseToken: string }): Promise<AuthResponse> => {
    const response = await axios.post('/v1/auth/verify-firebase', data);
    return response.data;
  },

  /**
   * Verify Firebase token for rider
   */
  verifyRiderOTP: async (data: { phone: string; firebaseToken: string }): Promise<AuthResponse> => {
    const response = await axios.post('/v1/auth/verify-firebase', data);
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

  // Note: resendOTP not needed with Firebase as it's handled client-side
};