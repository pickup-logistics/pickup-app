import React from 'react';
import { Link } from 'react-router-dom';
import { Bike, Clock, CheckCircle, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const PendingApproval: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-full">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PickUp Rider</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-12 h-12 text-yellow-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Application Under Review
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-600 text-center mb-8">
              Thank you for applying to become a PickUp rider, <strong>{user?.name}</strong>!
            </p>

            {/* Status Card */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <Mail className="w-6 h-6 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Our team is currently reviewing your application and documents</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>This process typically takes 1-3 business days</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>You'll receive an email at <strong>{user?.email}</strong> once approved</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>After approval, you can start accepting ride requests</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Information Card */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">While you wait:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Make sure your vehicle is in good condition</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Download the PickUp Rider mobile app (if available)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Familiarize yourself with local traffic rules</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Keep your phone charged and ready</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/driver/home"
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium text-center hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-gray-500 text-center mt-6">
              If you have any questions, contact us at{' '}
              <a href="mailto:support@pickup.com" className="text-green-600 hover:underline">
                support@pickup.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
