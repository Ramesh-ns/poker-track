# Password Storage in Supabase

## Where Passwords Are Stored

Passwords are **NOT** stored in the `profiles` table. They are stored in Supabase's built-in `auth.users` table, which is managed by Supabase Auth.

## How It Works

### 1. **Registration (Sign Up)**
When a user registers:
```typescript
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'userpassword123'
});
```

Supabase automatically:
- Creates a record in `auth.users` table
- Hashes the password using bcrypt (one-way encryption)
- Stores the hashed password in `auth.users.encrypted_password`
- Never stores the plain text password

### 2. **Login (Sign In)**
When a user logs in:
```typescript
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'userpassword123'
});
```

Supabase automatically:
- Looks up the user in `auth.users` table
- Compares the provided password with the stored hash
- Returns a session token if password matches
- Returns an error if password doesn't match

### 3. **Database Structure**

#### `auth.users` Table (System Table - Managed by Supabase)
- `id` - UUID (primary key)
- `email` - User's email
- `phone` - User's phone number
- `encrypted_password` - Hashed password (bcrypt)
- `email_confirmed_at` - Email confirmation timestamp
- `phone_confirmed_at` - Phone confirmation timestamp
- `raw_user_meta_data` - JSON metadata (includes username)
- `created_at` - Account creation timestamp
- And many other auth-related fields

#### `profiles` Table (Your Custom Table)
- `id` - UUID (references `auth.users.id`)
- `username` - Display username
- `email` - Email (duplicated for easy querying)
- `phone` - Phone (duplicated for easy querying)
- `created_at` - Profile creation timestamp
- `updated_at` - Last update timestamp

**Note:** `profiles` table does NOT contain passwords - it only stores user metadata.

## Why This Architecture?

1. **Security**: Passwords are stored in a system-managed table with strict access controls
2. **Separation of Concerns**: Auth data (passwords) vs. User data (profile info)
3. **RLS (Row Level Security)**: You can't directly query `auth.users` - you must use Supabase Auth API
4. **Best Practices**: Follows industry standards for password storage

## How to View Users (Including Password Status)

You can view users in Supabase Dashboard:
1. Go to **Authentication** → **Users**
2. You'll see all registered users
3. You can see their email/phone, but NOT their passwords (they're hashed)
4. You can reset passwords, but you can't see the actual password

## Password Validation Flow

```
User Registration:
1. User enters email/phone + password
2. supabase.auth.signUp() called
3. Supabase creates user in auth.users with hashed password
4. Our code creates profile in profiles table (metadata only)

User Login:
1. User enters email/phone/username + password
2. If username, we look up email/phone from profiles table
3. supabase.auth.signInWithPassword() called with email/phone + password
4. Supabase validates password against auth.users.encrypted_password
5. If valid, returns session token
6. User is authenticated
```

## Important Notes

- **You cannot query `auth.users` directly** - it's a system table
- **You cannot see passwords** - they're hashed and one-way encrypted
- **You cannot retrieve passwords** - if user forgets, they must reset it
- **Password validation happens automatically** - Supabase handles it
- **Your code never sees the actual password** - only Supabase Auth sees it

## Testing Password Storage

To verify passwords are being stored:

1. **In Supabase Dashboard:**
   - Go to Authentication → Users
   - You should see registered users
   - Check that `encrypted_password` field exists (you can't see the value, but it's there)

2. **In Your App:**
   - Register a new user
   - Try logging in with correct password → Should work
   - Try logging in with wrong password → Should fail
   - This confirms password is stored and validated correctly

## Summary

- ✅ Passwords ARE stored (in `auth.users` table)
- ✅ Passwords ARE validated (by Supabase Auth)
- ✅ Passwords are hashed (secure)
- ❌ Passwords are NOT in `profiles` table (by design)
- ❌ You cannot see/retrieve passwords (security feature)

