# 🔧 Final Fix for Staging Auth (assettracer-staging.vercel.app)

## Current Status
- Testing on: `https://assettracer-staging.vercel.app/`
- Issue: After selecting Google account, redirected back to login
- Database: ✅ Configured correctly (trigger, RLS, schema all match production)

## Root Cause
The issue is with **Supabase OAuth Redirect URLs** or **Google OAuth configuration**.

---

## ✅ FINAL FIX (Do ALL Steps)

### Step 1: Double-Check Supabase Redirect URLs

Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration

**Verify these EXACT values:**

**Site URL** (must be EXACTLY):
```
https://assettracer-staging.vercel.app
```

**Redirect URLs** (must include ALL of these):
```
https://assettracer-staging.vercel.app/auth/callback
https://assettracer-staging.vercel.app/*
http://localhost:3000/auth/callback
http://localhost:3000/*
```

**⚠️ CRITICAL**: 
- NO trailing slash on domain: ✅ `https://assettracer-staging.vercel.app`
- NOT: ❌ `https://assettracer-staging.vercel.app/`
- Must use `https://` not `http://`

### Step 2: Verify Google OAuth Provider

Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/providers

**Check Google Provider:**
- [x] Enabled
- Client ID: (should be filled)
- Client Secret: (should be filled)

**If Google OAuth is NOT enabled**, enable it:
1. Click "Google"
2. Enable it
3. Use the same Google OAuth credentials as production OR create new ones
4. Save

### Step 3: Verify Google Cloud Console (IF using different credentials)

**ONLY if you're using DIFFERENT Google OAuth credentials than production:**

Go to: https://console.cloud.google.com/apis/credentials

1. Find your OAuth 2.0 Client ID
2. Click on it
3. Under "Authorized redirect URIs", verify it includes:
```
https://ougntjrrskfsuognjmcw.supabase.co/auth/v1/callback
```

**If using SAME credentials as production, skip this step** - it's already configured.

### Step 4: Create Test User Profile Manually

There might be an orphaned auth user. Run this in Supabase SQL Editor:

```sql
-- Check for orphaned users
SELECT 
  au.id,
  au.email,
  CASE WHEN u.id IS NULL THEN '❌ NO PROFILE' ELSE '✅ Has profile' END
FROM auth.users au
LEFT JOIN users u ON au.id = u.id;
```

**If you see any with "❌ NO PROFILE"**, run:

```sql
-- Create profiles for orphaned users
DO $$
DECLARE
  new_org_id UUID;
  auth_user_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  FOR auth_user_id, user_email, user_name IN
    SELECT au.id, au.email,
      COALESCE(au.raw_user_meta_data->>'full_name',
               au.raw_user_meta_data->>'name',
               split_part(au.email, '@', 1))
    FROM auth.users au
    LEFT JOIN users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    INSERT INTO organizations (name, default_currency, timezone, date_format)
    VALUES (user_name || '''s Organization', 'USD', 'UTC', 'MM/DD/YYYY')
    RETURNING id INTO new_org_id;
    
    INSERT INTO users (id, email, name, organization_id)
    VALUES (auth_user_id, user_email, user_name, new_org_id);
    
    RAISE NOTICE '✅ Created profile for: %', user_email;
  END LOOP;
END $$;
```

### Step 5: Delete Test User & Try Fresh

**In Supabase Dashboard:**
1. Go to: Authentication → Users
2. Delete any test users you created
3. This ensures you start fresh with the trigger working

### Step 6: Clear Everything & Test

1. **Close browser completely**
2. **Open NEW incognito window**
3. **Go to**: https://assettracer-staging.vercel.app
4. **Click**: "Continue with Google"
5. **Select your account**
6. **Should redirect to dashboard** ✅

---

## 🔍 If STILL Failing After All Steps

Run this diagnostic in Supabase SQL to verify everything:

```sql
-- Complete diagnostic
SELECT 'Trigger Status: ' || 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
  THEN '✅ Installed' ELSE '❌ Missing' END;

SELECT 'Trigger Function: ' || 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user' AND security_type = 'DEFINER')
  THEN '✅ SECURITY DEFINER' ELSE '❌ Wrong security' END;

SELECT 'RLS Policies: ' || COUNT(DISTINCT tablename) || ' tables'
FROM pg_policies WHERE schemaname = 'public';

SELECT 'Orphaned Users: ' || COUNT(*)
FROM auth.users au LEFT JOIN users u ON au.id = u.id WHERE u.id IS NULL;

SELECT 'Google Provider: ' || 
  CASE WHEN EXISTS(SELECT 1 FROM auth.providers WHERE provider = 'google')
  THEN '✅ Enabled' ELSE '❌ Disabled' END;
```

Expected output:
```
Trigger Status: ✅ Installed
Trigger Function: ✅ SECURITY DEFINER
RLS Policies: 13 tables
Orphaned Users: 0
Google Provider: ✅ Enabled
```

---

## 🚨 If You've Done ALL This

And it's STILL not working, the issue is likely:

1. **Vercel is serving old code** - Force redeploy without cache
2. **Environment variables wrong** - Verify they're set to "Preview" 
3. **Different issue entirely** - Share the Supabase logs (Dashboard → Logs & Reports → Auth logs)

---

**Complete ALL 6 steps above, then test in fresh incognito window!**

