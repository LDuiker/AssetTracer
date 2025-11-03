# 🚨 FIX: OAuth Redirects to Landing Page

## Problem
You're getting redirected to landing page with OAuth code in URL instead of dashboard.

**URL**: `https://assettracer-staging-git-main-larona-duikers-projects.vercel.app/?code=514fc719...`

This means:
- ✅ Google OAuth is working (you got a code)
- ❌ User profile is NOT being created
- ❌ App redirects you back to landing page

---

## 🔍 Step 1: Diagnose the Issue

**Run this SQL script in Supabase:**

1. Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/sql
2. Copy all contents of: `DIAGNOSE-STAGING-OAUTH-NOW.sql`
3. Paste and click **RUN**
4. Read the diagnosis summary

**Most likely issue**: OAuth trigger is NOT installed

---

## 🛠️ Step 2: Quick Fix (The Nuclear Option)

Since you just set up a fresh staging database, use the nuclear fix:

### Run This SQL Script:

```sql
-- File: NUCLEAR-FIX-STAGING-NOW.sql
```

This will:
1. Delete all data (you just set it up, so nothing to lose)
2. Reinstall OAuth trigger with correct settings
3. Fix RLS policies
4. Clean everything up

**Steps:**
1. Go to Supabase SQL Editor
2. Copy contents of `NUCLEAR-FIX-STAGING-NOW.sql`
3. Paste and **RUN**
4. Wait for completion

---

## 🔧 Step 3: Fix Supabase Auth URLs

The URL you're being redirected to is a **Vercel preview URL** (git-main branch), not your main staging URL.

### What's your actual staging URL?

Check in Vercel Dashboard:
- Go to: https://vercel.com/larona-duikers-projects
- Find your staging project
- Look at **Domains** section
- The main URL should be something like: `assettracer-staging.vercel.app`

### Update Supabase Auth Settings:

1. Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration

2. Set **Site URL** to your MAIN Vercel URL:
   ```
   https://assettracer-staging.vercel.app
   ```
   (Use your actual main staging URL, NOT the git-main preview URL)

3. Set **Redirect URLs** to include BOTH:
   ```
   https://assettracer-staging.vercel.app/**
   https://assettracer-staging.vercel.app/auth/callback
   https://assettracer-staging-git-main-larona-duikers-projects.vercel.app/**
   https://assettracer-staging-git-main-larona-duikers-projects.vercel.app/auth/callback
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

4. **Save**

---

## ⚡ Step 4: Check Vercel Deployment

You're using a git branch preview URL. Let's check your deployment:

### Go to Vercel Dashboard:
1. Visit: https://vercel.com
2. Select your staging project
3. Go to **Deployments** tab

### Check which URL to use:
- **Production deployment**: `assettracer-staging.vercel.app` ← Use this!
- **Preview deployments**: `git-main-...` ← Don't use for testing

### Force a proper deployment:
1. Go to **Settings** → **Git**
2. Check: What branch is set as "Production Branch"?
3. Should be: `staging` or `main`
4. If wrong, change it

Then:
1. Go to **Deployments**
2. Find latest deployment
3. Click **...** → **Redeploy**
4. **UNCHECK** "Use existing Build Cache"
5. Click **Redeploy**

---

## 🧪 Step 5: Test Again

After running the fixes:

1. **Clear browser cache** or use **FRESH incognito window**

2. Go to your **MAIN** staging URL (not the git-main preview):
   ```
   https://assettracer-staging.vercel.app
   ```

3. Click **Sign in with Google**

4. **Expected behavior:**
   - ✅ Redirects to Google
   - ✅ Redirects back to staging
   - ✅ Creates user automatically
   - ✅ Shows dashboard (NOT landing page!)

---

## 📋 Checklist

Run through this checklist:

- [ ] Ran `DIAGNOSE-STAGING-OAUTH-NOW.sql` to identify issue
- [ ] Ran `NUCLEAR-FIX-STAGING-NOW.sql` to fix database
- [ ] Updated Supabase Site URL to main staging URL (not git-main)
- [ ] Added redirect URLs including git-main preview URL
- [ ] Verified Vercel production branch is correct
- [ ] Redeployed Vercel with cache OFF
- [ ] Tested in fresh incognito window
- [ ] Used MAIN staging URL (not git-main preview)

---

## 🆘 If Still Not Working

### Check these in Supabase SQL Editor:

```sql
-- Check if trigger is installed
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
-- Should return 1 row

-- Check for orphaned users
SELECT au.email, au.created_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;
-- Should return 0 rows (no orphans)

-- If you see your email, delete it:
DELETE FROM auth.users WHERE email = 'your-email@gmail.com';
-- Then try signing in again
```

### Check Vercel environment variables:

1. Go to: Settings → Environment Variables
2. Verify these match your STAGING Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (staging anon key)
   SUPABASE_SERVICE_ROLE_KEY=eyJ... (staging service role key)
   ```

3. If wrong, update and redeploy (cache OFF)

---

## 🎯 Root Cause

Based on the symptoms, the issue is **one of these**:

1. **OAuth trigger not installed** (most likely)
   - Fix: Run `NUCLEAR-FIX-STAGING-NOW.sql`

2. **Orphaned user exists** (from previous test)
   - Fix: Delete user and reinstall trigger

3. **Wrong Supabase URL in Vercel**
   - Fix: Check env vars point to staging database

4. **Vercel deployed old code**
   - Fix: Redeploy with cache OFF

---

## ✅ Success Looks Like

After the fix, your auth flow should be:

1. Click "Sign in with Google" on: `https://assettracer-staging.vercel.app/login`
2. Redirects to Google OAuth
3. Select account
4. Redirects to: `https://assettracer-staging.vercel.app/auth/callback?code=...`
5. **Dashboard loads immediately** (NOT landing page!)
6. User profile created automatically in database

---

## 📚 Related Files

- `DIAGNOSE-STAGING-OAUTH-NOW.sql` - Diagnose the issue
- `NUCLEAR-FIX-STAGING-NOW.sql` - Fix everything at once
- `INSTALL-OAUTH-TRIGGER-NOW.sql` - Just install trigger
- `FIX-RLS-POLICIES-V2.sql` - Just fix RLS policies

---

**Start with Step 1: Run the diagnosis script!**

