# Fix OAuth Redirect to Landing Page Issue

## 🚨 Problem
After signing in with Google, users are redirected back to the landing page instead of the dashboard.

## 🔍 Root Cause
This happens when the OAuth callback URL is not properly configured or the callback route fails silently.

---

## ✅ Solution 1: Check Supabase Redirect URLs (Most Common)

### Step 1: Go to Supabase Dashboard
1. Open your **Production** Supabase project
2. Go to: **Authentication → URL Configuration**
3. Check these settings:

**Site URL:**
```
https://www.asset-tracer.com
```

**Redirect URLs (add ALL of these):**
```
https://www.asset-tracer.com/auth/callback
https://www.asset-tracer.com/api/auth/callback
https://www.asset-tracer.com/*
```

### Step 2: Save and Test
Click **"Save"** and try logging in again.

---

## ✅ Solution 2: Check Vercel Environment Variables

### Go to Vercel Dashboard:
1. Open your project
2. Go to: **Settings → Environment Variables**
3. Verify these exist and are correct:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://www.asset-tracer.com
```

### If missing or wrong:
1. Update them
2. Click **"Redeploy"** to apply changes

---

## ✅ Solution 3: Force OAuth Account Selection

The code fix we pushed should have forced account selection. Verify Vercel deployed the latest code:

### Check Latest Deployment:
1. Go to: https://vercel.com/dashboard
2. Look for deployment with commit: **"fix: Force Google account chooser on login"**
3. Click on it to see status
4. If it's not the "Production" deployment, click **"Promote to Production"**

---

## ✅ Solution 4: Test with Console Log

Open browser console (F12) when signing in and look for:
- Any error messages
- Network requests to `/auth/callback`
- 404 or 500 errors

---

## 🎯 Quick Diagnostic

Run this in production and tell me the result:

**In Supabase SQL Editor:**
```sql
-- Check if users can be found
SELECT 
  u.id,
  u.email,
  u.name,
  u.organization_id,
  o.name as org_name
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.email = 'larona@stageworksafrica.com';
```

If you see results, the database is fine. The issue is purely OAuth redirect configuration.

---

## 🚀 Most Likely Fix

**Update Supabase Redirect URLs** (Solution 1) - This fixes 90% of cases.

The redirect URLs must include your production domain with the `/auth/callback` path.

