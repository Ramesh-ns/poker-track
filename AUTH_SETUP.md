# Authentication Setup Instructions

## Issues Fixed

### 1. Profiles Table Data
- Added INSERT policy for profiles table
- Profile creation is handled by database trigger automatically
- Manual upsert also ensures profile is created

### 2. Email Confirmation Disabled
- Email confirmation is disabled in the signup code
- **IMPORTANT**: You also need to disable email confirmation in Supabase Dashboard:
  1. Go to your Supabase Dashboard
  2. Navigate to Authentication > Settings
  3. Under "Email Auth", disable "Enable email confirmations"
  4. Save changes

### 3. User-Specific Sessions
- Added `user_id` column to sessions table
- Updated RLS policies to filter sessions by user
- Sessions are now user-specific

### 4. Registration Redirect
- Registration now immediately redirects to login page on success
- No email confirmation required

### 5. Session Persistence
- Configured Supabase client for proper session persistence
- Auth state should persist across app restarts

## Database Migrations Required

Run these SQL scripts in your Supabase SQL Editor in order:

1. **First**: `database_migration.sql` (if not already run)
2. **Second**: `database_migration_auth.sql` (creates profiles table)
3. **Third**: `database_migration_user_sessions.sql` (adds user_id to sessions)

## Supabase Dashboard Configuration

### Disable Email Confirmation
1. Go to Supabase Dashboard → Authentication → Settings
2. Under "Email Auth" section
3. **Uncheck** "Enable email confirmations"
4. Click "Save"

This will prevent Supabase from sending confirmation emails and allow users to login immediately after registration.

## Testing

After running migrations and disabling email confirmation:

1. Register a new user
2. Should redirect to login page immediately
3. Login with credentials
4. Should only see sessions created by that user
5. Auth state should persist across app restarts

