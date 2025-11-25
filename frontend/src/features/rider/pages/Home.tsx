import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Loader2 } from 'lucide-react';
import { MapView } from '@/components/map/MapView';
import { LocationSearch } from '@/features/rider/components/LocationSearch';
import { PreviousDestinations } from '@/features/rider/components/PreviousDestinations';
import { SettingsSidebar } from '@/components/common/SettingsSidebar';
import { useLocationStore } from '@/store/locationStore';
import { useRideStore } from '@/store/rideStore';
import { Location } from '@/types/ride.types';
import { getCurrentLocation } from '@/services/location.service';

// Bottom sheet snap positions
const SNAP_POSITIONS = {
  COLLAPSED: 280,  // Minimal height showing just input fields
  HALF: 450,       // Half screen
  FULL: 0.7,       // 70% of screen height (will be calculated)
};

export function RiderHome() {
  const navigate = useNavigate();
  const { pickupLocation, dropoffLocation, setPickupLocation, setCurrentLocation } = useLocationStore();
  const { setPreviousDestinations } = useRideStore();
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isManualPickup, setIsManualPickup] = useState(false);

  // Bottom sheet drag state
  const [sheetHeight, setSheetHeight] = useState(SNAP_POSITIONS.HALF);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const maxHeight = typeof window !== 'undefined' ? window.innerHeight * (SNAP_POSITIONS.FULL as number) : 500;

  // Get current location on mount
  useEffect(() => {
    const fetchCurrentLocation = async () => {
      setIsLoadingLocation(true);
      setLocationError(null);

      const result = await getCurrentLocation();

      if (result.success && result.location) {
        setCurrentLocation(result.location);
        setPickupLocation(result.location);
        setLocationError(null);
      } else {
        setLocationError(result.error || 'Unable to get your location');
        setIsManualPickup(true);
      }

      setIsLoadingLocation(false);
    };

    fetchCurrentLocation();
  }, [setCurrentLocation, setPickupLocation]);

  useEffect(() => {
    // Load previous destinations from localStorage or API
    const savedDestinations = localStorage.getItem('previousDestinations');
    if (savedDestinations) {
      try {
        const destinations = JSON.parse(savedDestinations);
        setPreviousDestinations(destinations);
      } catch (error) {
        console.error('Error loading previous destinations:', error);
      }
    }
  }, [setPreviousDestinations]);

  const handlePickupLocationSelect = (location: Location) => {
    console.log('Selected pickup location:', location);
    setPickupLocation(location);
  };

  const handleDropoffLocationSelect = (location: Location) => {
    console.log('Selected dropoff location:', location);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  // Drag handlers for bottom sheet
  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    setStartHeight(sheetHeight);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;

    const deltaY = startY - clientY;
    const newHeight = startHeight + deltaY;

    // Constrain height between collapsed and max
    const constrainedHeight = Math.max(
      SNAP_POSITIONS.COLLAPSED,
      Math.min(maxHeight, newHeight)
    );

    setSheetHeight(constrainedHeight);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // Snap to nearest position
    const snapPositions = [
      SNAP_POSITIONS.COLLAPSED,
      SNAP_POSITIONS.HALF,
      maxHeight,
    ];

    const nearest = snapPositions.reduce((prev, curr) => {
      return Math.abs(curr - sheetHeight) < Math.abs(prev - sheetHeight)
        ? curr
        : prev;
    });

    setSheetHeight(nearest);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleDragMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Add/remove event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, startY, startHeight, sheetHeight]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-100">
      {/* Map View */}
      <MapView height="100vh" />

      {/* Settings Button */}
      <button
        onClick={handleOpenSettings}
        className="absolute top-6 right-6 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors z-30"
      >
        <Settings className="w-6 h-6 text-gray-700" />
      </button>

      {/* Settings Sidebar */}
      <SettingsSidebar isOpen={showSettings} onClose={handleCloseSettings} />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-20 flex flex-col"
        style={{
          height: `${sheetHeight}px`,
          maxHeight: `${maxHeight}px`,
          transition: isDragging ? 'none' : 'height 0.3s ease-out',
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto"  style={{ overflowY: 'auto' }}>

        {/* Search Section */}
        <div className="px-4 py-4 space-y-3">
          {/* From/Pickup Location */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 ml-1">
              From
            </label>
            {isLoadingLocation ? (
              <div className="flex items-center gap-3 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                <span className="flex-1 text-lg font-medium text-gray-400">
                  Getting your location...
                </span>
              </div>
            ) : (
              <LocationSearch
                type="pickup"
                placeholder={
                  locationError
                    ? 'Enter pickup location'
                    : pickupLocation?.address || 'Current location'
                }
                value={pickupLocation?.address}
                onLocationSelect={handlePickupLocationSelect}
                disabled={!isManualPickup && !locationError}
                showSuggestions={isManualPickup || !!locationError}
              />
            )}
            {locationError && (
              <div className="mt-2 ml-1">
                <p className="text-xs text-red-600">{locationError}</p>
                <button
                  onClick={() => setIsManualPickup(true)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-1"
                >
                  Enter location manually
                </button>
              </div>
            )}
          </div>

          {/* To/Dropoff Location */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 ml-1">
              Where to?
            </label>
            <LocationSearch
              type="dropoff"
              placeholder="Enter destination"
              onLocationSelect={handleDropoffLocationSelect}
            />
          </div>
        </div>

        {/* Previous Destinations */}
        <PreviousDestinations onSelectDestination={handleDropoffLocationSelect} />

        {/* Action Button - always visible, disabled when locations not complete */}
        <div className="px-4 py-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/ride/book')}
            disabled={!pickupLocation || !dropoffLocation}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
              pickupLocation && dropoffLocation
                ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Go Home</span>
            </button>
            <button className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Go to Work</span>
            </button>
          </div>
        </div>
        </div>
        {/* End of scrollable content */}
      </div>
      {/* End of bottom sheet */}
    </div>
  );
}
