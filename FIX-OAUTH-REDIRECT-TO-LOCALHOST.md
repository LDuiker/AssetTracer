# Fix: OAuth Redirecting to Localhost Instead of Live Site

## 🐛 Problem

After selecting a Google account to log in, you're redirected to:
```
http://localhost:3000/...
```

Instead of:
```
https://your-app.vercel.app/...
```

**Root Cause**: The **Site URL** in Supabase is set to `localhost` instead of your production URL.

---

## ✅ SOLUTION: Update Site URL in Supabase

### Step 1: Go to Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Select your **PRODUCTION** project (the one you're using for your live app)

### Step 2: Update Authentication Settings

1. Click **"Authentication"** in the left sidebar
2. Click **"URL Configuration"** (or go to **Settings** → **Authentication**)

### Step 3: Update Site URL

You'll see a field called **"Site URL"**:

**Current (WRONG)**:
```
http://localhost:3000
```

**Change to (CORRECT)**:
```
https://your-app-name.vercel.app
```

Replace `your-app-name` with your actual Vercel app name.

**To find your Vercel URL**:
- Go to: https://vercel.com/dashboard
- Click on your AssetTracer project
- Copy the URL shown under "Domains"
- It looks like: `https://asset-tracer-xyz123.vercel.app`
- Or if you have a custom domain: `https://yourdomain.com`

### Step 4: Update Redirect URLs

While you're here, make sure **"Redirect URLs"** includes:

**Add these (if not already there)**:
```
https://your-app-name.vercel.app/auth/callback
https://your-app-name.vercel.app/dashboard
https://your-app-name.vercel.app/checkout
```

**Keep these for local development**:
```
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
```

### Step 5: Save

1. Click **"Save"** at the bottom
2. Wait ~1 minute for changes to propagate

---

## 🧪 Test Again

1. **Open an incognito/private window** (clears any cached redirects)
2. Go to: `https://your-app-name.vercel.app`
3. Click **"Continue with Google"**
4. Select your Google account
5. You should now be redirected to: `https://your-app-name.vercel.app/dashboard` ✅

---

## 🔍 Verify Your Configuration

### What Your Supabase Settings Should Look Like:

```
┌─────────────────────────────────────────────────────┐
│ Authentication > URL Configuration                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Site URL                                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ https://your-app.vercel.app                     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Redirect URLs (comma-separated)                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ https://your-app.vercel.app/auth/callback       │ │
│ │ https://your-app.vercel.app/dashboard           │ │
│ │ https://your-app.vercel.app/checkout            │ │
│ │ http://localhost:3000/auth/callback             │ │
│ │ http://localhost:3000/dashboard                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│        [Save]                                       │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Why This Happens

When Supabase redirects users after OAuth:
1. It looks at the **Site URL** setting
2. Uses that as the base for redirect URLs
3. If Site URL = `localhost` → redirects to localhost
4. If Site URL = production URL → redirects to production ✅

---

## 🔧 Additional Fix: Google Cloud Console

If you're still having issues, also update Google Cloud Console:

1. Go to: **https://console.cloud.google.com/**
2. Select your project
3. **APIs & Services** → **Credentials**
4. Click on your OAuth Client
5. Under **"Authorized redirect URIs"**, make sure you have:
   ```
   https://[your-supabase-ref].supabase.co/auth/v1/callback
   ```
   (NOT localhost!)
6. Click **Save**

---

## 🐛 Troubleshooting

### Still redirecting to localhost?

**Clear your browser cache**:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use an incognito window

**Check your Site URL again**:
1. Supabase Dashboard → Authentication → URL Configuration
2. Make sure it's `https://your-app.vercel.app` (NOT localhost!)
3. Click Save again

**Wait a bit**:
- Changes can take 1-2 minutes to propagate
- Try again after waiting

### Getting "Invalid redirect URL" error?

**Problem**: The redirect URL you're trying to use isn't in the allowed list.

**Fix**:
1. Supabase → Authentication → URL Configuration
2. Add the full redirect URL to the "Redirect URLs" list:
   ```
   https://your-app.vercel.app/auth/callback
   ```
3. Save

### Local development still works, right?

**Yes!** You can keep localhost URLs in the redirect list for local dev:
```
http://localhost:3000/auth/callback
```

When you're on localhost, it'll use localhost.  
When you're on production, it'll use production.

The key is to set the **Site URL** to your production URL.

---

## 📋 Quick Checklist

- [ ] Supabase Site URL = `https://your-app.vercel.app`
- [ ] Supabase Redirect URLs includes production URLs
- [ ] Google Cloud redirect URI = Supabase callback URL
- [ ] Cleared browser cache or using incognito
- [ ] Tested from production URL (not localhost)
- [ ] Successfully redirected to production after Google sign-in ✅

---

## 🎉 Expected Result

**Before Fix**:
```
1. Go to: https://your-app.vercel.app
2. Click "Continue with Google"
3. Select Google account
4. Redirected to: http://localhost:3000 ❌ (doesn't work!)
```

**After Fix**:
```
1. Go to: https://your-app.vercel.app
2. Click "Continue with Google"
3. Select Google account
4. Redirected to: https://your-app.vercel.app/dashboard ✅ (works!)
```

---

## 💡 Pro Tip: Multiple Environments

If you want to support both local and production:

**Supabase Settings**:
- Site URL: `https://your-app.vercel.app` (production URL)
- Redirect URLs: Include BOTH:
  - `https://your-app.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

Your app code already handles this correctly with:
```typescript
callbackUrl = `${window.location.origin}/auth/callback`;
```

This dynamically uses:
- `https://your-app.vercel.app/auth/callback` when on production
- `http://localhost:3000/auth/callback` when on localhost

So you can develop locally AND have production working! 🎉

---

**Last Updated**: October 22, 2025  
**Status**: ⏳ Awaiting Site URL Configuration

