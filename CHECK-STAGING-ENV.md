# 🔍 Check Staging Environment Variables

## Issue: Redirected to Login Page

This means your staging deployment is likely using the **wrong Supabase URL** or environment variables aren't set correctly.

---

## ✅ **Verify Vercel Environment Variables**

### Step 1: Check Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

**Look for these variables and verify they're set to "Preview" environment:**

| Variable | Expected Value | Environment |
|----------|----------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ougntjrrskfsuognjmcw.supabase.co` | **Preview** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (staging anon key) | **Preview** |
| `SUPABASE_SERVICE_ROLE_KEY` | (staging service role) | **Preview** |
| `NEXT_PUBLIC_APP_URL` | `https://assettracer-staging.vercel.app` | **Preview** |

**⚠️ CRITICAL**: Make sure they're set to **"Preview"** environment, NOT "Production"!

---

### Step 2: Check What Staging is Actually Using

**Open browser console** (F12) on your staging site and run:

```javascript
// Check which Supabase URL is being used
console.log('Supabase URL:', document.documentElement.innerHTML.match(/https:\/\/[a-z]+\.supabase\.co/)?.[0]);

// Or check the network tab
// Look for API calls to see which Supabase project they're hitting
```

**Expected**: Should show `ougntjrrskfsuognjmcw.supabase.co` (staging)  
**Problem**: If it shows your production Supabase URL, env vars aren't set correctly

---

## 🔧 **Fix: Add Environment Variables**

If they're missing or wrong, add them in Vercel:

### Via Vercel Dashboard:

1. **Go to**: Settings → Environment Variables
2. **Click**: Add New
3. **For each variable**:
   - Enter key (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter value (e.g., `https://ougntjrrskfsuognjmcw.supabase.co`)
   - Select environment: **Preview**
   - Click Save

### Required Variables for Staging:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91Z250anJyc2tmc3VvZ25qbWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MjE4MzAsImV4cCI6MjA1MzI5NzgzMH0.c2VnVl0xKZqNlCdDmxYN3dMfS3JLxKbCCWyJ5kQglRM
SUPABASE_SERVICE_ROLE_KEY=<your_staging_service_role_key>
NEXT_PUBLIC_APP_URL=https://assettracer-staging.vercel.app
NODE_ENV=staging
RESEND_API_KEY=<your_resend_key>
POLAR_API_KEY=polar_oat_4wgNyL10vdUTUr8xdNYVQOdNuxayBLZGTTQqe1bpvC3
POLAR_PRO_PRICE_ID=15716604-b369-47b2-bc73-90d452a3c9b7
POLAR_BUSINESS_PRICE_ID=ef965b20-266e-4bad-96d3-387a19f2c7c8
CRON_SECRET=esugD/VLx0GaKrP5OJPn0lYnPNGriOS0iBSYvrwIhfA=
```

---

## 🚀 **After Adding Environment Variables**

**You MUST redeploy** for changes to take effect:

### Option 1: Redeploy from Vercel Dashboard
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. **Uncheck** "Use existing Build Cache"
5. Click "Redeploy"

### Option 2: Push Empty Commit
```powershell
git checkout staging
git commit --allow-empty -m "chore: Trigger redeploy with env vars"
git push origin staging
```

---

## 🔍 **Verify After Redeploy**

1. **Go to**: Vercel deployment logs
2. **Check build output** for Polar client initialization:
   ```
   Polar Client initialized: {
     hasApiKey: true,
     apiKeyPrefix: 'polar_oat_4wgNy',
     baseUrl: 'https://sandbox-api.polar.sh'
   }
   ```

3. **Open staging site** in incognito
4. **Open browser console** (F12)
5. **Try logging in** and watch for errors

---

## 📋 **Most Likely Cause**

If you're redirected to login page immediately after clicking "Continue with Google":

**Problem**: Staging is using **production** Supabase URL instead of staging  
**Cause**: Environment variables not set to "Preview" environment  
**Fix**: Add variables to "Preview" environment in Vercel, then redeploy

---

## 🆘 **Still Not Working?**

Send me:
1. Screenshot of Vercel environment variables (blur sensitive values)
2. Browser console errors when trying to log in
3. Which Supabase URL the network tab shows

I'll identify the exact issue!

