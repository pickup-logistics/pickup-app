import { create } from 'zustand';
import { Ride, PreviousDestination } from '@/types/ride.types';

interface RideState {
  currentRide: Ride | null;
  rideHistory: Ride[];
  previousDestinations: PreviousDestination[];
  setCurrentRide: (ride: Ride | null) => void;
  addToHistory: (ride: Ride) => void;
  setPreviousDestinations: (destinations: PreviousDestination[]) => void;
  addPreviousDestination: (destination: PreviousDestination) => void;
  clearRideData: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  currentRide: null,
  rideHistory: [],
  previousDestinations: [],
  setCurrentRide: (ride) => set({ currentRide: ride }),
  addToHistory: (ride) => set((state) => ({
    rideHistory: [ride, ...state.rideHistory]
  })),
  setPreviousDestinations: (destinations) => set({ previousDestinations: destinations }),
  addPreviousDestination: (destination) => set((state) => ({
    previousDestinations: [destination, ...state.previousDestinations]
  })),
  clearRideData: () => set({
    currentRide: null,
    rideHistory: [],
    previousDestinations: []
  }),
}));
