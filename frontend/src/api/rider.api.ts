import axios from './axios.config';

export interface RiderApplicationData {
  vehicleType: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  plateNumber: string;
  licenseNumber: string;
  licenseExpiryDate?: string;
  insuranceNumber?: string;
  insuranceExpiryDate?: string;
}

export const riderAPI = {
  /**
   * Submit rider application with documents
   */
  applyAsRider: async (data: RiderApplicationData, files: {
    vehiclePhoto?: File;
    licensePhoto?: File;
  }): Promise<{ status: string; message: string; data?: any }> => {
    const formData = new FormData();

    // Append all rider data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // Append files
    if (files.vehiclePhoto) {
      formData.append('vehiclePhoto', files.vehiclePhoto);
    }
    if (files.licensePhoto) {
      formData.append('licensePhoto', files.licensePhoto);
    }

    // Don't set Content-Type manually - let axios set it with the boundary
    const response = await axios.post('/v1/riders/register', formData);
    return response.data;
  },

  /**
   * Get rider profile
   */
  getRiderProfile: async (): Promise<{ status: string; data: any }> => {
    const response = await axios.get('/v1/riders/profile');
    return response.data;
  },

  /**
   * Update rider profile
   */
  updateRiderProfile: async (data: Partial<RiderApplicationData>): Promise<{ status: string; message: string; data: any }> => {
    const response = await axios.patch('/v1/riders/profile', data);
    return response.data;
  },

  /**
   * Upload/update rider documents
   */
  uploadDocuments: async (files: {
    vehiclePhoto?: File;
    licensePhoto?: File;
  }): Promise<{ status: string; message: string; data: any }> => {
    const formData = new FormData();

    if (files.vehiclePhoto) {
      formData.append('vehiclePhoto', files.vehiclePhoto);
    }
    if (files.licensePhoto) {
      formData.append('licensePhoto', files.licensePhoto);
    }

    // Don't set Content-Type manually - let axios set it with the boundary
    const response = await axios.post('/v1/riders/documents', formData);
    return response.data;
  },

  /**
   * Toggle rider availability
   */
  toggleAvailability: async (isAvailable: boolean): Promise<{ status: string; message: string; data: any }> => {
    const response = await axios.patch('/v1/riders/availability', { isAvailable });
    return response.data;
  },

  /**
   * Update rider location
   */
  updateLocation: async (latitude: number, longitude: number): Promise<{ status: string; message: string }> => {
    const response = await axios.patch('/v1/riders/location', { latitude, longitude });
    return response.data;
  },

  /**
   * Get rider statistics
   */
  getStatistics: async (): Promise<{ status: string; data: any }> => {
    const response = await axios.get('/v1/riders/statistics');
    return response.data;
  },

  /**
   * Get all approved riders (public)
   */
  getApprovedRiders: async (): Promise<{ status: string; data: any[] }> => {
    const response = await axios.get('/v1/riders');
    return response.data;
  },

  /**
   * Get pending ride requests for rider
   */
  getPendingRides: async (): Promise<{ status: string; data: any[] }> => {
    const response = await axios.get('/v1/rides/pending');
    return response.data;
  },

  /**
   * Get rider wallet details
   */
  getWallet: async (): Promise<{ status: string; data: { balance: number } }> => {
    const response = await axios.get('/v1/wallet/balance');
    return response.data;
  },

  /**
   * Get ride history
   */
  getRideHistory: async (): Promise<{ status: string; data: any[] }> => {
    const response = await axios.get('/v1/rides/history');
    return response.data;
  },

  /**
   * Accept a ride request
   */
  acceptRide: async (rideId: string): Promise<{ status: string; message: string; data: any }> => {
    const response = await axios.post(`/v1/rides/${rideId}/accept`);
    return response.data;
  },

  /**
   * Reject a ride request
   */
  rejectRide: async (rideId: string): Promise<{ status: string; message: string }> => {
    const response = await axios.post(`/v1/rides/${rideId}/reject`);
    return response.data;
  },

  /**
   * Start a ride
   */
  startRide: async (rideId: string): Promise<{ status: string; message: string; data: any }> => {
    const response = await axios.post(`/v1/rides/${rideId}/start`);
    return response.data;
  },

  /**
   * Complete a ride
   */
  completeRide: async (rideId: string): Promise<{ status: string; message: string; data: any }> => {
    const response = await axios.post(`/v1/rides/${rideId}/complete`);
    return response.data;
  },

  /**
   * Get wallet transactions
   */
  getTransactions: async (): Promise<{ status: string; data: any[] }> => {
    const response = await axios.get('/v1/wallet/transactions');
    return response.data;
  },
};
