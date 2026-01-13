import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { detectInputType, getInputIcon, formatPhoneNumber, isValidEmail, isValidPhone } from '../lib/validation';

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetPhone, setResetPhone] = useState<string | null>(null);
  const { resetPassword, resetPasswordForPhone } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleIdentifierChange = (text: string) => {
    // Auto-format phone numbers
    const inputType = detectInputType(text);
    if (inputType === 'phone') {
      const formatted = formatPhoneNumber(text);
      setIdentifier(formatted);
    } else {
      setIdentifier(text);
    }
    setError('');
  };

  const handleResetPassword = async () => {
    if (!identifier.trim()) {
      setError('Please enter your email address or phone number');
      return;
    }

    const inputType = detectInputType(identifier);
    
    // Validate based on type
    if (inputType === 'email') {
      if (!isValidEmail(identifier.trim())) {
        setError('Please enter a valid email address');
        return;
      }
    } else if (inputType === 'phone') {
      if (!isValidPhone(identifier.trim())) {
        setError('Please enter a valid phone number with country code (e.g., +1 987-654-3210)');
        return;
      }
    } else {
      setError('Please enter a valid email address or phone number');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);
    setResetPhone(null);

    try {
      if (inputType === 'email') {
        // Email reset flow
        await resetPassword(identifier.trim());
        setSuccess(true);
      } else {
        // Phone reset flow - send OTP
        const cleanedPhone = identifier.replace(/[^\d+]/g, '');
        const phoneWithPlus = cleanedPhone.startsWith('+') ? cleanedPhone : '+' + cleanedPhone;
        await resetPasswordForPhone(phoneWithPlus);
        setResetPhone(phoneWithPlus);
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      const errorMessage = err.message || `Failed to send password reset ${inputType === 'email' ? 'email' : 'code'}. Please try again.`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  const navigateToOTPVerification = () => {
    if (resetPhone) {
      router.push({
        pathname: '/verify-otp-reset',
        params: { phone: resetPhone },
      });
    }
  };

  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const inputType = identifier ? detectInputType(identifier) : null;
  const inputIcon = identifier ? getInputIcon(identifier) : '';

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
            <Text style={[styles.title, { color: textColor }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              {success
                ? resetPhone
                  ? 'Check your phone for the verification code'
                  : 'Check your email for password reset instructions'
                : 'Enter your email address or phone number to reset your password'}
            </Text>

            {success ? (
              <View style={styles.successContainer}>
                <Text style={[styles.successText, { color: '#34c759' }]}>
                  {resetPhone ? '✓ Verification code sent!' : '✓ Password reset email sent!'}
                </Text>
                <Text style={[styles.successSubtext, { color: textColor }]}>
                  {resetPhone
                    ? 'Please check your SMS for the verification code.'
                    : 'Please check your inbox and follow the instructions to reset your password.'}
                </Text>
                {resetPhone ? (
                  <Button
                    title="Verify Code"
                    onPress={navigateToOTPVerification}
                    style={styles.button}
                  />
                ) : null}
                <Button
                  title="Back to Login"
                  onPress={navigateToLogin}
                  style={[styles.button, resetPhone ? styles.secondaryButton : null]}
                />
              </View>
            ) : (
              <View style={styles.form}>
                <View>
                  <Input
                    label={`Email or Phone${inputIcon ? ` ${inputIcon}` : ''}`}
                    value={identifier}
                    onChangeText={handleIdentifierChange}
                    placeholder={
                      inputType === 'email'
                        ? 'user@example.com'
                        : inputType === 'phone'
                        ? '+1 987-654-3210'
                        : 'Enter your email or phone'
                    }
                    autoCapitalize="none"
                    keyboardType={
                      inputType === 'email'
                        ? 'email-address'
                        : inputType === 'phone'
                        ? 'phone-pad'
                        : 'default'
                    }
                    autoComplete="username"
                    editable={!isLoading}
                  />
                  {identifier && inputType && (
                    <Text style={[styles.hint, { color: isDark ? '#8e8e93' : '#666' }]}>
                      {inputType === 'email' ? '📧 Email' : inputType === 'phone' ? '📱 Phone' : '👤 Username'}
                    </Text>
                  )}
                </View>

                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}

                <Button
                  title={inputType === 'phone' ? 'Send Verification Code' : 'Send Reset Link'}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  style={styles.button}
                />

                <View style={styles.footer}>
                  <Text
                    style={[styles.link, { color: isDark ? '#0a84ff' : '#007aff' }]}
                    onPress={navigateToLogin}
                  >
                    Back to Login
                  </Text>
                </View>
              </View>
            )}
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
  successContainer: {
    width: '100%',
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  secondaryButton: {
    marginTop: 8,
  },
});

