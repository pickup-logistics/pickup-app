import { PrismaClient, PaymentMethod, PaymentStatus } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';
import { io } from '../server';

const prisma = new PrismaClient();

// Payment Gateway Configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY;

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

export interface InitializePaymentData {
  rideId: string;
  amount: number;
  email: string;
  provider: 'paystack' | 'flutterwave';
  paymentMethod: PaymentMethod;
}

export interface VerifyPaymentData {
  reference: string;
  provider: 'paystack' | 'flutterwave';
}

/**
 * Initialize payment with Paystack
 */
export const initializePaystackPayment = async (data: InitializePaymentData) => {
  const { rideId, amount, email } = data;

  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        reference: `ride_${rideId}_${Date.now()}`,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          rideId,
          custom_fields: [
            {
              display_name: 'Ride ID',
              variable_name: 'ride_id',
              value: rideId,
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: {
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference,
      },
    };
  } catch (error: any) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to initialize payment');
  }
};

/**
 * Initialize payment with Flutterwave
 */
export const initializeFlutterwavePayment = async (data: InitializePaymentData) => {
  const { rideId, amount, email } = data;

  try {
    const response = await axios.post(
      `${FLUTTERWAVE_BASE_URL}/payments`,
      {
        tx_ref: `ride_${rideId}_${Date.now()}`,
        amount,
        currency: 'NGN',
        redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
        customer: {
          email,
        },
        customizations: {
          title: 'PickUp Ride Payment',
          description: `Payment for ride ${rideId}`,
          logo: `${process.env.FRONTEND_URL}/logo.png`,
        },
        meta: {
          rideId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: {
        authorizationUrl: response.data.data.link,
        reference: response.data.data.tx_ref,
      },
    };
  } catch (error: any) {
    console.error('Flutterwave initialization error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to initialize payment');
  }
};

/**
 * Initialize payment (auto-select provider)
 */
export const initializePayment = async (data: InitializePaymentData) => {
  if (data.provider === 'paystack') {
    return initializePaystackPayment(data);
  } else if (data.provider === 'flutterwave') {
    return initializeFlutterwavePayment(data);
  } else {
    throw new Error('Invalid payment provider');
  }
};

/**
 * Verify Paystack payment
 */
export const verifyPaystackPayment = async (reference: string) => {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data.data;

    return {
      success: paymentData.status === 'success',
      amount: paymentData.amount / 100, // Convert from kobo
      reference: paymentData.reference,
      status: paymentData.status,
      paidAt: paymentData.paid_at,
      channel: paymentData.channel,
      metadata: paymentData.metadata,
    };
  } catch (error: any) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    throw new Error('Failed to verify payment');
  }
};

/**
 * Verify Flutterwave payment
 */
export const verifyFlutterwavePayment = async (transactionId: string) => {
  try {
    const response = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data.data;

    return {
      success: paymentData.status === 'successful',
      amount: paymentData.amount,
      reference: paymentData.tx_ref,
      status: paymentData.status,
      paidAt: paymentData.created_at,
      channel: paymentData.payment_type,
      metadata: paymentData.meta,
    };
  } catch (error: any) {
    console.error('Flutterwave verification error:', error.response?.data || error.message);
    throw new Error('Failed to verify payment');
  }
};

/**
 * Verify payment (auto-detect provider)
 */
export const verifyPayment = async (data: VerifyPaymentData) => {
  if (data.provider === 'paystack') {
    return verifyPaystackPayment(data.reference);
  } else if (data.provider === 'flutterwave') {
    return verifyFlutterwavePayment(data.reference);
  } else {
    throw new Error('Invalid payment provider');
  }
};

/**
 * Process payment for a ride
 */
export const processRidePayment = async (
  rideId: string,
  paymentReference: string,
  provider: 'paystack' | 'flutterwave'
) => {
  // Verify payment
  const verification = await verifyPayment({ reference: paymentReference, provider });

  if (!verification.success) {
    throw new Error('Payment verification failed');
  }

  // Get ride
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      user: true,
      rider: {
        include: { user: true },
      },
    },
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  // Verify amount matches
  if (Math.abs(verification.amount - ride.finalFare) > 1) {
    throw new Error('Payment amount mismatch');
  }

  // Update ride payment status
  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.CARD,
    },
  });

  // Create transaction record
  const transaction = await prisma.$queryRaw`
    INSERT INTO transactions (
      id, "rideId", "userId", amount, type, status, 
      provider, reference, "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), 
      ${rideId}, 
      ${ride.userId}, 
      ${verification.amount}, 
      'PAYMENT', 
      'COMPLETED',
      ${provider},
      ${paymentReference},
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  // Update rider earnings
  if (ride.riderId) {
    await prisma.rider.update({
      where: { id: ride.riderId },
      data: {
        totalEarnings: {
          increment: verification.amount,
        },
      },
    });
  }

  // Notify both parties
  io.to(`user:${ride.userId}`).emit('payment:completed', {
    rideId,
    amount: verification.amount,
    reference: paymentReference,
  });

  if (ride.rider) {
    io.to(`user:${ride.rider.userId}`).emit('payment:received', {
      rideId,
      amount: verification.amount,
    });
  }

  return {
    success: true,
    ride: updatedRide,
    transaction,
  };
};

/**
 * Verify Paystack webhook signature
 */
export const verifyPaystackWebhook = (signature: string, body: string): boolean => {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex');

  return hash === signature;
};

/**
 * Verify Flutterwave webhook signature
 */
export const verifyFlutterwaveWebhook = (signature: string, body: string): boolean => {
  const hash = crypto
    .createHmac('sha256', FLUTTERWAVE_SECRET_KEY!)
    .update(body)
    .digest('hex');

  return hash === signature;
};

/**
 * Handle Paystack webhook
 */
export const handlePaystackWebhook = async (event: any) => {
  const { event: eventType, data } = event;

  if (eventType === 'charge.success') {
    const rideId = data.metadata?.rideId;
    const reference = data.reference;

    if (rideId && reference) {
      try {
        await processRidePayment(rideId, reference, 'paystack');
        console.log(`✅ Paystack webhook: Payment processed for ride ${rideId}`);
      } catch (error) {
        console.error('Paystack webhook processing error:', error);
      }
    }
  }
};

/**
 * Handle Flutterwave webhook
 */
export const handleFlutterwaveWebhook = async (event: any) => {
  const { event: eventType, data } = event;

  if (eventType === 'charge.completed' && data.status === 'successful') {
    const rideId = data.meta?.rideId;
    const reference = data.tx_ref;

    if (rideId && reference) {
      try {
        await processRidePayment(rideId, reference, 'flutterwave');
        console.log(`✅ Flutterwave webhook: Payment processed for ride ${rideId}`);
      } catch (error) {
        console.error('Flutterwave webhook processing error:', error);
      }
    }
  }
};

/**
 * Get payment methods for user
 */
export const getPaymentMethods = () => {
  return [
    {
      id: 'cash',
      name: 'Cash',
      type: PaymentMethod.CASH,
      icon: '💵',
      enabled: true,
    },
    {
      id: 'card_paystack',
      name: 'Card (Paystack)',
      type: PaymentMethod.CARD,
      provider: 'paystack',
      icon: '💳',
      enabled: !!PAYSTACK_SECRET_KEY,
    },
    {
      id: 'card_flutterwave',
      name: 'Card (Flutterwave)',
      type: PaymentMethod.CARD,
      provider: 'flutterwave',
      icon: '💳',
      enabled: !!FLUTTERWAVE_SECRET_KEY,
    },
    {
      id: 'wallet',
      name: 'Wallet',
      type: PaymentMethod.WALLET,
      icon: '👛',
      enabled: false, // TODO: Implement wallet
    },
  ];
};

/**
 * Get transaction history for user
 */
export const getTransactionHistory = async (userId: string, limit: number = 20) => {
  const transactions = await prisma.$queryRaw`
    SELECT * FROM transactions
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;

  return transactions;
};

/**
 * Calculate platform commission
 */
export const calculateCommission = (amount: number): { 
  riderEarnings: number; 
  platformFee: number;
  commission: number;
} => {
  const commissionRate = parseFloat(process.env.COMMISSION_RATE || '0.15'); // 15% default
  const commission = amount * commissionRate;
  const riderEarnings = amount - commission;
  const platformFee = commission;

  return {
    riderEarnings: parseFloat(riderEarnings.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    commission: parseFloat(commission.toFixed(2)),
  };
};