import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PhoneInput } from '@/components/common/PhoneInput';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Bike, User, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    email: '',
    password: '',
  });
  const { registerUser } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      // Ensure phone is in correct format (+234XXXXXXXXXX)
      let formattedPhone = formData.phone;
      if (!formattedPhone.startsWith('+')) {
        // Remove leading 0 if present
        if (formattedPhone.startsWith('0')) {
          formattedPhone = formattedPhone.substring(1);
        }
        formattedPhone = '+234' + formattedPhone;
      }

      // Register user directly with backend
      await registerUser.mutateAsync({
        ...formData,
        phone: formattedPhone,
      });

      // Navigation is handled in the mutation
    } catch (error: any) {
      console.error('Registration error:', error);
      // Error handling is done in the mutation
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
              disabled={registerUser.isPending}
            />

            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              leftIcon={<Mail size={18} className="text-gray-400" />}
              required
              disabled={registerUser.isPending}
            />

            <PhoneInput
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={registerUser.isPending}
              placeholder="803 456 7890"
            />

            <Input
              name="password"
              type="password"
              label="Password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              leftIcon={<Lock size={18} className="text-gray-400" />}
              helperText="Minimum 6 characters"
              required
              disabled={registerUser.isPending}
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

            <p className="text-xs text-gray-500 mt-3">
              Want to become a rider? Create your account first, then apply from your dashboard
            </p>
          </div>
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