# Fix User Role Assignment - Staging

## Problem
When users sign up, they're automatically assigned the 'member' role instead of 'owner' role. This means the person who creates an organization doesn't have admin rights.

## Solution
The fix updates the OAuth trigger to:
1. Set new users as 'owner' when they create their organization
2. Update existing single users to be owners
3. Create entries in organization_members table (if it exists)

## Steps to Apply

### 1. Open Supabase Staging Dashboard
- Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw
- Click on "SQL Editor" in the left sidebar

### 2. Run the Fix Script
- Open the file: `FIX-USER-ROLE-STAGING.sql`
- Copy the entire contents
- Paste into Supabase SQL Editor
- Click "Run" button

### 3. Verify the Results
The script will show you:
- ✅ Trigger installed successfully
- ✅ Function created
- Current users and their roles (should show 'owner')
- Organization members (if table exists)

### 4. Test with New User
After applying the fix:
1. Open an incognito/private browser window
2. Go to: https://assettracer-staging.vercel.app
3. Sign up with a NEW email (e.g., test+owner@example.com)
4. After signup, check the database:

```sql
-- Run this query in Supabase SQL Editor
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  o.name as organization_name
FROM users u
JOIN organizations o ON o.id = u.organization_id
ORDER BY u.created_at DESC
LIMIT 5;
```

The new user should have `role = 'owner'` ✅

### 5. Check Existing Users
If you have existing users who should be owners, the script automatically promotes them if they're the only member of their organization.

## What This Fixes

### Before:
```sql
-- New user signs up
INSERT INTO users (id, email, name, organization_id, role)
VALUES (..., ..., ..., ..., 'member');  -- ❌ Wrong!
```

### After:
```sql
-- New user signs up
INSERT INTO users (id, email, name, organization_id, role)
VALUES (..., ..., ..., ..., 'owner');  -- ✅ Correct!
```

## Role Hierarchy
- **owner**: Full control, created the organization (cannot be removed)
- **admin**: Can manage team and most settings
- **member**: Can create/edit resources
- **viewer**: Read-only access

## Troubleshooting

### If users still show as 'member':
1. Check if the trigger was installed:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

2. Check the trigger function:
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

3. Look for the line that sets role to 'owner' in the function

### If you need to manually update a user:
```sql
UPDATE users 
SET role = 'owner' 
WHERE email = 'user@example.com';
```

## Next Steps After Fixing Staging

Once you've verified this works on staging:
1. Test with multiple new signups
2. Verify permissions work correctly (owners can invite, manage team, etc.)
3. Apply the same fix to production database

Let me know when you're ready to apply this to production!

