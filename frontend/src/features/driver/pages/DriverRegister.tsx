import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/common/Input';
import { PhoneInput } from '@/components/common/PhoneInput';
import { Button } from '@/components/common/Button';
import { Bike, User, Mail, Lock, Upload, FileText, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'account' | 'vehicle' | 'documents';

export const DriverRegister: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('account');
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [vehicleData, setVehicleData] = useState({
    vehicleType: 'BIKE',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    plateNumber: '',
    licenseNumber: '',
  });
  const [documentFiles, setDocumentFiles] = useState<{
    vehiclePhoto: File | null;
    licensePhoto: File | null;
  }>({
    vehiclePhoto: null,
    licensePhoto: null,
  });

  const { registerUser, isAuthenticated, currentUser } = useAuth();
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (isAuthenticated) {
      // If they have a rider application, show status
      if (currentUser?.data?.user?.rider) {
        navigate('/apply-rider');
      } else {
        // If they're logged in but no rider app, redirect to apply
        navigate('/apply-rider');
      }
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setVehicleData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (field: 'vehiclePhoto' | 'licensePhoto') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setDocumentFiles((prev) => ({
        ...prev,
        [field]: file,
      }));
    }
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountData.name || !accountData.email || !accountData.phone || !accountData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (accountData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Move to vehicle info step
    setCurrentStep('vehicle');
  };

  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleData.plateNumber || !vehicleData.licenseNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Move to documents step
    setCurrentStep('documents');
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documentFiles.vehiclePhoto || !documentFiles.licensePhoto) {
      toast.error('Please upload both vehicle and license photos');
      return;
    }

    try {
      // Step 1: Register user account
      let formattedPhone = accountData.phone;
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = formattedPhone.substring(1);
        }
        formattedPhone = '+234' + formattedPhone;
      }

      toast.loading('Creating your account...', { id: 'registration' });

      await registerUser.mutateAsync({
        ...accountData,
        phone: formattedPhone,
      });

      // After registration, user is automatically logged in
      // Now submit rider application
      toast.loading('Submitting your rider application...', { id: 'registration' });

      const { riderAPI } = await import('@/api/rider.api');

      const riderResponse = await riderAPI.applyAsRider(
        {
          vehicleType: vehicleData.vehicleType,
          vehicleMake: vehicleData.vehicleMake || undefined,
          vehicleModel: vehicleData.vehicleModel || undefined,
          vehicleYear: vehicleData.vehicleYear ? parseInt(vehicleData.vehicleYear) : undefined,
          vehicleColor: vehicleData.vehicleColor || undefined,
          plateNumber: vehicleData.plateNumber,
          licenseNumber: vehicleData.licenseNumber,
        },
        {
          vehiclePhoto: documentFiles.vehiclePhoto,
          licensePhoto: documentFiles.licensePhoto,
        }
      );

      // Update auth store with new user role and tokens
      if (riderResponse.data?.user && riderResponse.data?.tokens) {
        const { user, tokens } = riderResponse.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
      }

      toast.success('Application submitted successfully! Awaiting approval.', { id: 'registration' });

      // Navigate to a pending approval page or driver home
      navigate('/driver/pending');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed', { id: 'registration' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Join PickUp as a Rider</h1>
          <p className="text-gray-600 mt-2">Start earning by providing rides</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {/* Step 1: Account */}
            <div className={`flex items-center ${currentStep === 'account' || currentStep === 'vehicle' || currentStep === 'documents' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                currentStep === 'account' ? 'border-green-600 bg-green-50' :
                (currentStep === 'vehicle' || currentStep === 'documents') ? 'border-green-600 bg-green-600 text-white' :
                'border-gray-300'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Account</span>
            </div>

            {/* Line 1 */}
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full ${currentStep === 'vehicle' || currentStep === 'documents' ? 'bg-green-600' : 'bg-gray-200'} transition-all`}></div>
            </div>

            {/* Step 2: Vehicle */}
            <div className={`flex items-center ${currentStep === 'vehicle' || currentStep === 'documents' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                currentStep === 'vehicle' ? 'border-green-600 bg-green-50' :
                currentStep === 'documents' ? 'border-green-600 bg-green-600 text-white' :
                'border-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Vehicle</span>
            </div>

            {/* Line 2 */}
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full ${currentStep === 'documents' ? 'bg-green-600' : 'bg-gray-200'} transition-all`}></div>
            </div>

            {/* Step 3: Documents */}
            <div className={`flex items-center ${currentStep === 'documents' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                currentStep === 'documents' ? 'border-green-600 bg-green-50' :
                'border-gray-300'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Documents</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Step 1: Account Information */}
          {currentStep === 'account' && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
                <p className="text-gray-600">Let's start with your basic information</p>
              </div>

              <Input
                name="name"
                label="Full Name"
                placeholder="John Doe"
                value={accountData.name}
                onChange={handleAccountChange}
                leftIcon={<User size={18} className="text-gray-400" />}
                required
                disabled={registerUser.isPending}
              />

              <Input
                name="email"
                type="email"
                label="Email"
                placeholder="john@example.com"
                value={accountData.email}
                onChange={handleAccountChange}
                leftIcon={<Mail size={18} className="text-gray-400" />}
                required
                disabled={registerUser.isPending}
              />

              <PhoneInput
                name="phone"
                value={accountData.phone}
                onChange={handleAccountChange}
                required
                disabled={registerUser.isPending}
                placeholder="803 456 7890"
              />

              <Input
                name="password"
                type="password"
                label="Password"
                placeholder="At least 6 characters"
                value={accountData.password}
                onChange={handleAccountChange}
                leftIcon={<Lock size={18} className="text-gray-400" />}
                helperText="Minimum 6 characters"
                required
                disabled={registerUser.isPending}
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" size="lg" fullWidth>
                  Continue
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: Vehicle Information */}
          {currentStep === 'vehicle' && (
            <form onSubmit={handleVehicleSubmit} className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Information</h2>
                <p className="text-gray-600">Tell us about your vehicle</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  name="vehicleType"
                  value={vehicleData.vehicleType}
                  onChange={handleVehicleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="BIKE">Bike/Motorcycle</option>
                  <option value="TRICYCLE">Tricycle</option>
                  <option value="BUS">Bus</option>
                  <option value="TRUCK">Truck</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="vehicleMake"
                  label="Make (Optional)"
                  placeholder="e.g., Honda, Yamaha"
                  value={vehicleData.vehicleMake}
                  onChange={handleVehicleChange}
                />

                <Input
                  name="vehicleModel"
                  label="Model (Optional)"
                  placeholder="e.g., CBR, XR"
                  value={vehicleData.vehicleModel}
                  onChange={handleVehicleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="vehicleYear"
                  label="Year (Optional)"
                  placeholder="e.g., 2020"
                  value={vehicleData.vehicleYear}
                  onChange={handleVehicleChange}
                  type="number"
                />

                <Input
                  name="vehicleColor"
                  label="Color (Optional)"
                  placeholder="e.g., Red, Blue"
                  value={vehicleData.vehicleColor}
                  onChange={handleVehicleChange}
                />
              </div>

              <Input
                name="plateNumber"
                label="Plate Number"
                placeholder="e.g., ABC-123-XY"
                value={vehicleData.plateNumber}
                onChange={handleVehicleChange}
                leftIcon={<CreditCard size={18} className="text-gray-400" />}
                required
              />

              <Input
                name="licenseNumber"
                label="Driver's License Number"
                placeholder="e.g., LAG1234567"
                value={vehicleData.licenseNumber}
                onChange={handleVehicleChange}
                leftIcon={<FileText size={18} className="text-gray-400" />}
                required
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => setCurrentStep('account')}
                >
                  Back
                </Button>
                <Button type="submit" variant="primary" size="lg" fullWidth>
                  Continue
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Documents Upload */}
          {currentStep === 'documents' && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
                <p className="text-gray-600">We need to verify your vehicle and license</p>
              </div>

              {/* Vehicle Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Photo <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange('vehiclePhoto')}
                    className="hidden"
                    id="vehiclePhoto"
                  />
                  <label htmlFor="vehiclePhoto" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {documentFiles.vehiclePhoto
                        ? documentFiles.vehiclePhoto.name
                        : 'Click to upload vehicle photo'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                  </label>
                </div>
              </div>

              {/* License Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver's License Photo <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange('licensePhoto')}
                    className="hidden"
                    id="licensePhoto"
                  />
                  <label htmlFor="licensePhoto" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {documentFiles.licensePhoto
                        ? documentFiles.licensePhoto.name
                        : 'Click to upload license photo'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                  </label>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Note:</strong> Your application will be reviewed by our team. You'll receive an email once your account is approved.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => setCurrentStep('vehicle')}
                  disabled={registerUser.isPending}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={registerUser.isPending}
                >
                  Submit Application
                </Button>
              </div>
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/driver/login"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Sign in
              </Link>
            </p>

            <p className="text-sm text-gray-600">
              Looking to book a ride?{' '}
              <Link
                to="/register"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Register as a passenger
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By signing up, you agree to our{' '}
          <a href="#" className="text-green-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-green-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};
