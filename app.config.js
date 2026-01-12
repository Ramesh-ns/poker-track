// app.config.js - Dynamic configuration with environment variables
// This file replaces app.json and allows reading from .env files

// Load environment variables - try .env.local first, then .env
const path = require('path');
const dotenv = require('dotenv');

// Load .env file (this is the standard file that works with Expo)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Also try .env.local (for local overrides, higher priority)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Debug: Log loaded variables (only in development, and only if they exist)
if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 Environment variables check:');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing');
}

module.exports = {
  expo: {
    name: 'Poker Track',
    slug: 'poker-track',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'pokertrack',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.pokertrack.app',
      buildNumber: '1',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    // Extra configuration accessible via Constants.expoConfig.extra
    extra: {
      // Supabase configuration from environment variables
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      // Environment indicator
      environment: process.env.NODE_ENV || 'development',
      // EAS project linking
      eas: {
        projectId: 'fc300c6b-bce1-462a-b07b-3f63c777bb43',
      },
    },
  },
};

