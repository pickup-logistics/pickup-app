import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { riderAPI } from '@/api/rider.api';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const AvailabilityToggle: React.FC = () => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const riderData = currentUser?.data?.user?.rider;
  const isAvailable = riderData?.isAvailable || false;

  const toggleMutation = useMutation({
    mutationFn: (newStatus: boolean) => riderAPI.toggleAvailability(newStatus),
    onSuccess: (response) => {
      toast.success(response.message || `You are now ${!isAvailable ? 'online' : 'offline'}`);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['riderStats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update availability');
    },
  });

  const handleToggle = () => {
    toggleMutation.mutate(!isAvailable);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={toggleMutation.isPending || riderData?.status !== 'APPROVED'}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isAvailable
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      } ${toggleMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Power className="w-5 h-5" />
      <span className="hidden sm:inline">
        {isAvailable ? 'Go Offline' : 'Go Online'}
      </span>
    </button>
  );
};
