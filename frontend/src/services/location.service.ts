import { Location } from '@/types/ride.types';

export interface GeolocationResult {
  success: boolean;
  location?: Location;
  error?: string;
}

/**
 * Gets the user's current location using the browser's Geolocation API
 * and reverse geocodes it to get the address
 */
export async function getCurrentLocation(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'Geolocation is not supported by your browser',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Reverse geocode to get address
          const address = await reverseGeocode(lat, lng);

          resolve({
            success: true,
            location: {
              lat,
              lng,
              address,
            },
          });
        } catch (error) {
          // Even if reverse geocoding fails, return the coordinates
          resolve({
            success: true,
            location: {
              lat,
              lng,
              address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            },
          });
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        console.error('Geolocation error:', {
          code: error.code,
          message: error.message,
        });

        resolve({
          success: false,
          error: errorMessage,
        });
      },
      {
        enableHighAccuracy: false, // Changed to false for faster response
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 5000, // Allow cached location within 5 seconds
      }
    );
  });
}

/**
 * Waits for Google Maps API to be loaded
 */
async function waitForGoogleMaps(maxWaitTime = 10000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return false;
}

/**
 * Reverse geocodes coordinates to get a human-readable address
 */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // Wait for Google Maps API to load
  const isLoaded = await waitForGoogleMaps();

  if (!isLoaded) {
    throw new Error('Google Maps API not loaded');
  }

  const geocoder = new google.maps.Geocoder();
  const latlng = { lat, lng };

  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

/**
 * Watches the user's location and calls the callback with updates
 */
export function watchLocation(
  onLocationUpdate: (location: Location) => void,
  onError?: (error: string) => void
): () => void {
  if (!navigator.geolocation) {
    onError?.('Geolocation is not supported by your browser');
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        const address = await reverseGeocode(lat, lng);
        onLocationUpdate({ lat, lng, address });
      } catch (error) {
        onLocationUpdate({
          lat,
          lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
      }
    },
    (error) => {
      let errorMessage = 'Unable to retrieve your location';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
      }

      onError?.(errorMessage);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    }
  );

  // Return cleanup function
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}
