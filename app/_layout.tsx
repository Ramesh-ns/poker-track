import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { PokerProvider } from '../context/PokerContext';
import { AuthProvider, useAuth } from '../context/AuthContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <PokerProviderWrapper>
          <Stack>
            <Stack.Screen
              name="index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="login"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="register"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="tabs"
              options={{ headerShown: false }}
            />
          </Stack>
        </PokerProviderWrapper>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Wrapper component to force re-render when user changes (helps with browser caching)
function PokerProviderWrapper({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  return (
    <PokerProvider key={user?.id || 'no-user'}>
      {children}
    </PokerProvider>
  );
}

