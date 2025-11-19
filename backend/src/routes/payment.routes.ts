import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Payment routes
 */

// Get available payment methods (public)
router.get('/methods', paymentController.getPaymentMethods);

// Initialize payment
router.post('/initialize', authenticate, paymentController.initializePayment);

// Verify payment
router.post('/verify', authenticate, paymentController.verifyPayment);

// Process ride payment
router.post('/process', authenticate, paymentController.processPayment);

// Get transaction history
router.get('/transactions', authenticate, paymentController.getTransactions);

// Get commission breakdown
router.get('/commission/:amount', paymentController.getCommission);

/**
 * Webhook routes (no authentication - verified by signature)
 */

// Paystack webhook
router.post('/webhooks/paystack', paymentController.paystackWebhook);

// Flutterwave webhook
router.post('/webhooks/flutterwave', paymentController.flutterwaveWebhook);

export default router;