import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { MapView } from '@/components/map/MapView';
import { LocationSearch } from '@/features/rider/components/LocationSearch';
import { PreviousDestinations } from '@/features/rider/components/PreviousDestinations';
import { SettingsSidebar } from '@/components/common/SettingsSidebar';
import { useLocationStore } from '@/store/locationStore';
import { useRideStore } from '@/store/rideStore';
import { Location } from '@/types/ride.types';

export function RiderHome() {
  const navigate = useNavigate();
  const { dropoffLocation } = useLocationStore();
  const { setPreviousDestinations } = useRideStore();
  const [showBottomSheet] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

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

  const handleLocationSelect = (location: Location) => {
    console.log('Selected location:', location);
    // Here you could navigate to booking page or show fare estimate
    // navigate('/ride/book');
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

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
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 z-20 ${
          showBottomSheet ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Search Section */}
        <div className="px-4 py-4">
          <LocationSearch
            placeholder="Where to?"
            onLocationSelect={handleLocationSelect}
          />
        </div>

        {/* Previous Destinations */}
        <PreviousDestinations onSelectDestination={handleLocationSelect} />

        {/* Action Button - shown when destination is selected */}
        {dropoffLocation && (
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/ride/book')}
              className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

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
    </div>
  );
}
