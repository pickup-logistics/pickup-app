import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Filter,
} from 'lucide-react';
import { riderAPI } from '@/api/rider.api';
import { Button } from '@/components/common/Button';

export const RiderWallet: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'payment'>('all');

  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => riderAPI.getWallet(),
  });

  // Fetch transactions
  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => riderAPI.getTransactions(),
  });

  const balance = walletData?.data?.balance || 0;
  const transactions = transactionsData?.data || [];

  const filteredTransactions = transactions.filter((transaction: any) => {
    if (filter === 'all') return true;
    return transaction.type.toLowerCase() === filter;
  });

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return <ArrowDownCircle className="w-5 h-5 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpCircle className="w-5 h-5 text-red-600" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-blue-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      case 'payment':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
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
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Wallet</h1>
              <p className="text-sm text-gray-600">Manage your earnings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-8 h-8 opacity-90" />
              <span className="text-sm opacity-90">Available Balance</span>
            </div>
            <TrendingUp className="w-6 h-6 opacity-75" />
          </div>
          <div className="mb-6">
            <p className="text-4xl font-bold">₦{balance.toLocaleString()}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              className="!bg-white !text-green-700 hover:!bg-gray-100 flex-1"
            >
              <ArrowUpCircle className="w-5 h-5 mr-2" />
              Withdraw
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="!bg-white/20 !text-white hover:!bg-white/30 flex-1 backdrop-blur"
            >
              <ArrowDownCircle className="w-5 h-5 mr-2" />
              Deposit
            </Button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
              <Filter className="w-5 h-5 text-gray-400" />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'deposit', 'withdrawal', 'payment'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          <div className="divide-y divide-gray-200">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction: any) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {transaction.description || transaction.type}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(transaction.createdAt)}</span>
                          {transaction.reference && (
                            <span className="text-gray-400">• {transaction.reference}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}
                      >
                        {transaction.type.toLowerCase() === 'withdrawal' ? '-' : '+'}₦
                        {transaction.amount.toLocaleString()}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : transaction.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Transactions Yet
                </h3>
                <p className="text-gray-600">
                  Your transaction history will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
