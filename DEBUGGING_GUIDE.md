# Debugging Guide for Profile and Logout Issues

## Issue 1: Profiles Not Being Created

### Debugging Steps

1. **Check Browser Console During Registration**:
   - Open browser DevTools (F12) or check React Native debugger
   - Look for these log messages:
     - "Attempting registration with:"
     - "Profile does not exist, creating now..."
     - "Attempting RPC function..."
     - "✅ Profile created via RPC function" OR error messages
     - "✅ Profile verified successfully"

2. **Check Database Function Exists**:
   Run this in Supabase SQL Editor:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'create_user_profile';
   ```
   If it doesn't exist, run the `database_migration_auth.sql` file.

3. **Check Trigger Exists**:
   ```sql
   SELECT trigger_name 
   FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

4. **Manually Test Profile Creation**:
   After registration, run this in Supabase SQL Editor (replace USER_ID):
   ```sql
   SELECT * FROM profiles WHERE id = 'USER_ID_FROM_AUTH_USERS';
   ```

5. **Check RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

### Common Issues

- **RLS blocking inserts**: The `create_user_profile()` function should bypass this
- **Trigger not firing**: Check if trigger exists and is enabled
- **User not authenticated**: Profile creation happens right after signup, user should be authenticated

## Issue 2: Logout Not Working / No Logs

### Debugging Steps

1. **Check if Button is Clickable**:
   - Look for "🔴 LOGOUT ICON PRESSED" in console when clicking
   - If you don't see this, the button might not be rendering or clickable

2. **Check Platform**:
   - On **Web**: Should see "Web detected - performing direct logout"
   - On **Mobile**: Should see Alert dialog first

3. **Check Console Logs**:
   Look for these messages in order:
   - "🔴 LOGOUT ICON PRESSED"
   - "🔴 LOGOUT BUTTON CLICKED - handleLogout called"
   - "AuthContext: Starting signout..."
   - "Signing out from Supabase..."
   - "Supabase signout successful"
   - "AuthContext: Signout successful"

4. **Test Direct Logout**:
   Open browser console and run:
   ```javascript
   // This will test if signOut function works
   // You'll need to import it or access via window if exposed
   ```

### Common Issues

- **Alert.alert not working on web**: Fixed - now uses direct logout on web
- **Navigation not working**: Using `router.replace()` and `window.location.href` as fallback
- **Session not clearing**: localStorage is cleared before signout

## Quick Fixes to Try

### For Profile Creation:

1. **Ensure database function exists** - Run `database_migration_auth.sql`
2. **Check if user is created in auth.users table**:
   ```sql
   SELECT id, email, phone, raw_user_meta_data 
   FROM auth.users 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
3. **Manually create profile if needed**:
   ```sql
   -- Replace values with actual user data
   INSERT INTO profiles (id, username, email, phone)
   VALUES (
     'USER_ID_HERE',
     'username_here',
     'email@example.com',
     NULL
   )
   ON CONFLICT (id) DO NOTHING;
   ```

### For Logout:

1. **Clear browser cache and localStorage**:
   - Open DevTools → Application → Local Storage
   - Clear all Supabase-related keys
   - Refresh page

2. **Test logout directly**:
   - Open browser console
   - Try: `localStorage.clear()` then refresh

3. **Check if router is working**:
   - Try navigating manually: `router.push('/login')` in console

## Expected Console Output

### Successful Registration:
```
Attempting registration with: { method: 'email', identifier: '...', username: '...' }
Profile does not exist, creating now...
Attempting RPC function...
✅ Profile created via RPC function
✅ Profile verified successfully: { id: '...', username: '...', email: '...' }
Registration successful
```

### Successful Logout:
```
🔴 LOGOUT ICON PRESSED
🔴 LOGOUT BUTTON CLICKED - handleLogout called
Web detected - performing direct logout (or Alert on mobile)
Calling signOut...
AuthContext: Starting signout...
Signing out from Supabase...
Cleared localStorage
Supabase signout successful
AuthContext: Signout successful
SignOut completed, redirecting...
```

## If Issues Persist

1. **Check Supabase Dashboard**:
   - Authentication → Users: Should see registered users
   - Table Editor → profiles: Should see profiles
   - Check for any error messages

2. **Check Network Tab**:
   - Look for failed API calls
   - Check response codes and error messages

3. **Verify Environment**:
   - Ensure Supabase URL and keys are correct
   - Check if RLS is enabled and policies are correct

