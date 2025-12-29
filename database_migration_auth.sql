-- Authentication and User Profiles Migration
-- Run this script in your Supabase SQL editor to create user profiles table

-- Create profiles table to store user metadata including username
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for username lookup
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Create updated_at trigger for profiles (drop if exists first)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username VARCHAR(255);
BEGIN
  -- Extract username from metadata, or generate one
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    CASE 
      WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1)
      WHEN NEW.phone IS NOT NULL THEN 'user_' || substr(NEW.phone, -8)
      ELSE 'user_' || substr(NEW.id::text, 1, 8)
    END
  );
  
  -- Insert profile with conflict handling
  INSERT INTO public.profiles (id, username, email, phone)
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE SET
    username = COALESCE(EXCLUDED.username, profiles.username),
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to lookup user identifier by username (for login)
-- This function is secure and only returns email/phone for authentication
CREATE OR REPLACE FUNCTION public.get_user_identifier_by_username(username_param VARCHAR)
RETURNS TABLE(email VARCHAR, phone VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT p.email, p.phone
  FROM public.profiles p
  WHERE p.username = username_param
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anonymous access to the lookup function
GRANT EXECUTE ON FUNCTION public.get_user_identifier_by_username TO anon, authenticated;

-- Function to create or update profile (for use during signup)
-- This function bypasses RLS using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_username VARCHAR,
  p_email VARCHAR DEFAULT NULL,
  p_phone VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, phone)
  VALUES (p_user_id, p_username, p_email, p_phone)
  ON CONFLICT (id) DO UPDATE SET
    username = COALESCE(EXCLUDED.username, profiles.username),
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated, anon;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

