import { Redirect, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { useEffect } from 'react';

export default function Index() {
  const { session, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

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