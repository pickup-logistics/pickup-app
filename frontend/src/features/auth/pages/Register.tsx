import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PhoneInput } from '@/components/common/PhoneInput';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { OTPVerification } from '../components/OTPVerification';
import { Bike, User, Mail } from 'lucide-react';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    email: '',
    password: '',
  });
  const [showOTP, setShowOTP] = useState(false);
  const { registerUser, verifyUserOTP, resendOTP } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await registerUser.mutateAsync(formData);
      
      // Check if backend returned token (auto-login) or requires OTP
      if (response.data?.token) {
        // Already logged in, navigation handled in mutation
      } else {
        // Need to verify OTP
        setShowOTP(true);
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleOTPVerify = async (otp: string) => {
    try {
      await verifyUserOTP.mutateAsync({ phone: formData.phone, otp });
      // Navigation is handled in the mutation
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP.mutateAsync(formData.phone);
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
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {!showOTP ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sign Up
                </h2>
                <p className="text-gray-600">
                  Join thousands of riders using PickUp
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  name="name"
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  leftIcon={<User size={18} className="text-gray-400" />}
                  required
                />

                <PhoneInput
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />

                <Input
                  name="email"
                  type="email"
                  label="Email (Optional)"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  leftIcon={<Mail size={18} className="text-gray-400" />}
                />

                <Input
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  helperText="Minimum 6 characters"
                  required
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={registerUser.isPending}
                  >
                    Create Account
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Sign in
                  </Link>
                </p>

                <p className="text-sm text-gray-600">
                  Want to become a rider?{' '}
                  <Link
                    to="/driver/register"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <OTPVerification
              phone={formData.phone}
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
          By signing up, you agree to our{' '}
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