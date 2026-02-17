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
    'Supabase environment variables are missing. This will cause authentication and data features to fail.\n' +
    'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.';

  if (__DEV__) {
    throw new Error(errorMsg);
  } else {
    console.error('❌ CRITICAL ERROR:', errorMsg);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

