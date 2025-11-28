import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Wallet,
  Clock,
  TrendingUp,
  Star,
  DollarSign,
  Navigation,
  History,
  Menu,
  Bell,
  User as UserIcon,
} from 'lucide-react';
import { riderAPI } from '@/api/rider.api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AvailabilityToggle } from '../components/AvailabilityToggle';
import { RideRequestCard } from '../components/RideRequestCard';

export const DriverHome: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const riderData = currentUser?.data?.user?.rider;

  // Fetch rider stats
  const { data: stats } = useQuery({
    queryKey: ['riderStats', riderData?.id],
    queryFn: () => riderAPI.getStatistics(),
    enabled: !!riderData?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch pending ride requests
  const { data: pendingRides, refetch: refetchRides } = useQuery({
    queryKey: ['pendingRides', riderData?.id],
    queryFn: () => riderAPI.getPendingRides(),
    enabled: !!riderData?.id && riderData?.isAvailable,
    refetchInterval: 5000, // Refetch every 5 seconds when available
  });

  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => riderAPI.getWallet(),
    enabled: !!riderData?.id,
  });

  const statsData = stats?.data || {
    rating: riderData?.rating || 0,
    completedRides: riderData?.completedRides || 0,
    totalEarnings: riderData?.totalEarnings || 0,
    completionRate: 0,
  };

  const walletBalance = walletData?.data?.balance || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PickUp Rider</h1>
                <p className="text-sm text-gray-600">
                  {riderData?.isAvailable ? 'You are online' : 'You are offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AvailabilityToggle />
              <button
                onClick={() => navigate('/rider/notifications')}
                className="p-2 hover:bg-gray-100 rounded-lg relative"
              >
                <Bell className="w-6 h-6 text-gray-700" />
                {/* Notification badge */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={() => navigate('/rider/profile')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <UserIcon className="w-6 h-6 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Wallet Balance */}
          <div
            onClick={() => navigate('/rider/wallet')}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Wallet className="w-8 h-8 opacity-80" />
              <DollarSign className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-sm opacity-90 mb-1">Wallet Balance</p>
            <p className="text-2xl font-bold">�{walletBalance.toLocaleString()}</p>
          </div>

          {/* Total Earnings */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-sm opacity-90 mb-1">Total Earnings</p>
            <p className="text-2xl font-bold">�{statsData.totalEarnings.toLocaleString()}</p>
          </div>

          {/* Completed Rides */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Navigation className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-sm opacity-90 mb-1">Completed Rides</p>
            <p className="text-2xl font-bold">{statsData.completedRides}</p>
          </div>

          {/* Rating */}
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-sm opacity-90 mb-1">Your Rating</p>
            <p className="text-2xl font-bold">{statsData.rating.toFixed(1)} P</p>
          </div>
        </div>

        {/* Pending Ride Requests */}
        {riderData?.isAvailable && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Ride Requests</h2>
              {pendingRides?.data && pendingRides.data.length > 0 && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {pendingRides.data.length} New
                </span>
              )}
            </div>

            {pendingRides?.data && pendingRides.data.length > 0 ? (
              <div className="space-y-4">
                {pendingRides.data.map((ride: any) => (
                  <RideRequestCard key={ride.id} ride={ride} onUpdate={refetchRides} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Ride Requests
                </h3>
                <p className="text-gray-600">
                  You'll see ride requests here when customers need a ride in your area.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Offline State */}
        {!riderData?.isAvailable && (
          <div className="bg-white rounded-xl p-8 text-center mb-6">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              You're Offline
            </h3>
            <p className="text-gray-600 mb-4">
              Turn on availability to start receiving ride requests
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate('/rider/history')}
            className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition-shadow"
          >
            <History className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Ride History</h3>
            <p className="text-sm text-gray-600">View your past rides</p>
          </button>

          <button
            onClick={() => navigate('/rider/wallet')}
            className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition-shadow"
          >
            <Wallet className="w-10 h-10 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Wallet</h3>
            <p className="text-sm text-gray-600">Manage your earnings</p>
          </button>
        </div>

        {/* Today's Summary */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Today's Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rides Today</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Earnings Today</p>
              <p className="text-2xl font-bold text-gray-900">�0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Online Hours</p>
              <p className="text-2xl font-bold text-gray-900">0h</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Acceptance Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsData.completionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
