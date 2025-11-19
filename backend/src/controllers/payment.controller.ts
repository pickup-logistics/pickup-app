import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as paymentService from '../services/payment.service';

/**
 * Initialize payment
 * POST /api/v1/payments/initialize
 */
export const initializePayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Validate request
    await body('rideId')
      .trim()
      .notEmpty()
      .withMessage('Ride ID is required')
      .run(req);
    await body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be greater than 0')
      .run(req);
    await body('provider')
      .isIn(['paystack', 'flutterwave'])
      .withMessage('Provider must be either paystack or flutterwave')
      .run(req);
    await body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { rideId, amount, provider, email } = req.body;

    const result = await paymentService.initializePayment({
      rideId,
      amount: parseFloat(amount),
      email,
      provider,
      paymentMethod: 'CARD',
    });

    return res.status(200).json({
      status: 'success',
      message: 'Payment initialized successfully',
      data: result.data,
    });
  } catch (error: any) {
    console.error('Initialize payment error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to initialize payment',
    });
  }
};

/**
 * Verify payment
 * POST /api/v1/payments/verify
 */
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Validate request
    await body('reference')
      .trim()
      .notEmpty()
      .withMessage('Payment reference is required')
      .run(req);
    await body('provider')
      .isIn(['paystack', 'flutterwave'])
      .withMessage('Provider must be either paystack or flutterwave')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { reference, provider } = req.body;

    const verification = await paymentService.verifyPayment({ reference, provider });

    if (!verification.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment verification failed',
        data: verification,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully',
      data: verification,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to verify payment',
    });
  }
};

/**
 * Process ride payment
 * POST /api/v1/payments/process
 */
export const processPayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Validate request
    await body('rideId')
      .trim()
      .notEmpty()
      .withMessage('Ride ID is required')
      .run(req);
    await body('reference')
      .trim()
      .notEmpty()
      .withMessage('Payment reference is required')
      .run(req);
    await body('provider')
      .isIn(['paystack', 'flutterwave'])
      .withMessage('Provider must be either paystack or flutterwave')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { rideId, reference, provider } = req.body;

    const result = await paymentService.processRidePayment(rideId, reference, provider);

    return res.status(200).json({
      status: 'success',
      message: 'Payment processed successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Process payment error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to process payment',
    });
  }
};

/**
 * Get available payment methods
 * GET /api/v1/payments/methods
 */
export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const methods = paymentService.getPaymentMethods();

    return res.status(200).json({
      status: 'success',
      data: methods,
    });
  } catch (error: any) {
    console.error('Get payment methods error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get payment methods',
    });
  }
};

/**
 * Get transaction history
 * GET /api/v1/payments/transactions
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const limit = parseInt(req.query.limit as string) || 20;

    const transactions = await paymentService.getTransactionHistory(req.user.userId, limit);

    return res.status(200).json({
      status: 'success',
      data: transactions,
    });
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get transactions',
    });
  }
};

/**
 * Paystack webhook handler
 * POST /api/v1/payments/webhooks/paystack
 */
export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;

    if (!signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing signature',
      });
    }

    // Verify signature
    const body = JSON.stringify(req.body);
    const isValid = paymentService.verifyPaystackWebhook(signature, body);

    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid signature',
      });
    }

    // Process webhook
    await paymentService.handlePaystackWebhook(req.body);

    return res.status(200).json({
      status: 'success',
      message: 'Webhook processed',
    });
  } catch (error: any) {
    console.error('Paystack webhook error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Webhook processing failed',
    });
  }
};

/**
 * Flutterwave webhook handler
 * POST /api/v1/payments/webhooks/flutterwave
 */
export const flutterwaveWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['verif-hash'] as string;

    if (!signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing signature',
      });
    }

    // Verify signature
    const body = JSON.stringify(req.body);
    const isValid = paymentService.verifyFlutterwaveWebhook(signature, body);

    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid signature',
      });
    }

    // Process webhook
    await paymentService.handleFlutterwaveWebhook(req.body);

    return res.status(200).json({
      status: 'success',
      message: 'Webhook processed',
    });
  } catch (error: any) {
    console.error('Flutterwave webhook error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Webhook processing failed',
    });
  }
};

/**
 * Calculate commission breakdown
 * GET /api/v1/payments/commission/:amount
 */
export const getCommission = async (req: Request, res: Response) => {
  try {
    const { amount } = req.params;

    const breakdown = paymentService.calculateCommission(parseFloat(amount));

    return res.status(200).json({
      status: 'success',
      data: breakdown,
    });
  } catch (error: any) {
    console.error('Get commission error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to calculate commission',
    });
  }
};