import { Request, Response } from 'express';
import { getWallet, getWalletBalance, getTransactionHistory } from '../services/wallet.service';

/**
 * Get user's wallet balance
 */
export const getBalance = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id; // From auth middleware

        const wallet = await getWallet(userId);

        return res.json({
            success: true,
            data: {
                balance: wallet.balance,
                userId: wallet.userId,
            },
        });
    } catch (error: any) {
        console.error('Get balance error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to get wallet balance',
        });
    }
};

/**
 * Get user's transaction history
 */
export const getTransactions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id; // From auth middleware
        const limit = parseInt(req.query.limit as string) || 50;

        const transactions = await getTransactionHistory(userId, limit);

        return res.json({
            success: true,
            data: transactions,
        });
    } catch (error: any) {
        console.error('Get transactions error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to get transaction history',
        });
    }
};
