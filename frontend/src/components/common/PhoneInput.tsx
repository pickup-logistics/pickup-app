import React, { forwardRef, useState, useEffect } from 'react';
import { Input } from './Input';
import { Phone } from 'lucide-react';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, label = 'Phone Number', error, helperText, name = 'phone', ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');

    // Initialize display value from prop value
    useEffect(() => {
      if (value && value.startsWith('+234')) {
        // Convert +2348034567890 to "803 456 7890"
        const digits = value.slice(4); // Remove +234
        setDisplayValue(formatPhoneNumber(digits));
      } else if (value) {
        setDisplayValue(value);
      }
    }, []);

    const formatPhoneNumber = (input: string): string => {
      // Remove all non-digits
      const cleaned = input.replace(/\D/g, '');
      
      // If starts with 0, remove it
      const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
      
      // Limit to 10 digits (without country code)
      const limited = withoutLeadingZero.slice(0, 10);
      
      // Format as XXX XXX XXXX
      if (limited.length <= 3) {
        return limited;
      } else if (limited.length <= 6) {
        return `${limited.slice(0, 3)} ${limited.slice(3)}`;
      } else {
        return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 10)}`;
      }
    };

    const getFullPhoneNumber = (formatted: string): string => {
      const cleaned = formatted.replace(/\D/g, '');
      return cleaned ? `+234${cleaned}` : '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const formatted = formatPhoneNumber(input);
      setDisplayValue(formatted);

      // Create a new event with the full phone number in the correct field
      const fullNumber = getFullPhoneNumber(formatted);
      
      // Call onChange with the properly formatted event
      if (onChange) {
        const event = {
          ...e,
          target: {
            ...e.target,
            name: name,
            value: fullNumber,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(event);
      }
    };

    return (
      <Input
        ref={ref}
        type="tel"
        name={name}
        label={label}
        error={error}
        helperText={helperText || 'Format: 803 456 7890'}
        placeholder="803 456 7890"
        value={displayValue}
        onChange={handleChange}
        leftIcon={
          <div className="flex items-center gap-1 text-gray-500">
            <Phone size={18} />
            {/* <span className="text-sm font-medium">+234</span> */}
          </div>
        }
        {...props}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';