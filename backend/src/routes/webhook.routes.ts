import { Router } from 'express';
import { handleMonnifyWebhook } from '../controllers/webhook.controller';

const router = Router();

// Monnify webhook endpoint (no auth required - verified by signature)
router.post('/monnify', handleMonnifyWebhook);

export default router;
