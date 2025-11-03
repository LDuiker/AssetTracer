# 🔧 FIX SUPABASE REDIRECT ISSUE - FINAL APPROACH

## The Issue: Landing on `/?code=...` instead of `/auth/callback?code=...`

This means Supabase is ignoring the `redirectTo` parameter.

---

## ✅ **STEP 1: Check Redirect URL Exact Format**

Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration

**Your Redirect URLs should be EXACTLY like this (check for typos, spaces, trailing slashes):**

```
https://assettracer-staging.vercel.app/auth/callback
https://assettracer-staging.vercel.app/*
http://localhost:3000/auth/callback
http://localhost:3000/*
```

**Common issues:**
- Extra space before or after URL
- Missing `https://` protocol
- Trailing slash on `/auth/callback/` (should NOT have it)
- Wrong order (base URL without path should NOT be in list)

---

## ✅ **STEP 2: Temporarily Add Wildcard Redirect**

As a test, ADD this single line to Redirect URLs:

```
https://assettracer-staging.vercel.app/**
```

(with `**` instead of `*`)

This will allow ANY path under your domain. If this works, we know the issue is with URL matching.

---

## ✅ **STEP 3: Check Supabase Project Settings**

Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/settings/general

**Check "Pause project" status:**
- Is the project paused or in some restricted state?
- Is there any warning or notice at the top of the dashboard?

---

## ✅ **STEP 4: Regenerate Supabase Project API Keys**

Sometimes stale keys cause issues:

Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/settings/api

Click **"Generate new anon key"** (if available)

Then update:
1. `.env.staging` locally
2. Vercel environment variables
3. Redeploy

---

## ✅ **STEP 5: Check Google OAuth Client Authorized JavaScript Origins**

Go to: https://console.cloud.google.com/apis/credentials

Click your OAuth 2.0 Client ID

**In "Authorized JavaScript origins", you MUST have:**

```
https://ougntjrrskfsuognjmcw.supabase.co
https://assettracer-staging.vercel.app
http://localhost:3000
```

**If any are missing, ADD them and try again.**

---

## ✅ **STEP 6: Test with Explicit redirectTo in Login Code**

Let me update the login code to be more explicit:

