import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create wallet for a new user
 */
export const createWallet = async (userId: string) => {
    try {
        const wallet = await prisma.wallet.create({
            data: {
                userId,
                balance: 0,
            },
        });
        return wallet;
    } catch (error: any) {
        console.error('Create wallet error:', error);
        throw new Error('Failed to create wallet');
    }
};

/**
 * Get user's wallet
 */
export const getWallet = async (userId: string) => {
    const wallet = await prisma.wallet.findUnique({
        where: { userId },
    });

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    return wallet;
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (userId: string) => {
    const wallet = await getWallet(userId);
    return wallet.balance;
};

/**
 * Credit user's wallet (for deposits)
 */
export const creditWallet = async (
    userId: string,
    amount: number,
    description: string,
    reference: string
) => {
    try {
        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Update wallet balance
            const wallet = await tx.wallet.update({
                where: { userId },
                data: {
                    balance: {
                        increment: amount,
                    },
                },
            });

            // Create transaction record
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    amount,
                    type: TransactionType.DEPOSIT,
                    status: TransactionStatus.COMPLETED,
                    provider: 'monnify',
                    reference,
                    description,
                },
            });

            return { wallet, transaction };
        });

        return result;
    } catch (error: any) {
        console.error('Credit wallet error:', error);
        throw new Error('Failed to credit wallet');
    }
};

/**
 * Debit user's wallet (for payments)
 */
export const debitWallet = async (
    userId: string,
    amount: number,
    description: string,
    rideId?: string
) => {
    try {
        // Check if user has sufficient balance first
        const wallet = await getWallet(userId);
        if (wallet.balance < amount) {
            throw new Error('Insufficient wallet balance');
        }

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Update wallet balance
            const updatedWallet = await tx.wallet.update({
                where: { userId },
                data: {
                    balance: {
                        decrement: amount,
                    },
                },
            });

            // Create transaction record
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    rideId,
                    amount,
                    type: TransactionType.PAYMENT,
                    status: TransactionStatus.COMPLETED,
                    provider: 'wallet',
                    description,
                },
            });

            return { wallet: updatedWallet, transaction };
        });

        return result;
    } catch (error: any) {
        console.error('Debit wallet error:', error);
        if (error.message === 'Insufficient wallet balance') {
            throw error;
        }
        throw new Error('Failed to debit wallet');
    }
};

/**
 * Get transaction history for user
 */
export const getTransactionHistory = async (userId: string, limit: number = 50) => {
    const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            ride: {
                select: {
                    id: true,
                    pickupAddress: true,
                    dropoffAddress: true,
                    status: true,
                },
            },
        },
    });

    return transactions;
};
