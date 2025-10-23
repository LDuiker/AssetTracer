# Fix: OAuth Code Appearing at Root URL Instead of Callback

## 🐛 The Problem

After clicking "Continue with Google", you end up at:
```
https://www.asset-tracer.com/?code=5a2d1f09-8044-4f95-b368-29f115afe65c
```

**Instead of**:
```
https://www.asset-tracer.com/auth/callback?code=...
```

**What this means**: The OAuth code is being delivered to the root URL, not the callback route, so your app can't process it.

---

## 🎯 Root Cause

Supabase is redirecting to the root URL because **your production domain is not in the allowed redirect URLs list**.

When Supabase doesn't recognize the `redirectTo` URL, it falls back to the **Site URL** (root domain).

---

## ✅ THE FIX: Add Production URLs to Supabase

### Step 1: Go to Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Select your **PRODUCTION** project
3. Click **"Authentication"** in the left sidebar
4. Click **"URL Configuration"**

### Step 2: Check Site URL

Make sure **"Site URL"** is set to:
```
https://www.asset-tracer.com
```

### Step 3: Add Redirect URLs

In the **"Redirect URLs"** section, make sure you have ALL of these:

```
https://www.asset-tracer.com/auth/callback
https://www.asset-tracer.com/dashboard
https://www.asset-tracer.com/checkout
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
```

**Important Notes**:
- Use `www.asset-tracer.com` (with www) since that's your actual domain
- Make sure there are NO typos
- Make sure there are NO trailing slashes (`/` at the end)
- Add each URL separately (click "+ Add URL" for each)

### Step 4: Save

1. Click **"Save"** at the bottom
2. Wait **1-2 minutes** for changes to propagate

---

## 🧪 Test Again

1. **Open incognito window** (Ctrl+Shift+N) - clears any cached OAuth state
2. Go to: `https://www.asset-tracer.com`
3. Click **"Continue with Google"** (or go to `/login` first)
4. Select your Google account
5. **Check the URL** after redirect - it should be:
   ```
   https://www.asset-tracer.com/auth/callback?code=...
   ```
   (Notice: `/auth/callback` in the path, not just `/?code=...`)

6. Your app should process the code and redirect you to the dashboard ✅

---

## 🔍 How to Verify Your Current Config

Run this in Supabase SQL Editor to see what's currently allowed:

```sql
-- This won't work directly, but you can check in the dashboard

-- Go to: Authentication → URL Configuration
-- Look at: Site URL and Redirect URLs
```

**What you should see**:

```
Site URL:
  https://www.asset-tracer.com

Redirect URLs (comma-separated or one per line):
  https://www.asset-tracer.com/auth/callback
  https://www.asset-tracer.com/dashboard
  https://www.asset-tracer.com/checkout
  http://localhost:3000/auth/callback
  http://localhost:3000/dashboard
```

---

## 🐛 Alternative Issue: Domain Mismatch

If you're using **both** `asset-tracer.com` and `www.asset-tracer.com`:

### Check Which Domain Your App Uses

Open your production site and check the browser's address bar:
- Is it `https://asset-tracer.com`? (no www)
- Or `https://www.asset-tracer.com`? (with www)

### Make Sure Site URL Matches

In Supabase, set **Site URL** to match exactly what's in your browser:
- If browser shows `www.asset-tracer.com` → Site URL should be `https://www.asset-tracer.com`
- If browser shows `asset-tracer.com` → Site URL should be `https://asset-tracer.com`

### Add BOTH Versions to Redirect URLs

To be safe, add both versions:
```
https://www.asset-tracer.com/auth/callback
https://asset-tracer.com/auth/callback
https://www.asset-tracer.com/dashboard
https://asset-tracer.com/dashboard
```

---

## 🔧 Additional Check: Vercel Domain Config

Make sure your Vercel deployment is using the correct domain:

1. Go to: **https://vercel.com/dashboard**
2. Click on your **AssetTracer** project
3. Go to **Settings** → **Domains**
4. Check which domain is listed:
   - `www.asset-tracer.com`?
   - `asset-tracer.com`?
   - Both?

### If You Have Both:

Set up a redirect from one to the other in Vercel:
- Either `asset-tracer.com` → `www.asset-tracer.com`
- Or `www.asset-tracer.com` → `asset-tracer.com`

This ensures consistent OAuth behavior.

---

## 💡 Why This Happens

**The OAuth Flow**:
```
1. User clicks "Continue with Google"
2. App redirects to Supabase with redirectTo="https://www.asset-tracer.com/auth/callback"
3. Supabase checks: "Is this URL in my allowed list?"
   
   IF YES:
   ✅ Google → Supabase → https://www.asset-tracer.com/auth/callback (correct!)
   
   IF NO:
   ❌ Google → Supabase → https://www.asset-tracer.com/ (root URL)
   ❌ Code appears at root, not processed
```

**The Fix**: Add your production domain's callback URL to Supabase's allowed list.

---

## 📋 Checklist

- [ ] Opened Supabase Dashboard → Authentication → URL Configuration
- [ ] Site URL matches your production domain (with or without www)
- [ ] Redirect URLs includes: `https://www.asset-tracer.com/auth/callback`
- [ ] Redirect URLs includes: `https://www.asset-tracer.com/dashboard`
- [ ] No trailing slashes in redirect URLs
- [ ] No typos in domain name
- [ ] Saved changes
- [ ] Waited 1-2 minutes
- [ ] Tested in incognito window
- [ ] Code now appears at `/auth/callback` instead of root ✅
- [ ] Successfully redirected to dashboard ✅

---

## 🎯 Expected URLs During OAuth Flow

**Before fix**:
```
1. Click "Continue with Google"
2. Google authentication
3. Redirect to: https://www.asset-tracer.com/?code=abc123 ❌
4. Nothing happens (code not processed)
```

**After fix**:
```
1. Click "Continue with Google"
2. Google authentication
3. Redirect to: https://www.asset-tracer.com/auth/callback?code=abc123 ✅
4. App processes code
5. Creates user (via trigger)
6. Redirects to: https://www.asset-tracer.com/dashboard ✅
7. Success! 🎉
```

---

## 🐛 Still Not Working?

### Check Environment Variables in Vercel

Make sure Vercel has the correct Supabase URL:

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check: `NEXT_PUBLIC_SUPABASE_URL` points to your **production** Supabase project
3. Check: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is from your **production** Supabase project

### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors during OAuth flow
4. Share any errors you see

### Check Supabase Logs

1. Supabase Dashboard → Logs → Auth Logs
2. Look for failed OAuth attempts
3. Check for "redirect URL not allowed" errors

---

## 📝 Summary

**Problem**: OAuth code appearing at root URL instead of `/auth/callback`  
**Cause**: Production domain not in Supabase redirect URLs list  
**Solution**: Add `https://www.asset-tracer.com/auth/callback` to Supabase redirect URLs  
**Time**: 2 minutes to fix  

---

**Last Updated**: October 22, 2025  
**Status**: ⏳ Awaiting Supabase Configuration Update

