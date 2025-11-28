import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com';
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;

if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY || !MONNIFY_CONTRACT_CODE) {
    console.warn('Monnify credentials are not set in environment variables.');
}

interface MonnifyAuthResponse {
    requestSuccessful: boolean;
    responseMessage: string;
    responseCode: string;
    responseBody: {
        accessToken: string;
        expiresIn: number;
    };
}

interface ReserveAccountResponse {
    requestSuccessful: boolean;
    responseMessage: string;
    responseCode: string;
    responseBody: {
        contractCode: string;
        accountReference: string;
        accountName: string;
        currencyCode: string;
        customerEmail: string;
        customerName: string;
        accounts: {
            bankCode: string;
            bankName: string;
            accountNumber: string;
            accountName: string;
        }[];
        collectionChannel: string;
        reservationReference: string;
    };
}

class MonnifyService {
    private accessToken: string | null = null;
    private tokenExpiry: number | null = null;

    private async authenticate(): Promise<string> {
        // Check if token is valid (with 60s buffer)
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
            return this.accessToken;
        }

        try {
            const auth = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');
            const response = await axios.post<MonnifyAuthResponse>(
                `${MONNIFY_BASE_URL}/api/v1/auth/login`,
                {},
                {
                    headers: {
                        Authorization: `Basic ${auth}`,
                    },
                }
            );

            if (response.data.requestSuccessful) {
                this.accessToken = response.data.responseBody.accessToken;
                // Set expiry based on expiresIn (seconds) -> milliseconds, add to current time
                this.tokenExpiry = Date.now() + response.data.responseBody.expiresIn * 1000;
                return this.accessToken;
            } else {
                throw new Error(`Monnify authentication failed: ${response.data.responseMessage}`);
            }
        } catch (error: any) {
            console.error('Monnify Auth Error:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with Monnify');
        }
    }

    async reserveAccount(name: string, email: string, bvn: string) {
        try {
            const token = await this.authenticate();
            const accountReference = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            const response = await axios.post<ReserveAccountResponse>(
                `${MONNIFY_BASE_URL}/api/v2/bank-transfer/reserved-accounts`,
                {
                    accountReference,
                    accountName: name,
                    currencyCode: 'NGN',
                    contractCode: MONNIFY_CONTRACT_CODE,
                    customerEmail: email,
                    customerName: name,
                    getAllAvailableBanks: true,
                    bvn,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.requestSuccessful) {
                const account = response.data.responseBody.accounts[0];
                return {
                    bankName: account.bankName,
                    accountNumber: account.accountNumber,
                    accountName: account.accountName,
                    bankCode: account.bankCode,
                    accountReference: response.data.responseBody.accountReference
                };
            } else {
                throw new Error(`Monnify reserve account failed: ${response.data.responseMessage}`);
            }
        } catch (error: any) {
            console.error('Monnify Reserve Account Error:', error.response?.data || error.message);
            return null;
        }
    }

    verifyWebhookSignature(payload: any, signature: string): boolean {
        try {
            const crypto = require('crypto');
            const hash = crypto
                .createHmac('sha512', MONNIFY_SECRET_KEY)
                .update(JSON.stringify(payload))
                .digest('hex');
            return hash === signature;
        } catch (error) {
            console.error('Webhook signature verification error:', error);
            return false;
        }
    }
}

export const monnifyService = new MonnifyService();
