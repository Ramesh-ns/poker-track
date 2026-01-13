import { Redirect, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';

export default function Index() {
  const { session, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // Handle deep links for password reset
  useEffect(() => {
    const handleInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await processPasswordResetUrl(initialUrl);
          return; // Don't proceed with normal routing if we handled a reset URL
        }
      } catch (err) {
        console.error('Error getting initial URL:', err);
      }
    };

    // Listen for URL events (when app is already open)
    const subscription = Linking.addEventListener('url', (event) => {
      processPasswordResetUrl(event.url);
    });

    handleInitialUrl();

    return () => {
      subscription.remove();
    };
  }, []);

  const processPasswordResetUrl = async (url: string) => {
    try {
      console.log('🔗 Processing URL:', url);
      
      // Check if this is a password reset URL
      // Format: pokertrack://reset-password#access_token=...&type=recovery
      // Or: https://yourdomain.com/reset-password#access_token=...&type=recovery
      if (url.includes('reset-password') && (url.includes('access_token') || url.includes('type=recovery'))) {
        console.log('✅ Password reset URL detected, navigating to reset-password screen');
        // Extract hash fragment if present
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1) {
          const hash = url.substring(hashIndex + 1);
          // Navigate to reset password screen with the hash
          router.replace({
            pathname: '/reset-password',
            params: { hash },
          });
        } else {
          router.replace('/reset-password');
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error processing password reset URL:', err);
      return false;
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        router.replace('/tabs');
      } else {
        // Ensure we redirect to login when no session
        router.replace('/login');
      }
    }
  }, [session, isLoading]);

  // Also listen for navigation events to handle signout
  useEffect(() => {
    if (!isLoading && !session) {
      // Double check and redirect if needed
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [session, isLoading]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
        }}
      >
        <ActivityIndicator size="large" color={isDark ? Colors.dark.tint : Colors.light.tint} />
      </View>
    );
  }

  // Fallback redirects
  if (session) {
    return <Redirect href="/tabs" />;
  }

  return <Redirect href="/login" />;
} 