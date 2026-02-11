import { Tabs, useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, TouchableOpacity, Text, Alert, Platform, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signOut, user, session } = useAuth();
  const router = useRouter();

  // Redirect to login if session is lost
  useEffect(() => {
    if (!session && !user) {
      router.replace('/login');
    }
  }, [session, user, router]);

  const handleLogout = async () => {
    console.log('🔴 LOGOUT BUTTON CLICKED - handleLogout called');

    // On web, use direct logout without alert
    if (Platform.OS === 'web') {
      console.log('Web detected - performing direct logout');
      try {
        console.log('Calling signOut...');
        await signOut();
        console.log('SignOut completed, redirecting...');
        router.replace('/login');
      } catch (error) {
        console.error('Logout error:', error);
        router.replace('/login');
      }
      return;
    }

    // Mobile: Use Alert
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Logout cancelled'),
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔴 Alert confirmed - Starting signout...');
              await signOut();
              console.log('🔴 Signout successful, redirecting...');

              // Force navigation
              router.replace('/login');
            } catch (error) {
              console.error('🔴 Sign out error:', error);
              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  // If no session, redirect to login
  if (!session && !user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? Colors.dark.tint : Colors.light.tint,
        tabBarInactiveTintColor: isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault,
        tabBarStyle: {
          backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
        },
        headerStyle: {
          backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
        },
        headerTintColor: isDark ? Colors.dark.text : Colors.light.text,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* GO PRO button hidden for initial deployment */}
            {/* 
            <TouchableOpacity
              onPress={() => router.push('/subscribe')}
              style={{
                marginRight: 8,
                backgroundColor: '#D4AF37',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12
              }}
            >
              <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>GO PRO</Text>
            </TouchableOpacity>
            */}
            <TouchableOpacity
              onPress={() => {
                console.log('🔴 LOGOUT ICON PRESSED');
                handleLogout();
              }}
              onPressIn={() => console.log('🔴 LOGOUT BUTTON PRESS IN')}
              style={{ marginRight: 16, padding: 8 }}
              accessibilityLabel="Sign Out"
              testID="logout-button"
            >
              <Ionicons
                name="log-out-outline"
                size={24}
                color={isDark ? Colors.dark.text : Colors.light.text}
              />
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: 'Session',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: 'Summary',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: 'Review',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
