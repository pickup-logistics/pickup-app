import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Bike, Upload, FileText, CreditCard, ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { riderAPI } from '@/api/rider.api';
import { MainLayout } from '@/layouts/MainLayout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

type Step = 'vehicle' | 'documents';

export const ApplyAsRider: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('vehicle');
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

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();
  const { currentUser } = useAuth();

  // Check if user already has a rider application
  const riderStatus = currentUser?.data?.user?.rider?.status;
  const hasExistingApplication = !!currentUser?.data?.user?.rider;

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!documentFiles.vehiclePhoto || !documentFiles.licensePhoto) {
        throw new Error('Please upload both documents');
      }

      return riderAPI.applyAsRider(
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
    },
    onSuccess: (response) => {
      // Update auth store with new user data and tokens if returned
      if (response.data?.user && response.data?.tokens) {
        const { user, tokens } = response.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
      }

      // Invalidate and refetch current user query to get updated rider status
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      toast.success('Application submitted successfully! Awaiting approval.');
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Application failed');
    },
  });

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

  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleData.plateNumber || !vehicleData.licenseNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCurrentStep('documents');
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!documentFiles.vehiclePhoto || !documentFiles.licensePhoto) {
      toast.error('Please upload both vehicle and license photos');
      return;
    }

    applyMutation.mutate();
  };

  // Render status card if user already has an application
  if (hasExistingApplication) {
    const statusConfig = {
      PENDING: {
        icon: Clock,
        color: 'yellow',
        title: 'Application Under Review',
        message: 'Your rider application is currently being reviewed by our team. This typically takes 1-3 business days.',
      },
      APPROVED: {
        icon: CheckCircle,
        color: 'green',
        title: 'Application Approved!',
        message: 'Congratulations! Your rider application has been approved. You can now start accepting rides.',
      },
      REJECTED: {
        icon: XCircle,
        color: 'red',
        title: 'Application Not Approved',
        message: 'Unfortunately, your rider application was not approved. Please contact support for more information.',
      },
      SUSPENDED: {
        icon: XCircle,
        color: 'red',
        title: 'Account Suspended',
        message: 'Your rider account has been suspended. Please contact support for assistance.',
      },
    };

    const config = statusConfig[riderStatus as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <div className={`w-20 h-20 bg-${config?.color}-100 rounded-full flex items-center justify-center`}>
                <Icon className={`w-10 h-10 text-${config?.color}-600`} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
              {config?.title}
            </h1>

            <p className="text-lg text-gray-600 text-center mb-8">
              {config?.message}
            </p>

            <div className="flex gap-3">
              {riderStatus === 'APPROVED' && (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => navigate('/driver/home')}
                >
                  Go to Dashboard
                </Button>
              )}
              <Button
                variant={riderStatus === 'APPROVED' ? 'secondary' : 'primary'}
                size="lg"
                fullWidth
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Bike className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Become a Rider</h1>
              <p className="text-gray-600">Join our team and start earning today</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep === 'vehicle' || currentStep === 'documents' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                currentStep === 'vehicle' ? 'border-green-600 bg-green-50' :
                currentStep === 'documents' ? 'border-green-600 bg-green-600 text-white' :
                'border-gray-300'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Vehicle Info</span>
            </div>

            <div className="flex-1 h-1 mx-4 bg-gray-200 max-w-xs">
              <div className={`h-full ${currentStep === 'documents' ? 'bg-green-600' : 'bg-gray-200'} transition-all`}></div>
            </div>

            <div className={`flex items-center ${currentStep === 'documents' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                currentStep === 'documents' ? 'border-green-600 bg-green-50' :
                'border-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Documents</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {/* Step 1: Vehicle Information */}
          {currentStep === 'vehicle' && (
            <form onSubmit={handleVehicleSubmit} className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Information</h2>
                <p className="text-gray-600">Tell us about your vehicle</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type <span className="text-red-500">*</span>
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

              <div className="pt-2">
                <Button type="submit" variant="primary" size="lg" fullWidth>
                  Continue to Documents
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: Documents Upload */}
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
                  <strong>Note:</strong> Your application will be reviewed by our team. You'll receive an email once your account is approved (typically 1-3 business days).
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => setCurrentStep('vehicle')}
                  disabled={applyMutation.isPending}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={applyMutation.isPending}
                >
                  Submit Application
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
