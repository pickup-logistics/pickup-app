import { FareEstimate } from '@/types/ride.types';

// Fare calculation constants (should match backend)
const BASE_FARE = 200; // Base fare in Naira
const PER_KM_RATE = 50; // Rate per kilometer

/**
 * Calculate fare estimate based on distance and duration
 * @param distanceKm - Distance in kilometers
 * @param durationMinutes - Duration in minutes
 * @returns FareEstimate object with fare, distance, and duration
 */
export const calculateFareEstimate = (
  distanceKm: number,
  durationMinutes: number
): FareEstimate => {
  const totalFare = BASE_FARE + distanceKm * PER_KM_RATE;

  return {
    estimatedFare: Math.round(totalFare * 100) / 100, // Round to 2 decimal places
    distance: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
    duration: Math.round(durationMinutes), // Round to nearest minute
  };
};

/**
 * Format currency for display
 * @param amount - Amount in Naira
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format duration for display
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
};

/**
 * Format distance for display
 * @param km - Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};
