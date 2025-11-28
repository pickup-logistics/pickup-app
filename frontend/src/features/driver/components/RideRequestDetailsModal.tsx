import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, DollarSign, User, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface RideRequestDetailsModalProps {
  ride: any;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

export const RideRequestDetailsModal: React.FC<RideRequestDetailsModalProps> = ({
  ride,
  onClose,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize map here when Google Maps is available
    // For now, we'll show a placeholder
    if (mapRef.current && typeof google !== 'undefined' && google.maps) {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: ride.pickupLatitude, lng: ride.pickupLongitude },
        zoom: 14,
      });

      // Add pickup marker
      new google.maps.Marker({
        position: { lat: ride.pickupLatitude, lng: ride.pickupLongitude },
        map: map,
        label: 'P',
        title: 'Pickup Location',
      });

      // Add dropoff marker
      new google.maps.Marker({
        position: { lat: ride.dropoffLatitude, lng: ride.dropoffLongitude },
        map: map,
        label: 'D',
        title: 'Dropoff Location',
      });

      // Draw route
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
      });

      directionsService.route(
        {
          origin: { lat: ride.pickupLatitude, lng: ride.pickupLongitude },
          destination: { lat: ride.dropoffLatitude, lng: ride.dropoffLongitude },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
          }
        }
      );
    }
  }, [ride]);

  return (
    <Modal isOpen={true} onClose={onClose} title="Ride Request Details">
      <div className="space-y-4">
        {/* Customer Info */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{ride.user?.name || 'User'}</h3>
            <p className="text-sm text-gray-600">{ride.user?.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">₦{ride.finalFare?.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{ride.distance?.toFixed(1)} km</p>
          </div>
        </div>

        {/* Map */}
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden"
          >
            {/* Fallback when Google Maps is not loaded */}
            {typeof google === 'undefined' && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Map loading...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Route Details */}
        <div className="space-y-3">
          {/* Pickup */}
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-green-700 mb-1">PICKUP LOCATION</p>
              <p className="text-sm font-medium text-gray-900">{ride.pickupAddress}</p>
              <p className="text-xs text-gray-600 mt-1">
                {ride.pickupLatitude?.toFixed(6)}, {ride.pickupLongitude?.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Dropoff */}
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-700 mb-1">DROPOFF LOCATION</p>
              <p className="text-sm font-medium text-gray-900">{ride.dropoffAddress}</p>
              <p className="text-xs text-gray-600 mt-1">
                {ride.dropoffLatitude?.toFixed(6)}, {ride.dropoffLongitude?.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        {/* Trip Info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Navigation className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Distance</p>
            <p className="text-sm font-semibold text-gray-900">{ride.distance?.toFixed(1)} km</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <DollarSign className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Payment</p>
            <p className="text-sm font-semibold text-gray-900">{ride.paymentMethod || 'CASH'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <MapPin className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Vehicle</p>
            <p className="text-sm font-semibold text-gray-900">{ride.vehicleType}</p>
          </div>
        </div>

        {/* Customer Notes */}
        {ride.notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">CUSTOMER NOTE</p>
            <p className="text-sm text-gray-900">{ride.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onReject}
            variant="secondary"
            size="lg"
            fullWidth
            isLoading={isRejecting}
            className="!bg-red-50 !text-red-600 hover:!bg-red-100"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Reject
          </Button>
          <Button
            onClick={onAccept}
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isAccepting}
          >
            <Check className="w-5 h-5 mr-2" />
            Accept Ride
          </Button>
        </div>
      </div>
    </Modal>
  );
};
