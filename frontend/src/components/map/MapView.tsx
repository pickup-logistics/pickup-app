import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useLocationStore } from '@/store/locationStore';
import { Loader2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface MapViewProps {
  height?: string;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  onRouteCalculated?: (distance: number, duration: number) => void;
}

// Component to calculate route distance/duration without rendering
function RouteCalculator({ pickup, dropoff, onRouteCalculated }: {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  onRouteCalculated?: (distance: number, duration: number) => void;
}) {
  const map = useMap();
  const [hasCalculated, setHasCalculated] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>('');

  useEffect(() => {
    if (!map) return;

    // Create a unique key for this route
    const routeKey = `${pickup.lat},${pickup.lng}-${dropoff.lat},${dropoff.lng}`;

    // Only calculate if this is a new route
    if (hasCalculated && currentRoute === routeKey) {
      return;
    }

    setCurrentRoute(routeKey);

    // Calculate route using Directions API
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: pickup,
        destination: dropoff,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          // Get route distance and duration
          const route = result.routes[0];
          if (route && route.legs[0]) {
            const distance = route.legs[0].distance?.value || 0; // in meters
            const duration = route.legs[0].duration?.value || 0; // in seconds

            onRouteCalculated?.(distance / 1000, duration / 60); // convert to km and minutes
            setHasCalculated(true);
          }

          // Fit bounds to show both markers with padding for bottom sheet
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(pickup);
          bounds.extend(dropoff);
          // Add extra bottom padding to account for bottom sheet (450-500px)
          map.fitBounds(bounds, { top: 80, bottom: 500, left: 80, right: 80 });
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, [map, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  return null;
}

export function MapView({ height = '100%', onMapClick, onRouteCalculated }: MapViewProps) {
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
          {/* Pickup Location Marker with START label */}
          {pickupLocation && (
            <AdvancedMarker
              position={{ lat: pickupLocation.lat, lng: pickupLocation.lng }}
            >
              <div className="flex flex-col items-center">
                <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg border-2 border-white">
                  START
                </div>
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-600 -mt-0.5"></div>
              </div>
            </AdvancedMarker>
          )}

          {/* Dropoff Location Marker with STOP label */}
          {dropoffLocation && (
            <AdvancedMarker
              position={{ lat: dropoffLocation.lat, lng: dropoffLocation.lng }}
            >
              <div className="flex flex-col items-center">
                <div className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg border-2 border-white">
                  STOP
                </div>
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-red-600 -mt-0.5"></div>
              </div>
            </AdvancedMarker>
          )}

          {/* Route Calculator - calculates distance/duration when both locations are set */}
          {pickupLocation && dropoffLocation && (
            <RouteCalculator
              pickup={{ lat: pickupLocation.lat, lng: pickupLocation.lng }}
              dropoff={{ lat: dropoffLocation.lat, lng: dropoffLocation.lng }}
              onRouteCalculated={onRouteCalculated}
            />
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
