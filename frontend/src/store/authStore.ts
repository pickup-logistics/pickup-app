import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Rider } from '@/types/auth.types';

interface AuthState {
  user: User | Rider | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (user: User | Rider, token: string, refreshToken?: string) => void;
  setUser: (user: User | Rider) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, token, refreshToken) => {
        // Store tokens in localStorage
        localStorage.setItem('auth-token', token);
        if (refreshToken) {
          localStorage.setItem('refresh-token', refreshToken);
        }

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      clearAuth: () => {
        // Clear tokens from localStorage
        localStorage.removeItem('auth-token');
        localStorage.removeItem('refresh-token');

        // Clear persisted auth storage
        localStorage.removeItem('auth-storage');

        // Clear user-specific data
        localStorage.removeItem('previousDestinations');

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for easy access
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useUserRole = () => useAuthStore((state) => state.user?.role);
export const useIsRider = () => useAuthStore((state) => state.user?.role === 'RIDER');
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'ADMIN');