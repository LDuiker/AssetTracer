# 🚨 Quick Diagnostic: Staging Authentication Issue

## Current Issue
After clicking "Continue with Google" and selecting an account:
1. ✅ Gets redirected to landing page (first time)
2. ✅ Click "Sign in" again
3. ✅ Gets redirected to dashboard

This indicates: **OAuth session is created, but user profile is missing** (orphaned auth user)

---

## 🔍 Quick Diagnostic (Do This First)

### Step 1: Run These Queries in Staging Supabase

Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/sql

**Query 1: Check if OAuth trigger exists**
```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

**Expected**: Should see 1 row  
**If empty**: Trigger is missing - go to Step 2

**Query 2: Check for orphaned users**
```sql
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE WHEN u.id IS NULL THEN '❌ NO PROFILE' ELSE '✅ Has profile' END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
ORDER BY au.created_at DESC
LIMIT 10;
```

**If you see any "❌ NO PROFILE"**: That's your problem! Go to Step 3

**Query 3: Check trigger function details**
```sql
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  prosrc as source_code
FROM pg_proc
WHERE proname = 'handle_new_user';
```

**Expected**: `is_security_definer = true`  
**If false or null**: Function is missing or incorrectly configured

---

## 🔧 The Fix

### If Trigger is Missing or Broken:

1. **Go to**: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/sql

2. **Run this script**:
   
Open file: `asset-tracer/supabase/OAUTH-USER-AUTO-CREATE-FIXED.sql` and copy ALL of it, then paste in Supabase SQL Editor and run.

This will:
- ✅ Drop old broken trigger
- ✅ Create new trigger with SECURITY DEFINER
- ✅ Use correct column name (`name` not `full_name`)
- ✅ Set up RLS policies properly

### If You Have Orphaned Users:

**Option A: Delete and Start Fresh** (Recommended for testing)
```sql
-- Delete orphaned auth users
DELETE FROM auth.users 
WHERE id IN (
  SELECT au.id 
  FROM auth.users au 
  LEFT JOIN users u ON au.id = u.id 
  WHERE u.id IS NULL
);
```

**Option B: Create Profiles for Orphaned Users**
```sql
DO $$
DECLARE
  new_org_id UUID;
  auth_user_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  FOR auth_user_id, user_email, user_name IN
    SELECT au.id, au.email,
      COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1)
      )
    FROM auth.users au
    LEFT JOIN users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    -- Create organization
    INSERT INTO organizations (name, default_currency, timezone, date_format)
    VALUES (user_name || '''s Organization', 'USD', 'UTC', 'MM/DD/YYYY')
    RETURNING id INTO new_org_id;
    
    -- Create user profile
    INSERT INTO users (id, email, name, organization_id)
    VALUES (auth_user_id, user_email, user_name, new_org_id);
    
    RAISE NOTICE '✅ Created profile for: %', user_email;
  END LOOP;
END $$;
```

---

## ✅ Verify After Fix

Run this complete diagnostic:
```sql
SELECT 
  'Trigger: ' || 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
  THEN '✅ Installed' ELSE '❌ Missing' END as trigger_status,
  
  'Function Security: ' ||
  CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user' AND prosecdef = true)
  THEN '✅ SECURITY DEFINER' ELSE '❌ Wrong security' END as function_security,
  
  'Orphaned Users: ' || COUNT(*) as orphaned_users
FROM auth.users au 
LEFT JOIN users u ON au.id = u.id 
WHERE u.id IS NULL;
```

**Expected output**:
```
trigger_status    | ✅ Installed
function_security | ✅ SECURITY DEFINER  
orphaned_users    | 0
```

---

## 🧪 Test

1. **Close all browser windows completely**
2. **Open fresh incognito window**
3. **Go to**: https://assettracer-staging.vercel.app
4. **Click**: "Continue with Google"
5. **Select account**
6. **Should redirect to**: `/dashboard` ✅

---

## 🚨 If STILL Failing

Check these:

1. **Supabase Redirect URLs**: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration
   - Site URL: `https://assettracer-staging.vercel.app`
   - Redirect URLs: `https://assettracer-staging.vercel.app/auth/callback` and `https://assettracer-staging.vercel.app/*`

2. **Google OAuth Provider**: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/providers
   - Should be enabled with valid Client ID and Secret

3. **Supabase Auth Logs**: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/logs
   - Check for any error messages during OAuth flow

4. **Vercel Environment Variables**: Verify `NEXT_PUBLIC_SUPABASE_URL` is set to staging project

