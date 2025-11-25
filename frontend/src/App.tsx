import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Auth Pages
import { Login } from '@/features/auth/pages/Login';
import { Register } from '@/features/auth/pages/Register';

// Rider Pages
import { RiderHome } from '@/features/rider/pages/Home';
import { ProfileSettings } from '@/features/rider/pages/ProfileSettings';

// Driver Pages
import { ApplyAsRider } from '@/features/driver/pages/ApplyAsRider';
import { PendingApproval } from '@/features/driver/pages/PendingApproval';

// Layouts
import { DriverLayout } from '@/layouts/DriverLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

// Route Guards
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleRoute } from '@/routes/RoleRoute';

const DriverHome = () => (
  <DriverLayout>
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Rider Dashboard</h1>
        <p className="text-gray-600">Rider Home Page - Coming Soon</p>
      </div>
    </div>
  </DriverLayout>
);

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

          {/* User Routes */}
          <Route
            path="/"
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

          {/* Driver Routes */}
          <Route
            path="/driver/*"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['RIDER']}>
                  <DriverHome />
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