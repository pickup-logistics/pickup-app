import { monnifyService } from './monnify.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MonnifyService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should authenticate and reserve an account', async () => {
        // Mock Login Response
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                requestSuccessful: true,
                responseBody: {
                    accessToken: 'mock-access-token',
                    expiresIn: 3600,
                },
            },
        });

        // Mock Reserve Account Response
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                requestSuccessful: true,
                responseBody: {
                    contractCode: 'mock-contract',
                    accountReference: 'mock-ref',
                    accounts: [
                        {
                            bankCode: '035',
                            bankName: 'Wema Bank',
                            accountNumber: '1234567890',
                            accountName: 'Test User',
                        },
                    ],
                },
            },
        });

        const result = await monnifyService.reserveAccount('Test User', 'test@example.com', '08012345678');

        expect(result).toEqual({
            bankName: 'Wema Bank',
            accountNumber: '1234567890',
            accountName: 'Test User',
            bankCode: '035',
            accountReference: 'mock-ref',
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should return null if authentication fails', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Auth failed'));

        const result = await monnifyService.reserveAccount('Test User', 'test@example.com', '08012345678');

        expect(result).toBeNull();
    });
});
