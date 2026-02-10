import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CountryCodePicker } from '../components/CountryCodePicker';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { isValidEmail, isValidPhone, isValidUsername, getInputIcon } from '../lib/validation';
import { CountryCode, getDefaultCountry } from '../lib/countryCodes';
import * as authApi from '../lib/auth';
import { ENABLE_PHONE_AUTH } from '../lib/auth';

export default function RegisterScreen() {
  const [registrationMethod, setRegistrationMethod] = useState<'email' | 'phone'>(ENABLE_PHONE_AUTH ? 'phone' : 'email');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(getDefaultCountry());
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Field-level errors
  const [emailOrPhoneError, setEmailOrPhoneError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneForVerification, setPhoneForVerification] = useState('');
  const { signUp } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleEmailOrPhoneBlur = async () => {
    if (!emailOrPhone.trim()) {
      setEmailOrPhoneError('');
      return;
    }

    if (registrationMethod === 'email') {
      if (!isValidEmail(emailOrPhone.trim())) {
        setEmailOrPhoneError('Email format is not correct');
      } else {
        // Check if email exists
        try {
          const exists = await authApi.checkEmailExists(emailOrPhone.trim());
          if (exists) {
            setEmailOrPhoneError('Email already exists');
          } else {
            setEmailOrPhoneError('');
          }
        } catch (err) {
          setEmailOrPhoneError('');
        }
      }
    } else {
      // For phone, combine country code with phone number
      // Remove all non-digits from the input
      const phoneDigits = emailOrPhone.replace(/\D/g, '');

      // Don't check if phone is too short
      if (phoneDigits.length < 10) {
        setEmailOrPhoneError('');
        return;
      }

      // Ensure country code doesn't have + duplicated
      const dialCode = selectedCountry.dialCode.startsWith('+')
        ? selectedCountry.dialCode
        : '+' + selectedCountry.dialCode;

      // Combine: dialCode already has +, so just add digits
      const fullPhone = dialCode + phoneDigits;

      if (__DEV__) {
        console.log('🔍 Phone validation - digits:', phoneDigits, 'fullPhone:', fullPhone);
      }

      if (!isValidPhone(fullPhone)) {
        setEmailOrPhoneError('Mobile number format is not correct');
      } else {
        // Check if phone exists (using full phone with country code)
        try {
          if (__DEV__) {
            console.log('🔍 Checking if phone exists:', fullPhone);
          }
          const exists = await authApi.checkPhoneExists(fullPhone);
          if (__DEV__) {
            console.log('✅ Phone exists check result:', exists);
          }
          if (exists) {
            setEmailOrPhoneError('Mobile number already exists');
          } else {
            setEmailOrPhoneError('');
          }
        } catch (err: any) {
          // Only log in development
          if (__DEV__) {
            console.error('❌ Error checking phone existence:', err);
          }
          // Don't show error if it's a network/database error, just clear it
          if (err.message?.includes('already exists')) {
            setEmailOrPhoneError('Mobile number already exists');
          } else {
            setEmailOrPhoneError('');
          }
        }
      }
    }
  };

  const handleUsernameBlur = async () => {
    if (!username.trim()) {
      setUsernameError('');
      return;
    }

    if (!isValidUsername(username.trim())) {
      setUsernameError('Username should only contain letters, numbers, and underscores (3-30 characters)');
    } else {
      // Check if username exists
      try {
        const exists = await authApi.checkUsernameExists(username.trim());
        if (exists) {
          setUsernameError('Username already exists');
        } else {
          setUsernameError('');
        }
      } catch (err) {
        setUsernameError('');
      }
    }
  };

  const handlePasswordBlur = () => {
    if (!password) {
      setPasswordError('');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (!confirmPassword) {
      setConfirmPasswordError('');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handlePhoneChange = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');

    // Limit to reasonable length (15 digits max)
    const limitedDigits = digits.slice(0, 15);

    // Format phone number (US format: XXX-XXX-XXXX)
    let formatted = limitedDigits;
    if (limitedDigits.length > 6) {
      formatted = `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    } else if (limitedDigits.length > 3) {
      formatted = `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
    }

    setEmailOrPhone(formatted);
    // Clear errors when user types
    setEmailOrPhoneError('');
    setError('');
  };

  const isFormValid = () => {
    // Don't enable if loading
    if (isLoading) return false;

    // Check if all fields are filled
    if (!emailOrPhone.trim()) return false;
    if (!username.trim()) return false;
    if (!password) return false;
    if (!confirmPassword) return false;

    // Validate email/phone format
    if (registrationMethod === 'email') {
      if (!isValidEmail(emailOrPhone.trim())) return false;
    } else {
      const phoneDigits = emailOrPhone.replace(/\D/g, '');
      const fullPhone = selectedCountry.dialCode + phoneDigits;
      if (!isValidPhone(fullPhone)) return false;
    }

    // Validate username format
    if (!isValidUsername(username.trim())) return false;

    // Validate password length
    if (password.length < 6) return false;

    // Validate password match
    if (password !== confirmPassword) return false;

    // Check if there are any field errors (only if fields have been touched)
    if (emailOrPhoneError || usernameError || passwordError || confirmPasswordError) return false;

    return true;
  };

  const handleRegister = async () => {
    // Clear all errors
    setError('');
    setEmailOrPhoneError('');
    setUsernameError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate all fields
    let hasErrors = false;

    if (!emailOrPhone.trim()) {
      setEmailOrPhoneError(registrationMethod === 'email' ? 'Email is required' : 'Mobile number is required');
      hasErrors = true;
    } else if (registrationMethod === 'email' && !isValidEmail(emailOrPhone.trim())) {
      setEmailOrPhoneError('Email format is not correct');
      hasErrors = true;
    } else if (registrationMethod === 'phone') {
      const phoneDigits = emailOrPhone.replace(/\D/g, '');
      const fullPhone = selectedCountry.dialCode + phoneDigits;
      if (!isValidPhone(fullPhone)) {
        setEmailOrPhoneError('Mobile number format is not correct');
        hasErrors = true;
      }
    }

    if (!username.trim()) {
      setUsernameError('Username is required');
      hasErrors = true;
    } else if (!isValidUsername(username.trim())) {
      setUsernameError('Username should only contain letters, numbers, and underscores (3-30 characters)');
      hasErrors = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasErrors = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasErrors = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      hasErrors = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cleanedEmailOrPhone = registrationMethod === 'phone'
        ? selectedCountry.dialCode + emailOrPhone.replace(/\D/g, '')
        : emailOrPhone.trim();

      console.log('Attempting registration with:', {
        method: registrationMethod,
        identifier: cleanedEmailOrPhone,
        username: username.trim(),
      });

      const result = await signUp(cleanedEmailOrPhone, password, username.trim(), registrationMethod === 'phone');

      // Check if phone verification is needed (only if OTP verification is enabled)
      if (result && (result as any).needsVerification && registrationMethod === 'phone') {
        console.log('📱 Phone verification required');
        setNeedsVerification(true);
        setPhoneForVerification(cleanedEmailOrPhone);
        setError('');
        // Don't clear form yet - user needs to verify
        return;
      }

      console.log('Registration successful');

      // Success - clear form
      setEmailOrPhone('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setError('');

      // Show success popup and redirect to login
      Alert.alert(
        'Success',
        'You have successfully registered!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/login');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      // Log errors only in development, not in production
      if (__DEV__) {
        console.error('Registration error:', err);
        console.error('Error details:', {
          message: err.message,
          code: err.code,
          status: err.status,
        });
        console.error('❌ Registration error:', err.message || err.error?.message || 'Failed to register. Please try again.');
      }

      const errorMessage = err.message || err.error?.message || 'Failed to register. Please try again.';

      // Check for phone signups disabled
      const lowerErrorMessage = errorMessage.toLowerCase();
      if (lowerErrorMessage.includes('phone signups are disabled') ||
        lowerErrorMessage.includes('phone signups disabled') ||
        lowerErrorMessage.includes('phone registration is currently disabled') ||
        lowerErrorMessage.includes('signups are disabled')) {
        const phoneDisabledMsg = 'Phone number registration is currently disabled in Supabase. To enable it: Go to Supabase Dashboard → Authentication → Settings → Enable "Phone" provider. Or use Email registration instead.';
        console.log('🚫 PHONE SIGNUPS DISABLED - Showing error to user');
        setError(phoneDisabledMsg);
        setEmailOrPhoneError('Phone registration is disabled');
        setIsLoading(false);
        return;
      }

      // Set specific field errors if available (but don't duplicate with general error)
      const lowerMessage = errorMessage.toLowerCase();
      if (lowerMessage.includes('email already exists') || lowerMessage.includes('user already registered')) {
        setEmailOrPhoneError('Email already exists');
        // Don't show general error if it's a field-specific error
        setError('');
      } else if (lowerMessage.includes('mobile number already exists') ||
        (lowerMessage.includes('phone') && lowerMessage.includes('already'))) {
        setEmailOrPhoneError('Mobile number already exists');
        // Don't show general error if it's a field-specific error
        setError('');
      } else if (lowerMessage.includes('username already exists')) {
        setUsernameError('Username already exists');
        // Don't show general error if it's a field-specific error
        setError('');
      } else if (lowerMessage.includes('invalid email')) {
        setEmailOrPhoneError('Invalid email format');
        setError('');
      } else if (lowerMessage.includes('invalid phone')) {
        setEmailOrPhoneError('Invalid phone number format');
        setError('');
      } else {
        // For other errors, show general error message
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!verificationCode.trim() || verificationCode.trim().length < 6) {
      setVerificationError('Please enter the 6-digit verification code');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');

    try {
      console.log('Verifying OTP code...');
      await authApi.verifyPhoneOTP(phoneForVerification, verificationCode.trim());

      console.log('✅ OTP verified successfully');

      // Clear everything and redirect to login
      setEmailOrPhone('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setVerificationCode('');
      setNeedsVerification(false);
      setPhoneForVerification('');
      setError('');

      // Redirect to login page
      router.replace('/login');
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const errorMessage = err?.message || 'Invalid verification code. Please try again.';
      setVerificationError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsVerifying(true);
    setVerificationError('');

    try {
      console.log('========================================');
      console.log('📤 RESENDING OTP');
      console.log('========================================');
      console.log('Phone:', phoneForVerification);
      console.log('========================================');

      await authApi.resendPhoneOTP(phoneForVerification);
      setVerificationError('');

      // Show success message
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone. If you don\'t receive it, check your Supabase SMS provider configuration.');
    } catch (err: any) {
      console.error('========================================');
      console.error('❌ RESEND OTP ERROR');
      console.error('========================================');
      console.error('Error:', err);
      console.error('Error message:', err?.message);
      console.error('Error code:', err?.code);
      console.error('========================================');

      let errorMessage = err?.message || 'Failed to resend code. Please try again.';

      // Provide helpful error message if SMS provider is not configured
      if (err?.message?.includes('SMS') || err?.message?.includes('provider') || err?.code === 'sms_provider_not_configured') {
        errorMessage = 'SMS provider is not configured in Supabase. Please set up Twilio or another SMS provider in Supabase Dashboard → Authentication → Settings → Phone.';
      }

      setVerificationError(errorMessage);
      Alert.alert('Resend Failed', errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const textColor = isDark ? Colors.dark.text : Colors.light.text;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={[styles.title, { color: textColor }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              Sign up to get started
            </Text>

            <View style={styles.form}>
              {/* Registration Method Toggle */}
              {ENABLE_PHONE_AUTH && (
                <View style={styles.methodToggle}>
                  <TouchableOpacity
                    style={[
                      styles.methodButton,
                      registrationMethod === 'email' && styles.methodButtonActive,
                      { borderColor: isDark ? '#3a3a3c' : '#c7c7cc' },
                    ]}
                    onPress={() => {
                      setRegistrationMethod('email');
                      setEmailOrPhone('');
                      setEmailOrPhoneError('');
                      setError('');
                    }}
                  >
                    <Text style={[styles.methodButtonText, { color: textColor }]}>📧 Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.methodButton,
                      registrationMethod === 'phone' && styles.methodButtonActive,
                      { borderColor: isDark ? '#3a3a3c' : '#c7c7cc' },
                    ]}
                    onPress={() => {
                      setRegistrationMethod('phone');
                      setEmailOrPhone('');
                      setEmailOrPhoneError('');
                      setError('');
                    }}
                  >
                    <Text style={[styles.methodButtonText, { color: textColor }]}>📱 Mobile</Text>
                  </TouchableOpacity>
                </View>
              )}

              {registrationMethod === 'phone' ? (
                <View>
                  <Text style={[styles.label, { color: textColor }]}>Mobile Number</Text>
                  <View style={styles.phoneInputContainer}>
                    <CountryCodePicker
                      selectedCountry={selectedCountry}
                      onSelect={(country) => {
                        setSelectedCountry(country);
                        // Clear error when country code changes
                        setEmailOrPhoneError('');
                        setError('');
                      }}
                    />
                    <View style={styles.phoneNumberInput}>
                      <Input
                        value={emailOrPhone.replace(selectedCountry.dialCode, '').trim()}
                        onChangeText={handlePhoneChange}
                        onBlur={handleEmailOrPhoneBlur}
                        placeholder="987-654-3210"
                        autoCapitalize="none"
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        error={emailOrPhoneError}
                        containerStyle={{ marginBottom: 0 }}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <Input
                  label="Email"
                  value={emailOrPhone}
                  onChangeText={(text) => {
                    setEmailOrPhone(text);
                    setEmailOrPhoneError('');
                    setError('');
                  }}
                  onBlur={handleEmailOrPhoneBlur}
                  placeholder="user@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  error={emailOrPhoneError}
                />
              )}

              <Input
                label="Username"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setUsernameError('');
                  setError('');
                }}
                onBlur={handleUsernameBlur}
                placeholder="Username"
                autoCapitalize="none"
                autoComplete="username"
                error={usernameError}
              />

              <Input
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                  setError('');
                }}
                onBlur={handlePasswordBlur}
                placeholder="Create a password (min 6 characters)"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                error={passwordError}
              />

              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setConfirmPasswordError('');
                  setError('');
                }}
                onBlur={handleConfirmPasswordBlur}
                placeholder="Confirm your password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                error={confirmPasswordError}
              />

              {needsVerification ? (
                <View style={styles.verificationContainer}>
                  <Text style={[styles.verificationTitle, { color: textColor }]}>
                    Verify Your Phone Number
                  </Text>
                  <Text style={[styles.verificationSubtitle, { color: isDark ? '#8e8e93' : '#666' }]}>
                    We sent a 6-digit code to {phoneForVerification.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1 $2-$3-$4')}
                  </Text>
                  <View style={[styles.infoBox, { backgroundColor: isDark ? '#2c2c2e' : '#e5e5ea', borderColor: isDark ? '#3a3a3c' : '#c7c7cc' }]}>
                    <Text style={[styles.infoText, { color: isDark ? '#8e8e93' : '#666' }]}>
                      💡 Not receiving SMS?{'\n'}
                      {'\n'}
                      1. Check Supabase Dashboard → Logs → Auth Logs for OTP codes (for testing){'\n'}
                      2. Verify Twilio Message Service SID is configured in Supabase Dashboard → Authentication → Settings → Phone{'\n'}
                      3. For Twilio trial accounts, verify your phone number in Twilio Console → Phone Numbers → Verified Caller IDs{'\n'}
                      4. Check Twilio Console → Monitor → Logs for SMS delivery status{'\n'}
                      5. Try clicking "Resend Code" below
                    </Text>
                  </View>

                  <Input
                    label="Verification Code"
                    value={verificationCode}
                    onChangeText={(text) => {
                      // Only allow digits, max 6
                      const digits = text.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(digits);
                      setVerificationError('');
                    }}
                    placeholder="123456"
                    keyboardType="number-pad"
                    autoComplete="sms-otp"
                    maxLength={6}
                    error={verificationError}
                    containerStyle={{ marginTop: 16 }}
                  />

                  <Button
                    title={isVerifying ? 'Verifying...' : 'Verify Code'}
                    onPress={handleVerifyOTP}
                    disabled={isVerifying || verificationCode.trim().length !== 6}
                    style={styles.button}
                  />

                  <TouchableOpacity
                    onPress={handleResendOTP}
                    disabled={isVerifying}
                    style={styles.resendButton}
                  >
                    <Text style={[styles.resendText, { color: isDark ? '#0a84ff' : '#007aff' }]}>
                      Resend Code
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : null}

                  <Button
                    title={isLoading ? 'Signing Up...' : 'Sign Up'}
                    onPress={handleRegister}
                    disabled={isLoading || !isFormValid()}
                    style={styles.button}
                  />
                </>
              )}

              {!needsVerification && (
                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: textColor }]}>
                    Already have an account?{' '}
                  </Text>
                  <Text
                    style={[styles.link, { color: isDark ? '#0a84ff' : '#007aff' }]}
                    onPress={navigateToLogin}
                  >
                    Sign In
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  form: {
    width: '100%',
  },
  methodToggle: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  methodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  methodButtonActive: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  phoneNumberInput: {
    flex: 1,
  },
  verificationContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
