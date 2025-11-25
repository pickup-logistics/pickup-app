import { useEffect, useState } from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { useLocationStore } from '@/store/locationStore';
import { Loader2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface MapViewProps {
  height?: string;
  onMapClick?: (location: { lat: number; lng: number }) => void;
}

export function MapView({ height = '100%', onMapClick }: MapViewProps) {
  const { currentLocation, pickupLocation, dropoffLocation } = useLocationStore();
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 6.5244, // Default to Lagos, Nigeria
    lng: 3.3792,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate API key
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here' || GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key') {
      setError('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
      setIsLoading(false);
      return;
    }

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(newLocation);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
        }
      );
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Update center when pickup location changes
    if (pickupLocation) {
      setCenter({ lat: pickupLocation.lat, lng: pickupLocation.lng });
    } else if (currentLocation) {
      setCenter({ lat: currentLocation.lat, lng: currentLocation.lng });
    }
  }, [pickupLocation, currentLocation]);

  if (error) {
    return (
      <div style={{ height, width: '100%' }} className="flex items-center justify-center bg-gray-100">
        <div className="text-center p-6">
          <div className="text-red-500 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Error</h3>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ height, width: '100%' }} className="flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%' }}>
      <APIProvider
        apiKey={GOOGLE_MAPS_API_KEY}
        libraries={['places', 'geocoding']}
      >
        <Map
          center={center}
          zoom={15}
          mapId="pickup-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          onClick={(e) => {
            if (onMapClick && e.detail.latLng) {
              onMapClick({
                lat: e.detail.latLng.lat,
                lng: e.detail.latLng.lng,
              });
            }
          }}
        >
          {/* Current Location Marker */}
          {currentLocation && (
            <Marker
              position={{ lat: currentLocation.lat, lng: currentLocation.lng }}
            />
          )}

          {/* Pickup Location Marker */}
          {pickupLocation && (
            <Marker
              position={{ lat: pickupLocation.lat, lng: pickupLocation.lng }}
            />
          )}

          {/* Dropoff Location Marker */}
          {dropoffLocation && (
            <Marker
              position={{ lat: dropoffLocation.lat, lng: dropoffLocation.lng }}
            />
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
