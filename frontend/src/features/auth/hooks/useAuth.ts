import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import type {
  LoginCredentials,
  UserRegisterData,
  RiderRegisterData,
  FirebaseVerification,
} from '@/types/auth.types';

export const useAuth = () => {
  const navigate = useNavigate();
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();

  // ============= USER REGISTRATION =============
  const registerUser = useMutation({
    mutationFn: (data: UserRegisterData & { firebaseToken?: string }) =>
      authAPI.registerUser(data),
    onSuccess: (response) => {
      // Backend returns user data and tokens immediately on registration
      if (response.data?.user && response.data?.tokens) {
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

  // ============= USER LOGIN WITH FIREBASE =============
  const loginWithFirebase = useMutation({
    mutationFn: (data: FirebaseVerification) => authAPI.loginWithFirebase(data),
    onSuccess: (response) => {
      if (response.data?.user && response.data?.tokens) {
        const { user, tokens } = response.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
        toast.success('Login successful!');

        // Navigate based on role
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

  // ============= VERIFY FIREBASE TOKEN (USER) =============
  const verifyUserOTP = useMutation({
    mutationFn: (data: { phone: string; firebaseToken: string }) =>
      authAPI.verifyUserOTP(data),
    retry: false, // Don't retry Firebase verification
    onSuccess: (response) => {
      if (response.data?.user && response.data?.tokens) {
        const { user, tokens } = response.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
        toast.success('Login successful!');

        // Navigate based on role
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);
    },
  });

  // ============= PASSWORD LOGIN =============
  const loginUser = useMutation({
    mutationFn: (data: LoginCredentials) => authAPI.loginUser(data),
    onSuccess: (response) => {
      if (response.data?.user && response.data?.tokens) {
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
    mutationFn: (data: RiderRegisterData & { firebaseToken?: string }) =>
      authAPI.registerRider(data),
    onSuccess: (response) => {
      if (response.data?.user && response.data?.tokens) {
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
    mutationFn: (data: { phone: string; firebaseToken: string }) =>
      authAPI.loginRider(data),
    onSuccess: (response) => {
      if (response.data?.user && response.data?.tokens) {
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

  // ============= VERIFY FIREBASE TOKEN (RIDER) =============
  const verifyRiderOTP = useMutation({
    mutationFn: (data: { phone: string; firebaseToken: string }) =>
      authAPI.verifyRiderOTP(data),
    retry: false, // Don't retry Firebase verification
    onSuccess: (response) => {
      if (response.data?.user && response.data?.tokens) {
        const { user, tokens } = response.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
        toast.success('Login successful!');
        navigate('/driver');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Verification failed';
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
    onError: () => {
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

    // User mutations - Firebase
    registerUser,
    loginWithFirebase,
    verifyUserOTP,
    loginUser, // Fallback password login

    // Rider mutations - Firebase
    registerRider,
    loginRider,
    verifyRiderOTP,

    // Common
    logout,
    currentUser,
  };
};