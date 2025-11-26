import { X, User, LogOut, Bike } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
    onClose();
  };

  const handleAccountSettings = () => {
    navigate('/profile');
    onClose();
  };

  const handleBecomeRider = () => {
    navigate('/apply-rider');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{user?.name || 'User'}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4">
          {/* Account Settings */}
          <button
            onClick={handleAccountSettings}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Account Settings</p>
              <p className="text-sm text-gray-500">Manage your account</p>
            </div>
          </button>

          {/* Become a Rider */}
          {user?.role !== 'RIDER' && (
            <button
              onClick={handleBecomeRider}
              className="w-full flex items-center gap-4 p-4 hover:bg-green-50 rounded-lg transition-colors text-left mt-2"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Bike className="w-5 h-5 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Become a Rider</p>
                <p className="text-sm text-gray-500">Start earning with PickUp</p>
              </div>
            </button>
          )}

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

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            PickUp v1.0.0
          </p>
        </div>
      </div>
    </>
  );
}
