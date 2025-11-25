import { useEffect, useRef, useState } from 'react';
// import { MapPin, Search, Navigation, Clock } from 'lucide-react';
import { MapPin, Search, Navigation } from 'lucide-react';
import { useLocationStore } from '@/store/locationStore';
import { Location } from '@/types/ride.types';

interface LocationSearchProps {
  type?: 'pickup' | 'dropoff';
  placeholder?: string;
  value?: string;
  onLocationSelect?: (location: Location) => void;
  disabled?: boolean;
  showSuggestions?: boolean;
}

interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export function LocationSearch({
  type = 'dropoff',
  placeholder = 'Where to?',
  value,
  onLocationSelect,
  disabled = false,
  showSuggestions = true
}: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { setDropoffLocation, setPickupLocation } = useLocationStore();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // Initialize Google Places services
  useEffect(() => {
    // Wait for Google Maps API to load
    const initializePlacesServices = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.warn('Google Maps API not loaded yet. Retrying...');
        return false;
      }

      try {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();

        // Create a dummy div for PlacesService
        const dummyDiv = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);

        console.log('Google Places services initialized successfully');
        return true;
      } catch (error) {
        console.error('Error initializing Google Places services:', error);
        return false;
      }
    };

    // Try to initialize immediately
    if (initializePlacesServices()) {
      return;
    }

    // If not available, retry every 500ms for up to 10 seconds
    const maxRetries = 20;
    let retryCount = 0;

    const retryInterval = setInterval(() => {
      retryCount++;

      if (initializePlacesServices()) {
        clearInterval(retryInterval);
      } else if (retryCount >= maxRetries) {
        console.error('Failed to load Google Places API after multiple retries');
        clearInterval(retryInterval);
      }
    }, 500);

    return () => {
      clearInterval(retryInterval);
    };
  }, []);

  // Handle input change to fetch suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    if (!input || !showSuggestions || !autocompleteServiceRef.current) {
      setSuggestions([]);
      setShowSuggestionsList(false);
      return;
    }

    setIsLoadingSuggestions(true);

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input,
        types: ['geocode', 'establishment'],
      },
      (predictions, status) => {
        setIsLoadingSuggestions(false);

        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          const formattedSuggestions: PlaceSuggestion[] = predictions.map((prediction) => ({
            placeId: prediction.place_id,
            description: prediction.description,
            mainText: prediction.structured_formatting.main_text,
            secondaryText: prediction.structured_formatting.secondary_text || '',
          }));

          setSuggestions(formattedSuggestions);
          setShowSuggestionsList(true);
        } else {
          setSuggestions([]);
          setShowSuggestionsList(false);
        }
      }
    );
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    if (!placesServiceRef.current) return;

    // Get place details
    placesServiceRef.current.getDetails(
      {
        placeId: suggestion.placeId,
        fields: ['formatted_address', 'geometry', 'name', 'place_id'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const location: Location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || place.name || suggestion.description,
            placeId: place.place_id,
          };

          // Update input field
          if (inputRef.current) {
            inputRef.current.value = location.address;
          }

          // Update the appropriate location based on type
          if (type === 'pickup') {
            setPickupLocation(location);
          } else {
            setDropoffLocation(location);
          }

          onLocationSelect?.(location);

          // Hide suggestions
          setShowSuggestionsList(false);
          setSuggestions([]);
        }
      }
    );
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update input value when the value prop changes
  useEffect(() => {
    if (inputRef.current && value !== undefined) {
      inputRef.current.value = value;
    }
  }, [value]);

  const icon = type === 'pickup' ? (
    <Navigation className="w-5 h-5 text-primary-600" />
  ) : (
    <MapPin className="w-5 h-5 text-gray-600" />
  );

  return (
    <div className="relative">
      <div className={`flex items-center gap-3 bg-white rounded-lg shadow-lg p-4 border border-gray-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}>
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
          {icon}
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestionsList(true);
            }
          }}
          className="flex-1 outline-none text-lg font-medium text-gray-900 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-transparent"
        />
        <Search className="w-5 h-5 text-gray-400" />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsList && !disabled && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-y-auto z-50"
        >
          {isLoadingSuggestions ? (
            <div className="p-4 text-center">
              <div className="inline-block w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-sm text-gray-500">Loading suggestions...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="py-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion.placeId}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {suggestion.mainText}
                      </p>
                      {suggestion.secondaryText && (
                        <p className="text-sm text-gray-500 truncate">
                          {suggestion.secondaryText}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No locations found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
