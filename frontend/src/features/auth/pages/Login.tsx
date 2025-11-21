import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PhoneInput } from '@/components/common/PhoneInput';
import { Button } from '@/components/common/Button';
import { OTPVerification } from '../components';
import { Bike } from 'lucide-react';

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const { sendLoginOTP, verifyUserOTP, resendOTP } = useAuth();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) return;

    try {
      await sendLoginOTP.mutateAsync(phone);
      setShowOTP(true);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleOTPVerify = async (otp: string) => {
    try {
      await verifyUserOTP.mutateAsync({ phone, otp });
      // Navigation is handled in the mutation
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP.mutateAsync(phone);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">PickUp</h1>
          <p className="text-gray-600 mt-2">Book a ride in seconds</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {!showOTP ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600">
                  Enter your phone number to continue
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <PhoneInput
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="803 456 7890"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={sendLoginOTP.isPending}
                >
                  Continue
                </Button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Sign up
                  </Link>
                </p>
                
                <p className="text-sm text-gray-600">
                  Are you a bike rider?{' '}
                  <Link
                    to="/driver/login"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Login here
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <OTPVerification
              phone={phone}
              onVerify={handleOTPVerify}
              onResend={handleResendOTP}
              isLoading={verifyUserOTP.isPending}
              error={
                verifyUserOTP.isError
                  ? 'Invalid OTP. Please try again.'
                  : undefined
              }
            />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};