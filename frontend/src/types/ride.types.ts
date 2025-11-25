export interface Location {
  lat: number;
  lng: number;
  address: string;
  placeId?: string;
}

export interface Ride {
  id: string;
  userId: string;
  riderId?: string;
  pickup: Location;
  dropoff: Location;
  status: 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  fare?: number;
  distance?: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PreviousDestination {
  id: string;
  location: Location;
  lastUsed: string;
  usageCount: number;
}

export interface RideRequest {
  pickup: Location;
  dropoff: Location;
}

export interface FareEstimate {
  estimatedFare: number;
  distance: number;
  duration: number;
}
