import axios from './axios.config';
import type {
  LoginCredentials,
  UserRegisterData,
  RiderRegisterData,
  AuthResponse,
} from '@/types/auth.types';

export const authAPI = {
  // ============= USER AUTH =============

  /**
   * Register a new user
   */
  registerUser: async (data: UserRegisterData): Promise<AuthResponse> => {
    console.log('Registering user with data:', data);
    const response = await axios.post('/v1/auth/register', data);
    return response.data;
  },

  /**
   * Login with password
   */
  loginUser: async (data: LoginCredentials): Promise<AuthResponse> => {
    const response = await axios.post('/v1/auth/login', data);
    return response.data;
  },

  // ============= RIDER AUTH =============

  /**
   * Register a new rider
   */
  registerRider: async (data: RiderRegisterData): Promise<AuthResponse> => {
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
   * Login rider with phone and password
   */
  loginRider: async (data: LoginCredentials): Promise<AuthResponse> => {
    const response = await axios.post('/v1/auth/login', data);
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
};