# User Signup Fix - Auto-Create Profiles

## Problem
When new users sign up via Google OAuth, they are authenticated but their user profile is not created in the database. This causes:
- Users getting redirected to the home page instead of the dashboard
- Error: "Cannot coerce the result to a single JSON object" (no user profile found)
- 403 errors when trying to access features

## Root Cause
The application was missing a **database trigger** to automatically create user profiles and organizations when new users sign up. Without this, authenticated users have no record in the `users` table and cannot access the application.

## The Fix
Created an automatic database trigger (`CREATE-USER-TRIGGER.sql`) that:
1. Listens for new user signups in `auth.users`
2. Automatically creates an organization for the new user
3. Creates a user profile linked to that organization
4. Sets default values (currency, timezone, etc.)

## How to Implement

### Step 1: Run the Trigger Creation Script

1. Open your **Supabase Dashboard** (https://app.supabase.com)
2. Go to **SQL Editor**
3. Copy and paste the entire contents of `asset-tracer/supabase/CREATE-USER-TRIGGER.sql`
4. Click **Run**

You should see a success message confirming the trigger was created.

### Step 2: Test with a New User

1. **Sign out** of your current account
2. **Sign up** with a different Google account (or use incognito mode)
3. You should now be automatically redirected to `/dashboard` after signup
4. The user will have their own organization created

### Step 3: Fix Existing Users (Optional)

If you already have users who signed up but don't have profiles, run this in SQL Editor:

```sql
-- Run SETUP-USER-ORG.sql for existing users
-- Or manually create their profiles:

DO $$
DECLARE
  auth_user RECORD;
  new_org_id uuid;
BEGIN
  -- Loop through auth users without profiles
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    -- Create organization
    INSERT INTO organizations (name, default_currency)
    VALUES (
      COALESCE(auth_user.raw_user_meta_data->>'full_name', auth_user.email) || '''s Organization',
      'USD'
    )
    RETURNING id INTO new_org_id;
    
    -- Create user profile
    INSERT INTO users (id, email, organization_id)
    VALUES (auth_user.id, auth_user.email, new_org_id);
    
    RAISE NOTICE 'Created profile for: %', auth_user.email;
  END LOOP;
END $$;
```

## What the Trigger Does

### When a New User Signs Up:

**1. Creates an Organization:**
- Name: Based on user's email (e.g., "John's Organization")
- Default currency: USD
- Default timezone: America/New_York
- Default date format: MM/DD/YYYY

**2. Creates a User Profile:**
- Links to the auth.users record
- Extracts name from Google OAuth metadata
- Links to the newly created organization
- Sets created/updated timestamps

**3. All Automatic:**
- No manual intervention needed
- Works for all OAuth providers
- Happens immediately on signup

## How Sign Up Flow Works Now

```
1. User clicks "Sign in with Google"
   ↓
2. Google OAuth authentication
   ↓
3. Supabase creates record in auth.users
   ↓
4. 🔥 TRIGGER FIRES (NEW!)
   ├─ Creates organization
   └─ Creates user profile
   ↓
5. Auth callback redirects to /dashboard
   ↓
6. User has full access ✅
```

## Testing the Fix

### Test 1: New User Signup
1. Use a different Google account or incognito mode
2. Sign up via Google OAuth
3. Should redirect to `/dashboard` successfully
4. All features should work

### Test 2: Verify in Database
Run this query in SQL Editor:

```sql
-- View recent signups
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  u.organization_id,
  o.name as organization_name,
  u.created_at
FROM users u
JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at DESC
LIMIT 10;
```

You should see all users have an organization.

### Test 3: Check Trigger Exists
```sql
-- Verify trigger is active
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Should return 1 row showing the trigger is active.

## Files Created

- `asset-tracer/supabase/CREATE-USER-TRIGGER.sql` - The trigger creation script
- `asset-tracer/USER-SIGNUP-FIX.md` - This documentation

## Important Notes

1. **Run Once**: The trigger only needs to be created once in your database
2. **Safe to Re-run**: The script uses `CREATE OR REPLACE` so it's safe to run multiple times
3. **Works for All OAuth**: The trigger works for any OAuth provider (Google, GitHub, etc.)
4. **Automatic**: Once installed, all new signups work automatically

## Troubleshooting

### If signup still redirects to home page:
1. Check if trigger exists (see Test 3 above)
2. Check Supabase logs for errors
3. Verify the trigger function was created:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'handle_new_user';
   ```

### If you see "Organization not found":
1. The user exists but has no organization
2. Run the "Fix Existing Users" script above
3. Or manually link them to an organization

### If features return 403 errors:
1. User profile exists but RLS policies might be blocking
2. Check if user has an organization_id:
   ```sql
   SELECT id, email, organization_id FROM users WHERE email = 'your@email.com';
   ```

## Next Steps

After implementing this fix:
1. ✅ All new users will automatically get profiles
2. ✅ Signup flow will work correctly
3. ✅ Users will be redirected to dashboard
4. ✅ All features will be accessible

You may also want to:
- Update the landing page to better explain the sign up process
- Add welcome emails for new users
- Create an onboarding flow for first-time users

