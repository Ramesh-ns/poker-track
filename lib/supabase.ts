import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get Supabase credentials from environment variables or app config
// Priority: 1) Constants.expoConfig.extra (from app.config.js), 2) process.env (from .env files)
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  '';

// Debug logging (only in development)
if (__DEV__) {
  console.log('🔍 Supabase Config Check:');
  console.log('From Constants.expoConfig.extra.supabaseUrl:', Constants.expoConfig?.extra?.supabaseUrl ? '✅' : '❌');
  console.log('From process.env.EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅' : '❌');
  console.log('Final supabaseUrl:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('Final supabaseAnonKey:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
}

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 
    'Missing Supabase environment variables.\n\n' +
    'Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY:\n' +
    '1. Create a .env.local file in the project root\n' +
    '2. Add: EXPO_PUBLIC_SUPABASE_URL=your-url\n' +
    '3. Add: EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key\n' +
    '4. Restart the Expo dev server with: expo start -c\n\n' +
    'Current values:\n' +
    `  EXPO_PUBLIC_SUPABASE_URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL || 'undefined'}\n` +
    `  Constants.extra.supabaseUrl: ${Constants.expoConfig?.extra?.supabaseUrl || 'undefined'}\n` +
    `  EXPO_PUBLIC_SUPABASE_ANON_KEY: ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '***' : 'undefined'}\n` +
    `  Constants.extra.supabaseAnonKey: ${Constants.expoConfig?.extra?.supabaseAnonKey ? '***' : 'undefined'}\n\n` +
    'For production builds, use EAS secrets or app.config.js';
  
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

