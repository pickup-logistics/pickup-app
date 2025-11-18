import axios from 'axios';
import crypto from 'crypto';

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'PickUp';
const TERMII_BASE_URL = 'https://api.ng.termii.com/api';

// In-memory OTP storage (in production, use Redis)
interface OTPStore {
  [phone: string]: {
    otp: string;
    expiresAt: number;
    attempts: number;
  };
}

const otpStore: OTPStore = {};

/**
 * Generate 6-digit OTP
 */
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Store OTP for phone number
 */
export const storeOTP = (phone: string, otp: string, expiryMinutes: number = 10): void => {
  otpStore[phone] = {
    otp,
    expiresAt: Date.now() + expiryMinutes * 60 * 1000,
    attempts: 0,
  };
};

/**
 * Verify OTP
 */
export const verifyOTP = (phone: string, otp: string): { valid: boolean; message: string } => {
  const stored = otpStore[phone];

  if (!stored) {
    return { valid: false, message: 'No OTP found for this phone number' };
  }

  if (Date.now() > stored.expiresAt) {
    delete otpStore[phone];
    return { valid: false, message: 'OTP has expired' };
  }

  if (stored.attempts >= 3) {
    delete otpStore[phone];
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP' };
  }

  if (stored.otp !== otp) {
    stored.attempts++;
    return { valid: false, message: 'Invalid OTP' };
  }

  // OTP is valid, remove from store
  delete otpStore[phone];
  return { valid: true, message: 'OTP verified successfully' };
};

/**
 * Send OTP via Termii SMS
 */
export const sendOTPViaSMS = async (phone: string, otp: string): Promise<boolean> => {
  if (!TERMII_API_KEY) {
    console.warn('⚠️ TERMII_API_KEY not set. Using development mode (OTP will be logged).');
    console.log(`📱 Development Mode - OTP for ${phone}: ${otp}`);
    return true;
  }

  try {
    const message = `Your PickUp verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;

    const response = await axios.post(`${TERMII_BASE_URL}/sms/send`, {
      to: phone,
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      channel: 'generic',
      api_key: TERMII_API_KEY,
    });

    if (response.data.message_id) {
      console.log(`✅ OTP sent to ${phone}`);
      return true;
    }

    console.error('❌ Failed to send OTP:', response.data);
    return false;
  } catch (error) {
    console.error('❌ Error sending OTP via Termii:', error);
    return false;
  }
};

/**
 * Send OTP and store it
 */
export const sendOTP = async (phone: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Generate OTP
    const otp = generateOTP();

    // Store OTP
    storeOTP(phone, otp);

    // Send via SMS
    const sent = await sendOTPViaSMS(phone, otp);

    if (sent) {
      return {
        success: true,
        message: 'OTP sent successfully',
      };
    }

    return {
      success: false,
      message: 'Failed to send OTP. Please try again.',
    };
  } catch (error) {
    console.error('Error in sendOTP:', error);
    return {
      success: false,
      message: 'An error occurred while sending OTP',
    };
  }
};

/**
 * Clear OTP for phone number
 */
export const clearOTP = (phone: string): void => {
  delete otpStore[phone];
};

/**
 * Get remaining OTP attempts
 */
export const getRemainingAttempts = (phone: string): number => {
  const stored = otpStore[phone];
  if (!stored) return 0;
  return Math.max(0, 3 - stored.attempts);
};