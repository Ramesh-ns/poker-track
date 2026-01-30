import { supabase } from './supabase';

// Feature flag: Set to true to enable OTP verification for phone signups
// Set to false to skip OTP verification and auto-confirm phone signups
// NOTE: When set to false, you may also need to disable "Require phone verification" 
// in Supabase Dashboard → Authentication → Settings → Phone Auth
const ENABLE_PHONE_OTP_VERIFICATION = false;

// Helper to check if string is email or phone
function isEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function isPhone(str: string): boolean {
  // Remove all non-digit characters
  const digits = str.replace(/\D/g, '');
  // Check if it's a valid phone number (10-15 digits)
  return digits.length >= 10 && digits.length <= 15;
}

// Check if email exists
export async function checkEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email.trim())
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    throw error;
  }

  return !!data;
}

// Check if phone exists
export async function checkPhoneExists(phone: string): Promise<boolean> {
  // Remove formatting for comparison - ensure it starts with +
  let cleanedPhone = phone.replace(/[^\d+]/g, '');

  // Ensure phone starts with +
  if (!cleanedPhone.startsWith('+')) {
    cleanedPhone = '+' + cleanedPhone;
  }

  console.log('🔍 Checking if phone exists:', cleanedPhone);

  // Check in profiles table - try exact match first
  const { data: exactMatch, error: exactError } = await supabase
    .from('profiles')
    .select('phone')
    .eq('phone', cleanedPhone)
    .maybeSingle();

  if (exactMatch) {
    console.log('✅ Phone found in profiles (exact match)');
    return true;
  }

  // If not found, try to find any phone that matches when cleaned
  // This handles cases where phone might be stored with different formatting
  const { data: allProfiles, error: allError } = await supabase
    .from('profiles')
    .select('phone')
    .not('phone', 'is', null);

  if (!allError && allProfiles) {
    const matchingPhone = allProfiles.find(profile => {
      if (!profile.phone) return false;
      const profilePhoneCleaned = profile.phone.replace(/[^\d+]/g, '');
      const profilePhoneNormalized = profilePhoneCleaned.startsWith('+')
        ? profilePhoneCleaned
        : '+' + profilePhoneCleaned;
      return profilePhoneNormalized === cleanedPhone;
    });

    if (matchingPhone) {
      console.log('✅ Phone found in profiles (normalized match):', matchingPhone.phone);
      return true;
    }
  }

  console.log('❌ Phone not found in profiles');
  return false;
}

// Check if username exists
export async function checkUsernameExists(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username.trim())
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    throw error;
  }

  return !!data;
}

// Helper function to convert database errors to user-friendly messages
function getFriendlyErrorMessage(error: any, username?: string, emailOrPhone?: string, isPhoneNumber?: boolean): string {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';
  const errorDetails = error?.details || '';

  // Check Supabase auth errors first
  if (errorCode === 'signup_disabled' || errorMessage.includes('signup_disabled')) {
    return 'Registration is currently disabled. Please contact support.';
  }

  // Check for Twilio/SMS provider errors
  // Error code 'sms_send_failed' indicates Twilio/SMS provider issue
  if (errorCode === 'sms_send_failed' ||
    errorMessage.includes('Twilio') ||
    errorMessage.includes('twilio') ||
    errorMessage.includes('60200') ||
    errorMessage.includes('Error sending confirmation OTP to provider')) {

    if (errorMessage.includes('Invalid parameter') || errorMessage.includes('60200')) {
      return 'Twilio configuration error: Invalid parameter. Please verify: 1) Twilio Message Service SID is correctly entered in Supabase Dashboard (Authentication → Settings → Phone → Message Service SID), 2) For Twilio trial accounts, verify your phone number in Twilio Console (Phone Numbers → Verified Caller IDs), 3) Ensure your Twilio credentials (Account SID, Auth Token, Message Service SID) are correct.';
    }
    if (errorMessage.includes('unverified') || errorMessage.includes('not verified')) {
      return 'Phone number not verified in Twilio. For Twilio trial accounts, you must verify your phone number in Twilio Console first (Phone Numbers → Verified Caller IDs).';
    }
    if (errorMessage.includes('Message Service') || errorMessage.includes('message service')) {
      return 'Twilio Message Service SID error. Please verify the Message Service SID is correctly configured in Supabase Dashboard (Authentication → Settings → Phone → Message Service SID). It should start with "MG".';
    }
    return 'SMS sending failed. Please check your Twilio configuration in Supabase Dashboard (Authentication → Settings → Phone). Verify: 1) Twilio Account SID, 2) Twilio Auth Token, 3) Twilio Message Service SID (starts with "MG"). For trial accounts, also verify your phone number in Twilio Console.';
  }

  // Check for phone signups disabled
  if (errorMessage.includes('Phone signups are disabled') ||
    errorMessage.includes('phone signups disabled') ||
    errorCode === 'phone_signups_disabled') {
    if (isPhoneNumber) {
      return 'Phone number registration is currently disabled. Please use email to register.';
    }
    return 'Registration is currently disabled. Please contact support.';
  }

  if (errorCode === 'user_already_registered' || errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
    if (isPhoneNumber) {
      return 'Mobile number already exists. Please use a different number or sign in.';
    }
    return 'Email already exists. Please use a different email or sign in.';
  }

  // Check for unique constraint violations (PostgreSQL error code 23505)
  if (errorMessage.includes('unique') || errorMessage.includes('duplicate') || errorCode === '23505') {
    if (errorMessage.includes('username') || errorDetails.includes('username') || errorDetails.includes('idx_profiles_username')) {
      return 'Username already exists. Please choose another username.';
    }
    if (errorMessage.includes('email') || errorDetails.includes('email') || errorDetails.includes('idx_profiles_email')) {
      return 'Email already exists. Please use a different email or sign in.';
    }
    if (errorMessage.includes('phone') || errorDetails.includes('phone') || errorDetails.includes('idx_profiles_phone')) {
      return 'Mobile number already exists. Please use a different number or sign in.';
    }
    // Generic unique constraint error - check context
    if (username) {
      return 'Username already exists. Please choose another username.';
    }
    if (isPhoneNumber) {
      return 'Mobile number already exists. Please use a different number or sign in.';
    }
    return 'Email already exists. Please use a different email or sign in.';
  }

  // Check for foreign key constraint violations (PostgreSQL error code 23503)
  if (errorMessage.includes('foreign key') || errorMessage.includes('profiles_id_fkey') || errorCode === '23503') {
    // This usually means the user already exists but profile creation failed
    // Or the user_id doesn't match - which shouldn't happen, but if it does, show friendly message
    if (username) {
      return 'Username already exists. Please choose another username.';
    }
    if (isPhoneNumber) {
      return 'Mobile number already exists. Please use a different number or sign in.';
    }
    return 'Email already exists. Please use a different email or sign in.';
  }

  // Check for not null constraint violations (PostgreSQL error code 23502)
  if (errorMessage.includes('not null') || errorCode === '23502') {
    if (errorMessage.includes('username')) {
      return 'Username is required.';
    }
    return 'Please fill in all required fields.';
  }

  // Check for check constraint violations (PostgreSQL error code 23514)
  if (errorCode === '23514') {
    return 'Invalid data provided. Please check your input and try again.';
  }

  // Return the original error if we can't parse it, but make it more user-friendly
  if (errorMessage.includes('User already registered') || errorMessage.includes('already exists')) {
    if (isPhoneNumber) {
      return 'Mobile number already exists. Please use a different number or sign in.';
    }
    return 'Email already exists. Please use a different email or sign in.';
  }

  // Default: return a generic but friendly error
  return errorMessage || 'Registration failed. Please try again.';
}

// Sign up with email or phone
export async function signUp(
  emailOrPhone: string,
  password: string,
  username?: string,
  isPhoneNumber = false
) {
  console.log('🚀 Starting signup process...', {
    emailOrPhone: emailOrPhone.substring(0, 10) + '...',
    username,
    isPhoneNumber,
  });

  if (!username || !username.trim()) {
    throw new Error('Username is required');
  }

  // Check if username already exists
  const usernameExists = await checkUsernameExists(username.trim());
  if (usernameExists) {
    throw new Error('Username already exists. Please choose another one.');
  }

  // Check if email/phone already exists
  if (isPhoneNumber || isPhone(emailOrPhone)) {
    const phoneExists = await checkPhoneExists(emailOrPhone.trim());
    if (phoneExists) {
      throw new Error('Mobile number already exists. Please use a different number or sign in.');
    }
  } else {
    const emailExists = await checkEmailExists(emailOrPhone.trim());
    if (emailExists) {
      throw new Error('Email already exists. Please use a different email or sign in.');
    }
  }

  if (isPhoneNumber || isPhone(emailOrPhone)) {
    // Sign up with phone - ensure proper format
    let cleanedPhone = emailOrPhone.replace(/[^\d+]/g, '');

    // Ensure phone starts with +
    if (!cleanedPhone.startsWith('+')) {
      cleanedPhone = '+' + cleanedPhone;
    }

    // Validate phone number format before sending to Supabase/Twilio
    // E.164 format: +[country code][number] (10-15 digits total after +)
    const phoneDigits = cleanedPhone.replace(/[^\d]/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      throw new Error('Invalid phone number format. Phone number must be between 10-15 digits (including country code). Example: +19876543210 or +919876543210');
    }

    // Log with explicit console.log to ensure visibility
    console.log('========================================');
    console.log('📱 ATTEMPTING PHONE SIGNUP');
    console.log('========================================');
    console.log('Phone number (E.164):', cleanedPhone);
    console.log('Phone digits count:', phoneDigits.length);
    console.log('Username:', username.trim());
    console.log('========================================');

    const { data, error } = await supabase.auth.signUp({
      phone: cleanedPhone,
      password,
      options: {
        data: {
          username: username.trim(),
        },
        emailRedirectTo: undefined, // Disable email confirmation
      },
    });

    if (error) {
      console.log('========================================');
      console.log('❌ SUPABASE SIGNUP ERROR');
      console.log('========================================');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Full error:', JSON.stringify(error, null, 2));
      console.log('========================================');

      // Check specifically for phone signups disabled
      const errorMsg = error.message || '';
      const errorCode = error.code || '';

      if (errorMsg.includes('Phone signups are disabled') ||
        errorMsg.includes('phone signups disabled') ||
        errorMsg.includes('signups are disabled') ||
        errorCode === 'phone_signups_disabled' ||
        errorCode === 'signup_disabled') {
        console.log('🚫 Phone signups are disabled in Supabase');
        throw new Error('Phone signups are disabled. Please enable phone signups in Supabase Dashboard (Authentication → Settings → Phone) or use email to register.');
      }

      // Check for SMS/Twilio errors specifically
      if (errorCode === 'sms_send_failed' || errorMsg.includes('Error sending confirmation OTP')) {
        console.log('📱 SMS sending failed - likely Twilio configuration issue');
        console.log('💡 Troubleshooting steps:');
        console.log('   1. Verify Twilio Message Service SID in Supabase Dashboard');
        console.log('   2. For trial accounts, verify phone number in Twilio Console');
        console.log('   3. Check Twilio Account SID and Auth Token are correct');
      }

      // Convert auth errors to user-friendly messages
      const friendlyMessage = getFriendlyErrorMessage(error, username, cleanedPhone, true);
      throw new Error(friendlyMessage);
    }

    console.log('✅ Phone signup successful, user created:', data.user?.id);
    console.log('Session exists:', !!data.session);
    console.log('User needs verification:', !data.session);
    console.log('Full signup response:', JSON.stringify(data, null, 2));

    // If OTP verification is enabled and no session, user needs to verify OTP
    if (ENABLE_PHONE_OTP_VERIFICATION && !data.session && data.user) {
      console.log('📱 User needs phone verification - OTP should be sent to phone');
      console.log('⚠️ TROUBLESHOOTING: If you don\'t receive SMS:');
      console.log('   1. Check Supabase Dashboard → Logs → Auth Logs (OTP codes may appear in logs for testing)');
      console.log('   2. Verify Twilio Message Service SID in Supabase Dashboard → Authentication → Settings → Phone');
      console.log('   3. For Twilio trial accounts, verify phone number in Twilio Console → Phone Numbers → Verified Caller IDs');
      console.log('   4. Check Twilio Console → Monitor → Logs for SMS delivery status');
      console.log('   5. Verify phone number format is correct:', cleanedPhone);

      // Check if we can get more info about the SMS send
      if (data.user.confirmation_sent_at) {
        console.log('✅ Confirmation sent at:', data.user.confirmation_sent_at);
        console.log('💡 This means Supabase attempted to send SMS. Check Supabase/Twilio logs for delivery status.');
      }

      // Return data with a flag indicating verification is needed
      return { ...data, needsVerification: true, phone: cleanedPhone };
    }

    // If OTP verification is disabled and no session, try to auto-sign in
    if (!ENABLE_PHONE_OTP_VERIFICATION && !data.session && data.user) {
      console.log('📱 OTP verification disabled - attempting auto-sign in');
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          phone: cleanedPhone,
          password,
        });
        if (!signInError && signInData) {
          console.log('✅ Auto-signed in after phone signup');
          // Update the data to include session
          data.session = signInData.session;
          data.user = signInData.user;
        } else {
          console.log('⚠️ Could not auto-sign in, but user was created');
        }
      } catch (e) {
        console.log('⚠️ Could not auto-sign in after phone signup:', e);
      }
    }

    // Create profile immediately using RPC function (bypasses RLS)
    if (data.user) {
      console.log('Creating profile for user:', data.user.id);
      const { error: profileError } = await supabase.rpc('create_user_profile', {
        p_user_id: data.user.id,
        p_username: username.trim(),
        p_phone: cleanedPhone,
        p_email: null,
      });

      if (profileError) {
        console.error('❌ Failed to create profile:', profileError);
        // Convert profile errors to user-friendly messages
        const friendlyMessage = getFriendlyErrorMessage(profileError, username, cleanedPhone, true);
        throw new Error(friendlyMessage);
      }

      console.log('✅ Profile created successfully');
    } else {
      throw new Error('User was not created. Please try again.');
    }

    return data;
  } else {
    // Sign up with email - disable email confirmation
    console.log('📧 Signing up with email:', emailOrPhone);
    const { data, error } = await supabase.auth.signUp({
      email: emailOrPhone,
      password,
      options: {
        data: {
          username: username.trim(),
        },
        emailRedirectTo: undefined, // Disable email confirmation redirect
        // Auto-confirm email (requires Supabase settings to allow this)
      },
    });

    // If user was created but email needs confirmation, auto-confirm it
    if (data.user && !data.session) {
      // Try to sign in immediately to auto-confirm
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailOrPhone,
          password,
        });
        if (!signInError && signInData) {
          console.log('Auto-confirmed email and signed in');
          // Update the data to include session
          data.session = signInData.session;
          data.user = signInData.user;
        }
      } catch (e) {
        console.log('Could not auto-confirm email, user will need to confirm manually');
      }
    }

    if (error) {
      console.error('❌ Supabase signup error:', error);
      // Convert auth errors to user-friendly messages
      const friendlyMessage = getFriendlyErrorMessage(error, username, emailOrPhone, false);
      throw new Error(friendlyMessage);
    }

    // Create profile immediately using RPC function (bypasses RLS)
    if (data.user) {
      console.log('Creating profile for user:', data.user.id);
      const { error: profileError } = await supabase.rpc('create_user_profile', {
        p_user_id: data.user.id,
        p_username: username.trim(),
        p_email: emailOrPhone,
        p_phone: null,
      });

      if (profileError) {
        console.error('❌ Failed to create profile:', profileError);
        // Convert profile errors to user-friendly messages
        const friendlyMessage = getFriendlyErrorMessage(profileError, username, emailOrPhone, false);
        throw new Error(friendlyMessage);
      }

      console.log('✅ Profile created successfully');
    } else {
      throw new Error('User was not created. Please try again.');
    }

    return data;
  }
}

// Helper function to convert login errors to user-friendly messages
function getFriendlyLoginErrorMessage(error: any): string {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';

  // Phone not confirmed
  if (errorMessage.includes('Phone not confirmed') ||
    errorMessage.includes('phone not confirmed') ||
    errorCode === 'phone_not_confirmed') {
    return 'Please verify your phone number before signing in. Check your SMS for a verification code.';
  }

  // Email not confirmed
  if (errorMessage.includes('Email not confirmed') || errorCode === 'email_not_confirmed') {
    return 'Please confirm your email address before signing in. Check your inbox for a confirmation email.';
  }

  // Invalid credentials
  if (errorMessage.includes('Invalid login credentials') ||
    errorMessage.includes('Invalid credentials') ||
    errorCode === 'invalid_credentials' ||
    errorCode === 'invalid_grant') {
    return 'Invalid credentials. Please check your username, email, or phone number and password.';
  }

  // User not found
  if (errorMessage.includes('User not found') || errorCode === 'user_not_found') {
    return 'User not found. Please check your username, email, or phone number.';
  }

  // Too many requests
  if (errorMessage.includes('Too many requests') || errorCode === 'too_many_requests') {
    return 'Too many login attempts. Please try again later.';
  }

  // Return the original error if we can't parse it
  return errorMessage || 'Login failed. Please try again.';
}

// Sign in with email, phone, or username
export async function signIn(identifier: string, password: string) {
  // Clean identifier (remove formatting from phone)
  let cleanedIdentifier = identifier.trim();

  // First, check if it's an email (contains @)
  if (identifier.includes('@')) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanedIdentifier,
      password,
    });
    if (error) {
      const friendlyMessage = getFriendlyLoginErrorMessage(error);
      throw new Error(friendlyMessage);
    }
    return data;
  }

  // Check if it's a phone number (starts with + or is all digits)
  if (cleanedIdentifier.startsWith('+') || /^\d/.test(cleanedIdentifier)) {
    // Remove formatting for phone login
    cleanedIdentifier = cleanedIdentifier.replace(/[^\d+]/g, '');
    const { data, error } = await supabase.auth.signInWithPassword({
      phone: cleanedIdentifier,
      password,
    });
    if (error) {
      const friendlyMessage = getFriendlyLoginErrorMessage(error);
      throw new Error(friendlyMessage);
    }
    return data;
  }

  // If it's not email or phone, try to find user by username using database function
  try {
    const { data: profileData, error: profileError } = await supabase.rpc(
      'get_user_identifier_by_username',
      { username_param: identifier }
    );

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      throw new Error('Invalid credentials. Please check your username, email, or phone number and password.');
    }

    if (!profileData || profileData.length === 0) {
      throw new Error('Username not found. Please check your username and try again.');
    }

    const profile = profileData[0];
    let lastError: any = null;

    // Try to sign in with email first, then phone
    if (profile.email) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password,
        });
        if (!error && data) return data;
        lastError = error;
      } catch (e) {
        lastError = e;
        // Continue to try phone
      }
    }

    if (profile.phone) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          phone: profile.phone,
          password,
        });
        if (!error && data) return data;
        lastError = error;
      } catch (e) {
        lastError = e;
      }
    }

    // If both attempts failed, throw the last error
    if (lastError) {
      const friendlyMessage = getFriendlyLoginErrorMessage(lastError);
      throw new Error(friendlyMessage);
    }
  } catch (e: any) {
    // If it's already a friendly error, re-throw it
    if (e.message && !e.message.includes('Invalid credentials') && !e.message.includes('Username not found')) {
      throw e;
    }
    // Otherwise, throw generic error
    throw new Error('Invalid credentials. Please check your username, email, or phone number and password.');
  }

  throw new Error('Invalid credentials. Please check your username, email, or phone number and password.');
}

// Sign out
export async function signOut() {
  console.log('Signing out from Supabase...');

  // Clear any local storage first (for web)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Clear Supabase session from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      console.log('Cleared localStorage');
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
  }

  // Sign out from Supabase
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Supabase signout error:', error);
    // Don't throw - we want to clear state regardless
  } else {
    console.log('Supabase signout successful');
  }

  // Force clear session one more time
  await supabase.auth.signOut();
}

// Verify phone OTP code
export async function verifyPhoneOTP(phone: string, token: string) {
  // Clean phone number
  let cleanedPhone = phone.replace(/[^\d+]/g, '');
  if (!cleanedPhone.startsWith('+')) {
    cleanedPhone = '+' + cleanedPhone;
  }

  console.log('========================================');
  console.log('🔐 VERIFYING OTP');
  console.log('========================================');
  console.log('Phone:', cleanedPhone);
  console.log('OTP token:', token.trim());
  console.log('========================================');

  const { data, error } = await supabase.auth.verifyOtp({
    phone: cleanedPhone,
    token: token.trim(),
    type: 'sms',
  });

  if (error) {
    console.log('========================================');
    console.log('❌ OTP VERIFICATION ERROR');
    console.log('========================================');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('Full error:', JSON.stringify(error, null, 2));
    console.log('========================================');

    // Provide helpful error messages
    if (error.message?.includes('expired') || error.message?.includes('invalid')) {
      throw new Error('Invalid or expired verification code. Please request a new code.');
    }

    throw error;
  }

  console.log('✅ OTP verified successfully');
  console.log('Session created:', !!data.session);

  // After successful verification, create profile if it doesn't exist
  if (data.user) {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const username = data.user.user_metadata?.username || `user_${data.user.id.substring(0, 8)}`;
      console.log('Creating profile after OTP verification...');
      const { error: createError } = await supabase.rpc('create_user_profile', {
        p_user_id: data.user.id,
        p_username: username,
        p_phone: cleanedPhone,
        p_email: null,
      });

      if (createError) {
        console.error('❌ Failed to create profile after verification:', createError);
      } else {
        console.log('✅ Profile created after OTP verification');
      }
    }
  }

  return data;
}

// Resend OTP code
export async function resendPhoneOTP(phone: string) {
  // Clean phone number
  let cleanedPhone = phone.replace(/[^\d+]/g, '');
  if (!cleanedPhone.startsWith('+')) {
    cleanedPhone = '+' + cleanedPhone;
  }

  console.log('📤 Resending OTP to phone:', cleanedPhone);

  const { data, error } = await supabase.auth.resend({
    type: 'sms',
    phone: cleanedPhone,
  });

  if (error) {
    console.error('❌ Resend OTP error:', error);
    throw error;
  }

  console.log('✅ OTP resent successfully');
  return data;
}

// Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Reset password for email (triggers recovery email)
export async function resetPasswordForEmail(email: string) {
  console.log('📧 Requesting password reset for email:', email);

  // Validate email format
  if (!isEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }

  // For OTP-based flow, redirectTo might still be useful if they DO click the link,
  // but if they are entering a code manually, we just need to trigger the email.
  const redirectUrl =
    process.env.EXPO_PUBLIC_RESET_PASSWORD_URL ||
    process.env.EXPO_PUBLIC_APP_URL;

  console.log('🔗 Triggering recovery flow for:', email);

  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirectUrl || undefined,
  });

  if (error) {
    console.error('❌ Password reset error:', error);
    const friendlyMessage = getFriendlyErrorMessage(error, undefined, email, false);
    throw new Error(friendlyMessage);
  }

  console.log('✅ Password reset email triggered successfully');
  return data;
}

// Reset password for phone (sends OTP)
export async function resetPasswordForPhone(phone: string) {
  console.log('📱 Requesting password reset for phone:', phone);

  // Clean phone number
  let cleanedPhone = phone.replace(/[^\d+]/g, '');
  if (!cleanedPhone.startsWith('+')) {
    cleanedPhone = '+' + cleanedPhone;
  }

  // Validate phone format
  const phoneDigits = cleanedPhone.replace(/[^\d]/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    throw new Error('Invalid phone number format. Phone number must be between 10-15 digits (including country code).');
  }

  // Send OTP for password recovery
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: cleanedPhone,
    options: {
      shouldCreateUser: false, // Don't create user if doesn't exist
      channel: 'sms',
    },
  });

  if (error) {
    console.error('❌ Phone password reset error:', error);

    // Provide user-friendly error messages
    const friendlyMessage = getFriendlyErrorMessage(error, undefined, cleanedPhone, true);
    throw new Error(friendlyMessage);
  }

  console.log('✅ Password reset OTP sent successfully');
  return { ...data, phone: cleanedPhone };
}

// Verify phone OTP for password reset
export async function verifyPhoneOTPForPasswordReset(phone: string, token: string) {
  console.log('🔐 Verifying phone OTP for password reset...');

  // Clean phone number
  let cleanedPhone = phone.replace(/[^\d+]/g, '');
  if (!cleanedPhone.startsWith('+')) {
    cleanedPhone = '+' + cleanedPhone;
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone: cleanedPhone,
    token: token.trim(),
    type: 'sms',
  });

  if (error) {
    console.error('❌ Phone OTP verification error:', error);
    const friendlyMessage = getFriendlyErrorMessage(error, undefined, cleanedPhone, true);
    throw new Error(friendlyMessage);
  }

  console.log('✅ Phone OTP verified successfully');
  return data;
}

// Verify email OTP for password reset
export async function verifyEmailOTPForPasswordReset(email: string, token: string) {
  console.log('🔐 Verifying email OTP for password reset...');

  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'recovery',
  });

  if (error) {
    console.error('❌ Email OTP verification error:', error);
    const friendlyMessage = getFriendlyErrorMessage(error, undefined, email, false);
    throw new Error(friendlyMessage);
  }

  console.log('✅ Email OTP verified successfully');
  return data;
}

// Update password (used after clicking reset link or verifying OTP)
export async function updatePassword(newPassword: string) {
  console.log('🔐 Updating password...');

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('❌ Password update error:', error);

    if (error.message?.includes('expired') || error.message?.includes('invalid')) {
      throw new Error('Password reset link has expired. Please request a new one.');
    }

    if (error.message?.includes('session') || error.message?.includes('not authenticated')) {
      throw new Error('Your session has expired. Please request a new password reset.');
    }

    throw new Error(error.message || 'Failed to update password. Please try again.');
  }

  console.log('✅ Password updated successfully');
  return data;
}

