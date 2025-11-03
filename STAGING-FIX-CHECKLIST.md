# ✅ STAGING FIX - FINAL CHECKLIST

## DO THESE 3 THINGS IN ORDER (NO SKIPPING)

---

## ☑️ STEP 1: Run NUCLEAR-FIX-STAGING-NOW.sql

1. Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/sql/new
2. Copy and paste **NUCLEAR-FIX-STAGING-NOW.sql**
3. Click **RUN**
4. Wait for "✅ NUCLEAR FIX COMPLETE!" message

**What this does:**
- Deletes all users (fresh start)
- Reinstalls OAuth trigger with SECURITY DEFINER
- Fixes RLS policies
- Verifies everything

---

## ☑️ STEP 2: Fix Supabase Redirect URLs

Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration

**Set Site URL:**
```
https://assettracer-staging.vercel.app
```
(NO trailing slash!)

**Add Redirect URLs (all 4):**
```
https://assettracer-staging.vercel.app/auth/callback
https://assettracer-staging.vercel.app/*
http://localhost:3000/auth/callback
http://localhost:3000/*
```

Click **SAVE**.

---

## ☑️ STEP 3: Force Vercel Redeploy

1. Go to: https://vercel.com/dashboard
2. Find your staging project
3. Click **Deployments** tab
4. Click latest deployment → **"..." menu** → **"Redeploy"**
5. **⚠️ UNCHECK "Use existing Build Cache"** ← CRITICAL!
6. Click **Redeploy**
7. Wait 2-3 minutes for build complete

---

## ☑️ STEP 4: Test with Fresh Browser

1. **Close ALL browser windows**
2. Open **NEW incognito window**
3. Go to: https://assettracer-staging.vercel.app
4. Click **"Continue with Google"**
5. Sign in with your Google account
6. **You WILL reach the dashboard!** ✅

---

## ⚠️ CRITICAL NOTES

- Do NOT skip the Vercel redeploy step
- Do NOT skip unchecking the build cache
- Do NOT test until redeploy is complete
- Use incognito window to avoid cache issues

---

## 🎯 WHY THIS WORKS

This is the EXACT process that fixed production:
1. ✅ Clean database (no orphaned users)
2. ✅ OAuth trigger with SECURITY DEFINER
3. ✅ Correct Supabase redirect URLs
4. ✅ Fresh Vercel deployment (no cache)

All 4 steps are MANDATORY. Skip any = failure.

