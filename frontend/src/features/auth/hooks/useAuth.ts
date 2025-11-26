import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useRideStore } from '@/store/rideStore';
import toast from 'react-hot-toast';
import type {
  LoginCredentials,
  UserRegisterData,
  RiderRegisterData,
} from '@/types/auth.types';

export const useAuth = () => {
  const navigate = useNavigate();
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();
  const { clearAllLocations } = useLocationStore();
  const { clearRideData } = useRideStore();

  // Helper function to clear all user-specific data
  const clearAllUserData = () => {
    clearAuth();
    clearAllLocations();
    clearRideData();
  };

  // ============= USER REGISTRATION =============
  const registerUser = useMutation({
    mutationFn: (data: UserRegisterData) => authAPI.registerUser(data),
    onSuccess: (response) => {
      // Backend returns user data and tokens immediately on registration
      if (response.data?.user && response.data?.tokens) {
        // Clear any previous user data before setting new auth
        clearAllLocations();
        clearRideData();

        const { user, tokens } = response.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
        toast.success(response.message || 'Registration successful!');
        navigate('/');
      }
    },
    onError: (error: any) => {
      console.error('Registration error:', error.response?.data);
      const message = error.response?.data?.message || 'Registration failed';
      const errors = error.response?.data?.errors;

      if (errors && Array.isArray(errors)) {
        // Show validation errors
        errors.forEach((err: any) => {
          toast.error(err.msg || err.message);
        });
      } else {
        toast.error(message);
      }
    },
  });

  // ============= USER LOGIN =============
  const loginUser = useMutation({
    mutationFn: (data: LoginCredentials) => authAPI.loginUser(data),
    onSuccess: (response) => {
      if (response.data?.user && response.data?.tokens) {
        // Clear any previous user data before setting new auth
        clearAllLocations();
        clearRideData();

        const { user, tokens } = response.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
        toast.success('Login successful!');

        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });

  // ============= RIDER REGISTRATION =============
  const registerRider = useMutation({
    mutationFn: (data: RiderRegisterData) =>
      authAPI.registerRider(data),
    onSuccess: (response) => {
      if (response.data?.user && response.data?.tokens) {
        // Clear any previous user data before setting new auth
        clearAllLocations();
        clearRideData();

        const { user, tokens } = response.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
        toast.success(response.message || 'Registration successful!');
        navigate('/driver');
      } else {
        toast.success(response.message || 'Registration successful!');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    },
  });

  // ============= RIDER LOGIN =============
  const loginRider = useMutation({
    mutationFn: (data: LoginCredentials) =>
      authAPI.loginRider(data),
    onSuccess: (response) => {
      if (response.data?.user && response.data?.tokens) {
        // Clear any previous user data before setting new auth
        clearAllLocations();
        clearRideData();

        const { user, tokens } = response.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
        toast.success('Login successful!');
        navigate('/driver');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });

  // ============= LOGOUT =============
  const logout = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      // Clear all user-specific data
      clearAllUserData();

      toast.success('Logged out successfully');
      navigate('/login');
    },
    onError: () => {
      // Even if API call fails, clear local auth and data
      clearAllUserData();

      navigate('/login');
    },
  });

  // ============= GET CURRENT USER =============
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authAPI.getCurrentUser(),
    enabled: isAuthenticated && !!user,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    // State
    user,
    isAuthenticated,
    isLoadingUser,

    // User mutations
    registerUser,
    loginUser,

    // Rider mutations
    registerRider,
    loginRider,

    // Common
    logout,
    currentUser,
  };
};