import { Clock, MapPin, Navigation } from 'lucide-react';
import { FareEstimate } from '@/types/ride.types';
import { formatCurrency, formatDuration, formatDistance } from '@/services/ride.service';

interface RideConfirmationProps {
  fareEstimate: FareEstimate;
  pickupAddress: string;
  dropoffAddress: string;
  onConfirm: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function RideConfirmation({
  fareEstimate,
  pickupAddress,
  dropoffAddress,
  onConfirm,
  onBack,
  isLoading = false,
}: RideConfirmationProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Route Summary */}
      <div className="px-4 py-4 space-y-3">
        {/* From Location */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0 mt-1">
            <Navigation className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-1">From</p>
            <p className="text-sm font-medium text-gray-900 line-clamp-2">{pickupAddress}</p>
          </div>
        </div>

        {/* To Location */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg flex-shrink-0 mt-1">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-1">To</p>
            <p className="text-sm font-medium text-gray-900 line-clamp-2">{dropoffAddress}</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-200"></div>

      {/* Bike Options */}
      <div className="px-4 py-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose a ride</h3>

        {/* Standard Bike Option */}
        <div className="bg-gray-50 rounded-xl p-4 border-2 border-primary-600 hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Bike Icon */}
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 12a7 7 0 0114 0M5 12a7 7 0 000-14m14 14v-2a7 7 0 00-14 0v2"
                  />
                  <circle cx="5" cy="19" r="3" />
                  <circle cx="19" cy="19" r="3" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l3-3 3 3"
                  />
                </svg>
              </div>

              {/* Bike Info */}
              <div>
                <h4 className="font-semibold text-gray-900">Standard Bike</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formatDuration(fareEstimate.duration)} away
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-sm text-gray-600">
                    {formatDistance(fareEstimate.distance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(fareEstimate.estimatedFare)}
              </p>
            </div>
          </div>
        </div>

        {/* Additional bike options can be added here */}
      </div>

      {/* Spacer to push buttons to bottom */}
      <div className="flex-1"></div>

      {/* Action Buttons */}
      <div className="px-4 py-4 space-y-3 border-t border-gray-200">
        {/* Call Bike Button */}
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Calling Bike...</span>
            </div>
          ) : (
            'Call Bike'
          )}
        </button>

        {/* Back Button */}
        <button
          onClick={onBack}
          disabled={isLoading}
          className="w-full py-3 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Change Location
        </button>
      </div>
    </div>
  );
}
