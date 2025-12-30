// Validation and formatting utilities

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Check if it starts with + and has 10-15 digits after country code
  if (!cleaned.startsWith('+')) return false;
  const digits = cleaned.substring(1);
  // E.164 format: +[1-3 digit country code][7-15 digit number]
  // Total digits after + should be 10-15
  // Country code is 1-3 digits, so number part is 7-14 digits
  if (digits.length < 10 || digits.length > 15) return false;
  
  // Additional validation: country code should be 1-3 digits
  // This is a basic check - more sophisticated validation would check against known country codes
  return true;
}

export function isValidUsername(username: string): boolean {
  // Username should only contain letters, numbers, and underscores
  // No special characters allowed
  return /^[a-zA-Z0-9_]+$/.test(username) && username.length >= 3 && username.length <= 30;
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If user is typing and hasn't added + yet, don't force it
  // Only format if it already has + or is clearly a phone number
  if (!cleaned.startsWith('+') && cleaned.length > 0) {
    // If it's all digits and long enough, assume it needs country code
    if (cleaned.length >= 10) {
      cleaned = '+' + cleaned;
    } else {
      // Return as is if too short
      return phone;
    }
  }
  
  // Extract country code (1-3 digits after +)
  const match = cleaned.match(/^\+(\d{1,3})(\d+)$/);
  if (!match) {
    // If no match, return cleaned version
    return cleaned;
  }
  
  const countryCode = match[1];
  const number = match[2];
  
  // Format: +1 987-654-3210 (for 10-digit numbers)
  if (number.length === 10) {
    return `+${countryCode} ${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
  } else if (number.length > 10) {
    // For longer numbers, format first 10 digits and append rest
    return `+${countryCode} ${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6, 10)}${number.slice(10)}`;
  } else {
    // For shorter numbers, return with country code and space
    return `+${countryCode} ${number}`;
  }
}

export function detectInputType(input: string): 'email' | 'phone' | 'username' {
  if (input.includes('@')) {
    return 'email';
  }
  if (input.startsWith('+') || /^\d/.test(input)) {
    return 'phone';
  }
  return 'username';
}

export function getInputIcon(input: string): string {
  const type = detectInputType(input);
  switch (type) {
    case 'email':
      return '📧';
    case 'phone':
      return '📱';
    case 'username':
      return '👤';
    default:
      return '';
  }
}

