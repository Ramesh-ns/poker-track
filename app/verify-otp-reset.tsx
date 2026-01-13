import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import * as authApi from '../lib/auth';

export default function VerifyOTPResetScreen() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState<string>('');
  const { verifyPhoneOTPForPasswordReset } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();

  useEffect(() => {
    // Get phone from params
    if (params.phone && typeof params.phone === 'string') {
      setPhone(params.phone);
    }
  }, [params]);

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (otp.trim().length < 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    if (!phone) {
      setError('Phone number is missing. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Verify OTP - this will create a session if valid
      await verifyPhoneOTPForPasswordReset(phone, otp.trim());
      
      // After successful verification, navigate to reset password screen
      router.replace({
        pathname: '/reset-password',
        params: { fromPhone: 'true' },
      });
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const errorMessage = err.message || 'Failed to verify code. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!phone) {
      setError('Phone number is missing. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authApi.resendPhoneOTP(phone);
      setError('');
      // Show success message (you could add a success state here)
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      const errorMessage = err.message || 'Failed to resend code. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateBack = () => {
    router.back();
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
            <Text style={[styles.title, { color: textColor }]}>Verify Code</Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              Enter the 6-digit code sent to {phone ? phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d+)/, '$1 ($2) $3-$4') : 'your phone'}
            </Text>

            <View style={styles.form}>
              <Input
                label="Verification Code"
                value={otp}
                onChangeText={(text) => {
                  // Only allow digits, max 6
                  const digits = text.replace(/\D/g, '').slice(0, 6);
                  setOtp(digits);
                  setError('');
                }}
                placeholder="000000"
                keyboardType="number-pad"
                autoComplete="sms-otp"
                maxLength={6}
                editable={!isLoading}
                style={styles.otpInput}
              />

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              <Button
                title="Verify Code"
                onPress={handleVerifyOTP}
                disabled={isLoading || otp.length < 6}
                style={styles.button}
              />

              <View style={styles.resendContainer}>
                <Text style={[styles.resendText, { color: textColor }]}>
                  Didn't receive the code?{' '}
                </Text>
                <Text
                  style={[styles.resendLink, { color: isDark ? '#0a84ff' : '#007aff' }]}
                  onPress={handleResendOTP}
                >
                  Resend
                </Text>
              </View>

              <View style={styles.footer}>
                <Text
                  style={[styles.link, { color: isDark ? '#0a84ff' : '#007aff' }]}
                  onPress={navigateBack}
                >
                  Back
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
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '600',
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
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
});

