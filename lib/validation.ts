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

  // Only auto-format if it starts with +
  // Usernames often start with digits, so we shouldn't format those
  if (!cleaned.startsWith('+')) {
    return phone;
  }

  // Special case for +1 (US/Canada)
  if (cleaned.startsWith('+1')) {
    const number = cleaned.slice(2);
    if (number.length === 10) {
      return `+1 ${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
    } else if (number.length > 0) {
      // Add a space after +1 for readability
      return `+1 ${number}`;
    }
    return '+1';
  }

  // General formatting for other country codes: +CC XXXXXXXX
  // Extract country code (1-3 digits after +)
  // Since we don't have a lookup table, we'll try to be smart
  // Most country codes are followed by 8-11 digits
  const match = cleaned.match(/^\+(\d{1,3})(\d*)$/);
  if (match) {
    const countryCode = match[1];
    const number = match[2];

    if (number) {
      return `+${countryCode} ${number}`;
    }
    return `+${countryCode}`;
  }

  return cleaned;
}

export function detectInputType(input: string): 'email' | 'phone' | 'username' {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    return 'email';
  }
  // Only detect as phone if it starts with + or is a long string of digits
  if (trimmed.startsWith('+') || /^\d{10,}$/.test(trimmed)) {
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

