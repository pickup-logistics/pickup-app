import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Bike, LogOut, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { MainLayout } from '@/layouts/MainLayout';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function ProfileSettings() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { currentUser } = useAuth();

  const riderData = currentUser?.data?.user?.rider;
  const riderStatus = riderData?.status;

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-primary-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500">
                {user?.role === 'RIDER' ? 'Rider' : 'User'}
              </p>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user?.email || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{user?.phone}</p>
              </div>
              {user?.isPhoneVerified && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Become a Rider / Rider Status Card */}
        {!riderData ? (
          // Show "Become a Rider" if no application
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 mb-6 border-2 border-green-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Become a Rider</h3>
                <p className="text-gray-700 mb-4">
                  Start earning money by providing rides in your area. Work on your own schedule and be your own boss.
                </p>
                <button
                  onClick={() => navigate('/apply-rider')}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Apply Now
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Show rider application status
          <div className={`rounded-xl shadow-lg p-6 mb-6 border-2 ${
            riderStatus === 'PENDING' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' :
            riderStatus === 'APPROVED' ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' :
            'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                riderStatus === 'PENDING' ? 'bg-yellow-600' :
                riderStatus === 'APPROVED' ? 'bg-green-600' :
                'bg-red-600'
              }`}>
                {riderStatus === 'PENDING' ? (
                  <Clock className="w-6 h-6 text-white" />
                ) : riderStatus === 'APPROVED' ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <XCircle className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">Rider Application</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    riderStatus === 'PENDING' ? 'bg-yellow-200 text-yellow-800' :
                    riderStatus === 'APPROVED' ? 'bg-green-200 text-green-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {riderStatus}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">
                  {riderStatus === 'PENDING' && 'Your application is under review. This typically takes 1-3 business days.'}
                  {riderStatus === 'APPROVED' && 'Your application has been approved! You can now start accepting rides.'}
                  {(riderStatus === 'REJECTED' || riderStatus === 'SUSPENDED') && 'Please contact support for more information.'}
                </p>
                {riderStatus === 'APPROVED' && (
                  <button
                    onClick={() => navigate('/driver/home')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    Go to Dashboard
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
                {riderStatus === 'PENDING' && (
                  <div className="text-sm text-gray-600">
                    <strong>Vehicle:</strong> {riderData.vehicleType} • <strong>Plate:</strong> {riderData.plateNumber}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">Actions</h3>

          {/* Edit Profile */}
          <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Edit Profile</p>
              <p className="text-sm text-gray-500">Update your personal information</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 hover:bg-red-50 rounded-lg transition-colors text-left mt-2"
          >
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-700" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-700">Logout</p>
              <p className="text-sm text-gray-500">Sign out of your account</p>
            </div>
          </button>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-gray-500 mb-6">
          <p>PickUp v1.0.0</p>
          <p className="mt-1">© 2024 PickUp. All rights reserved.</p>
        </div>
      </div>
    </MainLayout>
  );
}
