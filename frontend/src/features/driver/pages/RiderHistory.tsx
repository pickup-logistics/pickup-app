import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  DollarSign,
  Calendar,
  Star,
  User,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { riderAPI } from '@/api/rider.api';

export const RiderHistory: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'COMPLETED' | 'CANCELLED'>('all');

  // Fetch ride history
  const { data: historyData } = useQuery({
    queryKey: ['rideHistory'],
    queryFn: () => riderAPI.getRideHistory(),
  });

  const rides = historyData?.data || [];

  const filteredRides = rides.filter((ride: any) => {
    if (filter === 'all') return true;
    return ride.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ride History</h1>
              <p className="text-sm text-gray-600">{rides.length} total rides</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'COMPLETED', 'CANCELLED'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterType
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filterType === 'all' ? 'All Rides' : filterType}
            </button>
          ))}
        </div>

        {/* Rides List */}
        <div className="space-y-4">
          {filteredRides.length > 0 ? (
            filteredRides.map((ride: any) => (
              <div
                key={ride.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Ride Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{ride.user?.name || 'User'}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(ride.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      ₦{ride.finalFare?.toLocaleString()}
                    </p>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(ride.status)}`}>
                      {getStatusIcon(ride.status)}
                      <span>{ride.status}</span>
                    </div>
                  </div>
                </div>

                {/* Route */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-900 flex-1">{ride.pickupAddress}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-900 flex-1">{ride.dropoffAddress}</p>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    <span>{ride.distance?.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{ride.duration || 'N/A'} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>{ride.paymentMethod}</span>
                  </div>
                  {ride.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{ride.rating.rating}/5</span>
                    </div>
                  )}
                </div>

                {/* Cancellation Reason */}
                {ride.status === 'CANCELLED' && ride.cancellationReason && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <strong>Cancelled:</strong> {ride.cancellationReason}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl p-12 text-center">
              <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Rides Found
              </h3>
              <p className="text-gray-600">
                {filter === 'all'
                  ? 'You haven\'t completed any rides yet'
                  : `No ${filter.toLowerCase()} rides found`}
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {rides.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {rides.filter((r: any) => r.status === 'COMPLETED').length}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {rides.filter((r: any) => r.status === 'CANCELLED').length}
                </p>
                <p className="text-sm text-gray-600">Cancelled</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  ₦{rides.reduce((sum: number, r: any) => sum + (r.finalFare || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Earnings</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
