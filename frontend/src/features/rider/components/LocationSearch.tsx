import { useEffect, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useLocationStore } from '@/store/locationStore';
import { Location } from '@/types/ride.types';

interface LocationSearchProps {
  placeholder?: string;
  onLocationSelect?: (location: Location) => void;
}

export function LocationSearch({
  placeholder = 'Where to?',
  onLocationSelect
}: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setDropoffLocation } = useLocationStore();

  useEffect(() => {
    // Check if Google Maps API is available
    if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      console.warn('Google Maps API not loaded yet. Autocomplete will not be available.');
      return;
    }

    try {
      const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ['formatted_address', 'geometry', 'place_id', 'name'],
        types: ['geocode', 'establishment'],
      });

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();

        if (place.geometry?.location) {
          const location: Location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || place.name || '',
            placeId: place.place_id,
          };

          setDropoffLocation(location);
          onLocationSelect?.(location);
        }
      });

      return () => {
        if (autocompleteInstance) {
          google.maps.event.clearInstanceListeners(autocompleteInstance);
        }
      };
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  }, [onLocationSelect, setDropoffLocation]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
          <MapPin className="w-5 h-5 text-gray-600" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="flex-1 outline-none text-lg font-medium text-gray-900 placeholder:text-gray-400"
        />
        <Search className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}
