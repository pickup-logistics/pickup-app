import { Request, Response } from 'express';
import { monnifyService } from '../services/monnify.service';
import { creditWallet } from '../services/wallet.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Handle Monnify webhook for payment notifications
 */
export const handleMonnifyWebhook = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        const signature = req.headers['monnify-signature'] as string;

        // Verify webhook signature
        if (!signature || !monnifyService.verifyWebhookSignature(payload, signature)) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Extract payment details from webhook payload
        const {
            eventType,
            eventData,
        } = payload;

        // Only process successful transactions
        if (eventType !== 'SUCCESSFUL_TRANSACTION') {
            return res.status(200).json({ message: 'Event acknowledged' });
        }

        const {
            amountPaid,
            accountReference,
            transactionReference,
            customerName,
        } = eventData;

        console.log('Monnify webhook received:', {
            eventType,
            amountPaid,
            accountReference,
            transactionReference,
        });

        // Find user by account reference
        const user = await prisma.user.findFirst({
            where: { accountReference },
        });

        if (!user) {
            console.error('User not found for account reference:', accountReference);
            return res.status(404).json({ error: 'User not found' });
        }

        // Credit user's wallet
        await creditWallet(
            user.id,
            parseFloat(amountPaid),
            `Deposit via Monnify from ${customerName}`,
            transactionReference
        );

        console.log(`Successfully credited ₦${amountPaid} to user ${user.id}`);

        // Return success response to Monnify
        return res.status(200).json({
            message: 'Webhook processed successfully',
        });
    } catch (error: any) {
        console.error('Monnify webhook error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
