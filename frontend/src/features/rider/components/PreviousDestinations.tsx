import { Clock, MapPin } from 'lucide-react';
import { PreviousDestination, Location } from '@/types/ride.types';
import { useRideStore } from '@/store/rideStore';
import { useLocationStore } from '@/store/locationStore';

interface PreviousDestinationsProps {
  onSelectDestination?: (location: Location) => void;
}

export function PreviousDestinations({ onSelectDestination }: PreviousDestinationsProps) {
  const { previousDestinations } = useRideStore();
  const { setDropoffLocation } = useLocationStore();

  const handleSelectDestination = (destination: PreviousDestination) => {
    setDropoffLocation(destination.location);
    onSelectDestination?.(destination.location);
  };

  if (previousDestinations.length === 0) {
    return (
      <div className="px-4 py-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">Previous Destinations</h3>
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No previous destinations yet</p>
          <p className="text-gray-400 text-xs mt-1">Your recent drops will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <h3 className="text-sm font-semibold text-gray-500 mb-3">Previous Destinations</h3>
      <div className="space-y-2">
        {previousDestinations.slice(0, 5).map((destination) => (
          <button
            key={destination.id}
            onClick={() => handleSelectDestination(destination)}
            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {destination.location.address.split(',')[0]}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {destination.location.address}
              </p>
            </div>
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
