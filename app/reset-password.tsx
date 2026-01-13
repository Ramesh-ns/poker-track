import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import * as Linking from 'expo-linking';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const { updatePassword } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();

  // Handle deep link parameters and validate token
  useEffect(() => {
    // If coming from phone OTP verification, skip deep link validation
    if (params.fromPhone === 'true') {
      setIsValidatingToken(false);
      return;
    }

    const handleDeepLink = async () => {
      try {
        // Get the initial URL (when app opens from deep link)
        const initialUrl = await Linking.getInitialURL();
        
        // Also listen for URL events (when app is already open)
        const subscription = Linking.addEventListener('url', handleUrl);
        
        if (initialUrl) {
          await processResetUrl(initialUrl);
        } else {
          // If no deep link, check if user can still reset (maybe they navigated directly)
          // Allow manual password reset if they have a valid session
          setIsValidatingToken(false);
        }
        
        return () => {
          subscription.remove();
        };
      } catch (err) {
        console.error('Error handling deep link:', err);
        setIsValidatingToken(false);
      }
    };

    const handleUrl = async (event: { url: string }) => {
      await processResetUrl(event.url);
    };

    const processResetUrl = async (url: string) => {
      try {
        console.log('Processing reset password URL:', url);
        
        // Parse the URL - Supabase sends tokens in hash fragments
        const parsed = Linking.parse(url);
        
        // Extract token from hash or query params
        // Format: pokertrack://reset-password#access_token=xxx&type=recovery
        // Or: https://yourdomain.com/reset-password#access_token=xxx&type=recovery
        const hash = parsed.hash || '';
        const queryParams = parsed.queryParams || {};
        
        // Also check if hash was passed as a param (from index.tsx handler)
        const hashParam = params.hash as string | undefined;
        const fullHash = hashParam || hash;
        
        // Check if this is a password reset link
        if (fullHash.includes('type=recovery') || fullHash.includes('access_token') || 
            queryParams.type === 'recovery' || queryParams.access_token) {
          // Supabase will automatically handle the token when updatePassword is called
          // We just need to ensure the user is on this screen
          console.log('✅ Valid password reset link detected');
          setIsValidatingToken(false);
        } else {
          // Not a valid reset link, but allow manual reset if user has session
          console.log('⚠️ No reset token found, checking for session...');
          setIsValidatingToken(false);
        }
      } catch (err) {
        console.error('Error processing reset URL:', err);
        setError('Error processing reset link. Please try again.');
        setIsValidatingToken(false);
      }
    };

    handleDeepLink();
  }, []);

  const handleResetPassword = async () => {
    // Validation
    if (!password.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await updatePassword(password);
      setSuccess(true);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Password update error:', err);
      const errorMessage = err.message || 'Failed to update password. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.replace('/login');
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
            <Text style={[styles.title, { color: textColor }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              {success
                ? 'Password updated successfully! Redirecting to login...'
                : isValidatingToken
                ? 'Validating reset link...'
                : 'Enter your new password'}
            </Text>

            {isValidatingToken ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: textColor }]}>
                  Please wait...
                </Text>
              </View>
            ) : success ? (
              <View style={styles.successContainer}>
                <Text style={[styles.successText, { color: '#34c759' }]}>
                  ✓ Password updated successfully!
                </Text>
                <Button
                  title="Go to Login"
                  onPress={navigateToLogin}
                  style={styles.button}
                />
              </View>
            ) : (
              <View style={styles.form}>
                <Input
                  label="New Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  placeholder="Enter your new password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  editable={!isLoading}
                />

                <Input
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError('');
                  }}
                  placeholder="Confirm your new password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  editable={!isLoading}
                />

                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}

                <Button
                  title="Update Password"
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
    marginBottom: 24,
    textAlign: 'center',
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
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
});

