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

export default function RegisterScreen() {
  const [registrationMethod, setRegistrationMethod] = useState<'email' | 'phone'>('email');
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
      const phoneDigits = emailOrPhone.replace(/\D/g, '');
      const fullPhone = selectedCountry.dialCode + phoneDigits;
      if (!isValidPhone(fullPhone)) {
        setEmailOrPhoneError('Mobile number format is not correct');
      } else {
        // Check if phone exists (using full phone with country code)
        try {
          const exists = await authApi.checkPhoneExists(fullPhone);
          if (exists) {
            setEmailOrPhoneError('Mobile number already exists');
          } else {
            setEmailOrPhoneError('');
          }
        } catch (err) {
          setEmailOrPhoneError('');
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
      
      await signUp(cleanedEmailOrPhone, password, username.trim(), registrationMethod === 'phone');
      
      console.log('Registration successful');
      
      // Success - clear form
      setEmailOrPhone('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setError('');
      
      // Redirect to login page immediately (no popup/alert)
      router.replace('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        status: err.status,
      });
      
      const errorMessage = err.message || err.error?.message || 'Failed to register. Please try again.';
      setError(errorMessage);
      
      // Set specific field errors if available
      const lowerMessage = errorMessage.toLowerCase();
      if (lowerMessage.includes('email already exists') || lowerMessage.includes('user already registered')) {
        setEmailOrPhoneError('Email already exists');
      } else if (lowerMessage.includes('mobile number already exists') || lowerMessage.includes('phone')) {
        setEmailOrPhoneError('Mobile number already exists');
      } else if (lowerMessage.includes('username already exists')) {
        setUsernameError('Username already exists');
      } else if (lowerMessage.includes('invalid email')) {
        setEmailOrPhoneError('Invalid email format');
      } else if (lowerMessage.includes('invalid phone')) {
        setEmailOrPhoneError('Invalid phone number format');
      }
    } finally {
      setIsLoading(false);
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

              {registrationMethod === 'phone' ? (
                <View>
                  <Text style={[styles.label, { color: textColor }]}>Mobile Number</Text>
                  <View style={styles.phoneInputContainer}>
                    <CountryCodePicker
                      selectedCountry={selectedCountry}
                      onSelect={(country) => {
                        setSelectedCountry(country);
                        // Keep phone number as is, just update country code
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
                  {emailOrPhoneError ? (
                    <Text style={[styles.errorText, { color: isDark ? '#ff453a' : '#ff3b30' }]}>
                      {emailOrPhoneError}
                    </Text>
                  ) : null}
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
                placeholder="pokerKing99"
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

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              <Button
                title={isLoading ? 'Signing Up...' : 'Sign Up'}
                onPress={handleRegister}
                disabled={isLoading || !isFormValid()}
                style={styles.button}
              />

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
});
