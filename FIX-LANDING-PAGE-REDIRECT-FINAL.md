# 🚨 FIX: OAuth Redirects to Landing Page (FINAL SOLUTION)

## The Problem
After clicking "Sign in with Google", you get redirected back to the landing page with an OAuth code in the URL:
```
https://assettracer-staging.vercel.app/?code=2b62938b-8117-4c70-bcaa-97a37cae5d4e
```

This means:
- ✅ Google OAuth is working
- ❌ User profile is NOT being created (OAuth trigger failing)
- ❌ Or redirect URL is wrong (landing page instead of /auth/callback)

---

## ✅ COMPLETE FIX (Follow in Order)

### Step 1: Delete Orphaned User (2 minutes)

You probably have an orphaned user (in auth.users but not in public.users).

**Run this in Supabase SQL Editor:**

1. Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/sql

2. Copy ALL contents of: **`DELETE-ORPHANED-USER-NOW.sql`**

3. Paste and click **RUN**

This will:
- ✅ Show you any orphaned users
- ✅ Delete them automatically
- ✅ Verify the OAuth trigger is installed

---

### Step 2: Fix Supabase Auth URLs (CRITICAL!)

The redirect URL is probably missing or wrong.

**Go to Supabase Auth Settings:**

1. Open: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration

2. Set **Site URL** to:
   ```
   https://assettracer-staging.vercel.app
   ```
   (NO trailing slash!)

3. Under **Redirect URLs**, add these EXACT URLs:
   ```
   https://assettracer-staging.vercel.app/**
   https://assettracer-staging.vercel.app/auth/callback
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

4. **IMPORTANT**: Make sure `/auth/callback` is explicitly listed!

5. **Remove** any old URLs (especially git-main preview URLs)

6. Click **SAVE**

---

### Step 3: Verify OAuth Trigger

**Still in Supabase SQL Editor, run this:**

```sql
-- Check if trigger exists
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if function has SECURITY DEFINER
SELECT 
  proname as function_name,
  CASE prosecdef 
    WHEN true THEN '✅ SECURITY DEFINER (Good!)'
    ELSE '❌ NOT SECURITY DEFINER (Problem!)'
  END as security_status
FROM pg_proc
WHERE proname = 'handle_new_user';
```

**Expected results:**
- ✅ Should return 1 row for trigger
- ✅ Should show SECURITY DEFINER = true

**If NOT Security Definer or trigger missing:**
Run this:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

Then copy and run: **`INSTALL-OAUTH-TRIGGER-NOW.sql`**

---

### Step 4: Test Again (Fresh Start)

1. **Open a FRESH incognito/private browser window**

2. **Clear all cookies** (important!)

3. Go to: `https://assettracer-staging.vercel.app`

4. Click **"Sign in with Google"**

5. **Expected flow:**
   - Redirects to Google ✅
   - Select account
   - Redirects to: `https://assettracer-staging.vercel.app/auth/callback?code=...`
   - Then redirects to: `https://assettracer-staging.vercel.app/dashboard`
   - Dashboard loads! ✅

---

## 🔍 If Still Failing

### Check Browser Console

1. Open browser console (F12)
2. Go to **Console** tab
3. Look for errors when clicking "Sign in with Google"
4. Look for errors after redirect from Google

### Common Issues:

**Issue 1: Redirects to landing page (not /auth/callback)**
- Fix: Check Supabase redirect URLs include `/auth/callback` explicitly

**Issue 2: Gets to /auth/callback but then lands on landing page**
- Fix: User is orphaned (exists in auth but no profile)
- Run: `DELETE-ORPHANED-USER-NOW.sql`

**Issue 3: Error "Organization not found"**
- Fix: OAuth trigger didn't create organization
- Run: `INSTALL-OAUTH-TRIGGER-NOW.sql` with SECURITY DEFINER

**Issue 4: Stuck at loading**
- Fix: Clear browser cache completely
- Try different browser

---

## 🎯 The Complete Flow Should Be:

```
1. Click "Sign in with Google"
   ↓
2. Redirect to Google OAuth
   ↓
3. Select Google account
   ↓
4. Redirect to: /auth/callback?code=xxx
   ↓
5. Exchange code for session (creates user)
   ↓
6. Trigger fires: creates profile + organization
   ↓
7. Redirect to: /dashboard
   ↓
8. Dashboard loads! ✅
```

**If you end up at landing page instead of step 7:**
- Either step 4 didn't happen (wrong redirect URL)
- Or step 6 failed (trigger not working/user orphaned)

---

## 📋 Quick Checklist

Before testing, verify:

- [ ] Ran `DELETE-ORPHANED-USER-NOW.sql` in Supabase
- [ ] Supabase Site URL = `https://assettracer-staging.vercel.app`
- [ ] Supabase Redirect URLs include `/auth/callback`
- [ ] OAuth trigger is installed (check with SQL query)
- [ ] OAuth trigger has SECURITY DEFINER
- [ ] Using FRESH incognito window
- [ ] Cleared all cookies/cache

---

## 🆘 Nuclear Option (If Nothing Works)

If all else fails, run this complete reset:

```sql
-- In Supabase SQL Editor
-- WARNING: This deletes ALL data

-- Delete all users
DELETE FROM auth.users;
DELETE FROM users;
DELETE FROM organizations;

-- Reinstall trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

Then run: `INSTALL-OAUTH-TRIGGER-NOW.sql`

Then try signing in again in fresh incognito.

---

## ✅ Success Looks Like:

After the fix, when you sign in:
1. Click "Sign in with Google" → Redirects to Google
2. Select account → Redirects to /auth/callback
3. Automatically creates user + organization
4. Dashboard loads with empty state
5. No errors in console
6. Can create assets, clients, etc.

---

## 📞 Debug Information to Share

If still not working, share these:

1. **Result of this SQL query:**
```sql
SELECT COUNT(*) as auth_users FROM auth.users;
SELECT COUNT(*) as public_users FROM users;
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
```

2. **Supabase Site URL** (from auth settings)

3. **Supabase Redirect URLs** (all of them)

4. **Browser console errors** (screenshot)

5. **What URL you land on** after Google redirect

---

**Start with Step 1: Run `DELETE-ORPHANED-USER-NOW.sql` now!** 🚀

