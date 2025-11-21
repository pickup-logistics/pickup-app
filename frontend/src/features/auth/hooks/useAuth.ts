import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import type {
  LoginCredentials,
  UserRegisterData,
  RiderRegisterData,
  OTPVerification,
} from '@/types/auth.types';

export const useAuth = () => {
  const navigate = useNavigate();
  const { setAuth, clearAuth, setLoading, user, isAuthenticated } = useAuthStore();

  // ============= USER REGISTRATION =============
  const registerUser = useMutation({
    mutationFn: (data: UserRegisterData) => authAPI.registerUser(data),
    onSuccess: (response) => {
      // Backend returns user data and token immediately on registration
      if (response.data?.user && response.data?.token) {
        setAuth(response.data.user, response.data.token, response.data.refreshToken);
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

  // ============= USER LOGIN (SEND OTP) =============
  const sendLoginOTP = useMutation({
    mutationFn: (phone: string) => authAPI.sendLoginOTP(phone),
    onSuccess: (response) => {
      toast.success(response.message || 'OTP sent to your phone!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
    },
  });

  // ============= VERIFY OTP (USER) =============
  const verifyUserOTP = useMutation({
    mutationFn: (data: OTPVerification) => authAPI.verifyUserOTP(data),
    onSuccess: (response) => {
      if (response.data?.user && response.data?.token) {
        setAuth(response.data.user, response.data.token, response.data.refreshToken);
        toast.success('Login successful!');
        
        // Navigate based on role
        if (response.data.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Invalid OTP';
      toast.error(message);
    },
  });

  // ============= RIDER REGISTRATION =============
  const registerRider = useMutation({
    mutationFn: (data: RiderRegisterData) => authAPI.registerRider(data),
    onSuccess: (response) => {
      if (response.data?.user && response.data?.token) {
        setAuth(response.data.user, response.data.token, response.data.refreshToken);
        toast.success(response.message || 'Registration successful!');
        navigate('/driver');
      } else {
        toast.success(response.message || 'Registration successful! OTP sent.');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    },
  });

  // ============= RIDER LOGIN =============
  const loginRider = useMutation({
    mutationFn: (data: LoginCredentials) => authAPI.loginRider(data),
    onSuccess: (response) => {
      toast.success(response.message || 'OTP sent to your phone!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });

  // ============= VERIFY OTP (RIDER) =============
  const verifyRiderOTP = useMutation({
    mutationFn: (data: OTPVerification) => authAPI.verifyRiderOTP(data),
    onSuccess: (response) => {
      if (response.data?.user && response.data?.token) {
        setAuth(response.data.user, response.data.token, response.data.refreshToken);
        toast.success('Login successful!');
        navigate('/driver');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Invalid OTP';
      toast.error(message);
    },
  });

  // ============= RESEND OTP =============
  const resendOTP = useMutation({
    mutationFn: (phone: string) => authAPI.resendOTP(phone),
    onSuccess: (response) => {
      toast.success(response.message || 'OTP resent successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(message);
    },
  });

  // ============= LOGOUT =============
  const logout = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/login');
    },
    onError: (error: any) => {
      // Even if API call fails, clear local auth
      clearAuth();
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
    sendLoginOTP,
    verifyUserOTP,

    // Rider mutations
    registerRider,
    loginRider,
    verifyRiderOTP,

    // Common
    resendOTP,
    logout,
    currentUser,
  };
};