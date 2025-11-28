import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

// Auth Pages
import { Login } from '@/features/auth/pages/Login';
import { Register } from '@/features/auth/pages/Register';

// Rider Pages
import { RiderHome } from '@/features/rider/pages/Home';
import { ProfileSettings } from '@/features/rider/pages/ProfileSettings';

// Driver Pages
import { ApplyAsRider } from '@/features/driver/pages/ApplyAsRider';
import { PendingApproval } from '@/features/driver/pages/PendingApproval';
import { DriverRegister } from '@/features/driver/pages/DriverRegister';
import { DriverLogin } from '@/features/driver/pages/DriverLogin';
import { DriverHome as RiderDashboard } from '@/features/driver/pages/DriverHome';
import { RiderWallet } from '@/features/driver/pages/RiderWallet';
import { RiderHistory } from '@/features/driver/pages/RiderHistory';

// Layouts
import { AdminLayout } from '@/layouts/AdminLayout';

// Route Guards
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleRoute } from '@/routes/RoleRoute';

// Role-based home redirect component
const RoleBasedHome = () => {
  const { user } = useAuthStore();

  if (user?.role === 'RIDER') {
    return <Navigate to="/rider/home" replace />;
  } else if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/user/home" replace />;
  }
};

const AdminDashboard = () => (
  <AdminLayout>
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
        <p className="text-gray-600">Admin Page - Coming Soon</p>
      </div>
    </div>
  </AdminLayout>
);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute requireAuth={false}>
                <Register />
              </ProtectedRoute>
            }
          />

          {/* Driver Public Routes */}
          <Route
            path="/driver/register"
            element={
              <ProtectedRoute requireAuth={false}>
                <DriverRegister />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <DriverLogin />
              </ProtectedRoute>
            }
          />

          {/* Protected Rider Application Routes */}
          <Route
            path="/apply-rider"
            element={
              <ProtectedRoute>
                <ApplyAsRider />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/pending"
            element={
              <ProtectedRoute>
                <PendingApproval />
              </ProtectedRoute>
            }
          />

          {/* Home Route - Redirects based on role */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleBasedHome />
              </ProtectedRoute>
            }
          />

          {/* User Routes */}
          <Route
            path="/user/home"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['USER']}>
                  <RiderHome />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />

          {/* Driver/Rider Routes */}
          <Route
            path="/rider/home"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['RIDER']}>
                  <RiderDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rider/wallet"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['RIDER']}>
                  <RiderWallet />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rider/history"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['RIDER']}>
                  <RiderHistory />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rider/profile"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['RIDER']}>
                  <ProfileSettings />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;