import { supabase } from './supabase';

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
  // Remove formatting for comparison
  const cleanedPhone = phone.replace(/[^\d+]/g, '');
  const { data, error } = await supabase
    .from('profiles')
    .select('phone')
    .eq('phone', cleanedPhone)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    throw error;
  }
  
  return !!data;
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
    // Sign up with phone - remove formatting for storage
    const cleanedPhone = emailOrPhone.replace(/[^\d+]/g, '');
    console.log('📱 Signing up with phone:', cleanedPhone);
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
      console.error('❌ Supabase signup error:', error);
      // Convert auth errors to user-friendly messages
      const friendlyMessage = getFriendlyErrorMessage(error, username, cleanedPhone, true);
      throw new Error(friendlyMessage);
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

// Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

