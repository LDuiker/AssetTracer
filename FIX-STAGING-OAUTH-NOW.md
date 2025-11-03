# 🔧 Fix Staging OAuth for assettracer-staging.vercel.app

## Quick Checklist

Run through these steps to fix the redirect issue:

---

## ✅ **Step 1: Verify Domain is Actually Configured**

Go to: **Vercel Dashboard → Settings → Domains**

**Check if `assettracer-staging.vercel.app` is listed**

- ✅ **If YES**: Good! Continue to Step 2
- ❌ **If NO**: Add it now:
  1. Click "Add Domain"
  2. Enter: `assettracer-staging.vercel.app`
  3. Assign to branch: `staging`
  4. Save and wait for it to be ready

---

## ✅ **Step 2: Update Supabase OAuth URLs**

Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration

### Site URL:
```
https://assettracer-staging.vercel.app
```

### Redirect URLs (add ALL of these):
```
https://assettracer-staging.vercel.app/auth/callback
https://assettracer-staging.vercel.app/*
http://localhost:3000/auth/callback
http://localhost:3000/*
```

**IMPORTANT**: Make sure there's NO trailing slash!

---

## ✅ **Step 3: Verify Environment Variables**

In **Vercel Dashboard → Settings → Environment Variables**, verify for **Preview** environment:

```
NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
NEXT_PUBLIC_APP_URL=https://assettracer-staging.vercel.app
```

**Note**: Use `https://` not `http://`

---

## ✅ **Step 4: Redeploy**

After making changes above, you MUST redeploy:

1. Go to **Vercel Dashboard → Deployments**
2. Find latest staging deployment
3. Click "..." → **Redeploy**
4. **Uncheck** "Use existing Build Cache"
5. Click Redeploy

---

## ✅ **Step 5: Test with These Exact Steps**

1. **Open incognito window** (CTRL+SHIFT+N)
2. **Go to**: https://assettracer-staging.vercel.app
3. **Open browser console** (F12)
4. **Click**: "Continue with Google"
5. **Watch the URL** in address bar during redirect

**Expected flow**:
```
1. https://assettracer-staging.vercel.app
2. → Google OAuth consent screen
3. → https://ougntjrrskfsuognjmcw.supabase.co/auth/v1/callback
4. → https://assettracer-staging.vercel.app/auth/callback?code=...
5. → https://assettracer-staging.vercel.app/dashboard
```

**If it fails**, check console for errors.

---

## 🐛 **Common Issues**

### Issue 1: "Redirect URI mismatch" error
**Fix**: Make sure Supabase Redirect URLs include exact URL with `/auth/callback`

### Issue 2: Redirected to landing page
**Fix**: Run the orphaned users fix in Supabase SQL:
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
    
    RAISE NOTICE '✅ Profile created for: %', user_email;
  END LOOP;
END $$;
```

### Issue 3: Still redirected to login
**Fix**: Delete test user and try with fresh account:
```sql
-- Delete from Supabase Authentication → Users in dashboard
-- Then clear browser cache and try again
```

---

## 📋 **Final Verification Script**

Run this in staging Supabase SQL Editor to verify everything:

```sql
-- Check trigger
SELECT 'OAuth trigger: ' || 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
  THEN '✅ Installed' ELSE '❌ Missing' END;

-- Check RLS policies  
SELECT 'RLS policies: ' || COUNT(DISTINCT tablename) || ' tables' 
FROM pg_policies WHERE schemaname = 'public';

-- Check for orphaned users
SELECT 'Orphaned users: ' || COUNT(*) 
FROM auth.users au LEFT JOIN users u ON au.id = u.id WHERE u.id IS NULL;
```

Expected output:
```
OAuth trigger: ✅ Installed
RLS policies: 13 tables
Orphaned users: 0
```

---

**Complete steps 1-5 above, then try logging in again!**

