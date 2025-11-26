import { create } from 'zustand';
import { Location } from '@/types/ride.types';

interface LocationState {
  currentLocation: Location | null;
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  setCurrentLocation: (location: Location | null) => void;
  setPickupLocation: (location: Location | null) => void;
  setDropoffLocation: (location: Location | null) => void;
  clearLocations: () => void;
  clearAllLocations: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  pickupLocation: null,
  dropoffLocation: null,
  setCurrentLocation: (location) => set({ currentLocation: location }),
  setPickupLocation: (location) => set({ pickupLocation: location }),
  setDropoffLocation: (location) => set({ dropoffLocation: location }),
  clearLocations: () => set({
    pickupLocation: null,
    dropoffLocation: null
  }),
  clearAllLocations: () => set({
    currentLocation: null,
    pickupLocation: null,
    dropoffLocation: null
  }),
}));
