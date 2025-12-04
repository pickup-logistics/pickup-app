import { Router } from 'express';
import { getBalance, getTransactions } from '../controllers/wallet.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All wallet routes require authentication
router.use(authenticate);

// Get wallet balance
router.get('/balance', getBalance);

// Get transaction history
router.get('/transactions', getTransactions);

export default router;
