import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MapPin, Navigation, DollarSign, Clock, User, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { riderAPI } from '@/api/rider.api';
import { Button } from '@/components/common/Button';
import { RideRequestDetailsModal } from './RideRequestDetailsModal';

interface RideRequestCardProps {
  ride: any;
  onUpdate: () => void;
}

export const RideRequestCard: React.FC<RideRequestCardProps> = ({ ride, onUpdate }) => {
  const [showDetails, setShowDetails] = useState(false);

  const acceptMutation = useMutation({
    mutationFn: () => riderAPI.acceptRide(ride.id),
    onSuccess: (response) => {
      toast.success('Ride accepted! Navigate to pickup location');
      onUpdate();
      setShowDetails(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept ride');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => riderAPI.rejectRide(ride.id),
    onSuccess: () => {
      toast.success('Ride rejected');
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject ride');
    },
  });

  const handleAccept = () => {
    acceptMutation.mutate();
  };

  const handleReject = () => {
    rejectMutation.mutate();
  };

  return (
    <>
      <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{ride.user?.name || 'User'}</h3>
              <p className="text-sm text-gray-600">{ride.user?.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">₦{ride.finalFare?.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{ride.distance?.toFixed(1)} km</p>
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Pickup</p>
              <p className="text-sm font-medium text-gray-900">{ride.pickupAddress}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-3 h-3 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Dropoff</p>
              <p className="text-sm font-medium text-gray-900">{ride.dropoffAddress}</p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{ride.duration ? `${ride.duration} min` : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Navigation className="w-4 h-4" />
            <span>{ride.vehicleType}</span>
          </div>
          {ride.paymentMethod && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>{ride.paymentMethod}</span>
            </div>
          )}
        </div>

        {ride.notes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">Note from customer:</p>
            <p className="text-sm text-gray-900">{ride.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => setShowDetails(true)}
            variant="secondary"
            size="md"
            fullWidth
          >
            View on Map
          </Button>
          <Button
            onClick={handleReject}
            variant="secondary"
            size="md"
            className="!bg-red-50 !text-red-600 hover:!bg-red-100"
            isLoading={rejectMutation.isPending}
          >
            <X className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleAccept}
            variant="primary"
            size="md"
            fullWidth
            isLoading={acceptMutation.isPending}
          >
            <Check className="w-5 h-5 mr-2" />
            Accept
          </Button>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <RideRequestDetailsModal
          ride={ride}
          onClose={() => setShowDetails(false)}
          onAccept={handleAccept}
          onReject={handleReject}
          isAccepting={acceptMutation.isPending}
          isRejecting={rejectMutation.isPending}
        />
      )}
    </>
  );
};
