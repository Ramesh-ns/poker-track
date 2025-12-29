-- Run this in Supabase SQL Editor to verify your database setup

-- 1. Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) AS profiles_table_exists;

-- 2. Check if trigger exists
SELECT EXISTS (
  SELECT FROM information_schema.triggers 
  WHERE trigger_name = 'on_auth_user_created'
) AS trigger_exists;

-- 3. Check if RPC function exists
SELECT EXISTS (
  SELECT FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name = 'create_user_profile'
) AS rpc_function_exists;

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Test the RPC function (replace with a test UUID if needed)
-- This will show if the function can be called
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_user_profile';

-- 6. Check if function has proper permissions
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  CASE p.prosecdef 
    WHEN true THEN 'SECURITY DEFINER' 
    ELSE 'SECURITY INVOKER' 
  END AS security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_user_profile';

-- 7. List all users in auth.users (to see if users are being created)
SELECT id, email, phone, created_at, raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 8. List all profiles (to see if profiles are being created)
SELECT id, username, email, phone, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

