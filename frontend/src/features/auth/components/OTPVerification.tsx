import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import clsx from 'clsx';

interface OTPVerificationProps {
  phone: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  error?: string;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  phone,
  onVerify,
  onResend,
  isLoading = false,
  error,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (index === 5 && value) {
      const fullOtp = [...newOtp.slice(0, 5), value].join('');
      if (fullOtp.length === 6) {
        onVerify(fullOtp);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);

    // Focus last filled input or submit
    const lastIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();

    if (pastedData.length === 6) {
      onVerify(pastedData);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length === 6) {
      onVerify(fullOtp);
    }
  };

  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    onResend();
  };

  const maskPhone = (phoneNumber: string) => {
    // Format: +234 803 *** **90
    if (phoneNumber.startsWith('+234')) {
      const number = phoneNumber.slice(4);
      return `+234 ${number.slice(0, 3)} *** **${number.slice(-2)}`;
    }
    return phoneNumber;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verify Your Phone
        </h2>
        <p className="text-gray-600">
          We sent a 6-digit code to
        </p>
        <p className="font-semibold text-gray-900 mt-1">
          {maskPhone(phone)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={clsx(
                'w-12 h-14 text-center text-2xl font-bold rounded-lg border-2',
                'transition-all focus:outline-none focus:ring-2 focus:ring-primary-500',
                error
                  ? 'border-red-300 bg-red-50'
                  : digit
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300'
              )}
              disabled={isLoading}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          disabled={otp.join('').length !== 6 || isLoading}
        >
          Verify OTP
        </Button>

        <div className="text-center">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              disabled={isLoading}
            >
              Resend OTP
            </button>
          ) : (
            <p className="text-gray-600 text-sm">
              Resend OTP in{' '}
              <span className="font-semibold text-primary-600">{timer}s</span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};