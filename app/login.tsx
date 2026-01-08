import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { detectInputType, getInputIcon, formatPhoneNumber } from '../lib/validation';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
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

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting login with identifier:', identifier.trim());
      await signIn(identifier.trim(), password);
      console.log('Login successful, redirecting to tabs...');
      // Clear form
      setIdentifier('');
      setPassword('');
      // Navigate to tabs
      router.replace('/tabs');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Failed to login. Please check your credentials.';
      setError(errorMessage);
      console.error('Login error details:', {
        message: errorMessage,
        code: err.code,
        status: err.status,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/register');
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
            <Text style={[styles.title, { color: textColor }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              Sign in to continue
            </Text>

            <View style={styles.form}>
              <View>
                <Input
                  label={`Email, Phone, or Username${inputIcon ? ` ${inputIcon}` : ''}`}
                  value={identifier}
                  onChangeText={handleIdentifierChange}
                  placeholder={
                    inputType === 'email'
                      ? 'user@example.com'
                      : inputType === 'phone'
                      ? '+1 987-654-3210'
                      : 'Enter your username'
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
                />
                {identifier && inputType && (
                  <Text style={[styles.hint, { color: isDark ? '#8e8e93' : '#666' }]}>
                    {inputType === 'email' ? '📧 Email' : inputType === 'phone' ? '📱 Phone' : '👤 Username'}
                  </Text>
                )}
              </View>

              <Input
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
              />

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              <Button
                title="Sign In"
                onPress={handleLogin}
                disabled={isLoading}
                style={styles.button}
              />

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: textColor }]}>
                  Don't have an account?{' '}
                </Text>
                <Text
                  style={[styles.link, { color: isDark ? '#0a84ff' : '#007aff' }]}
                  onPress={navigateToRegister}
                >
                  Sign Up
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
  hint: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
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
});
