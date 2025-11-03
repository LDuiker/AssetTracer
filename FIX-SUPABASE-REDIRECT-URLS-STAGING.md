# 🚨 FIX SUPABASE REDIRECT URLs - STAGING

## ⚠️ CRITICAL: This is likely why you're redirected to login page

Based on production experience, incorrect Supabase redirect URLs cause OAuth to fail silently.

---

## ✅ **FIX: Configure Supabase URLs**

### **Step 1: Go to Supabase Auth Settings**

https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration

---

### **Step 2: Set Site URL**

**Site URL:**
```
https://assettracer-staging.vercel.app
```

⚠️ **NO trailing slash!**
⚠️ **Must match NEXT_PUBLIC_APP_URL in Vercel**

---

### **Step 3: Set Redirect URLs**

**Redirect URLs** (add ALL of these):

```
https://assettracer-staging.vercel.app/auth/callback
https://assettracer-staging.vercel.app/*
http://localhost:3000/auth/callback
http://localhost:3000/*
```

---

### **Step 4: Verify Vercel Environment Variables**

Go to: https://vercel.com/dashboard (find your staging project)

**Settings → Environment Variables → Preview (or Staging)**

Verify these are set for **staging** environment:

```
NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-staging-service-key>
NEXT_PUBLIC_APP_URL=https://assettracer-staging.vercel.app
```

⚠️ **All URLs must match exactly - no http vs https mismatch**

---

### **Step 5: Force Redeploy**

After fixing URLs:

1. Go to Vercel → Deployments
2. Click latest deployment → "..." menu → "Redeploy"
3. **UNCHECK "Use existing Build Cache"** ← CRITICAL
4. Click Redeploy
5. Wait 2-3 minutes

---

### **Step 6: Test**

1. Clear browser cache (Ctrl+Shift+Delete)
2. Open **NEW incognito window**
3. Go to: https://assettracer-staging.vercel.app
4. Click "Continue with Google"
5. **Should reach dashboard now!**

---

## 🔍 **Debug: Check Browser Console**

If still fails:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try logging in
4. Look for errors like:
   - "Failed to fetch"
   - "CORS error"
   - "Invalid redirect URL"
   - Any red errors mentioning "supabase" or "auth"

Screenshot or copy the error and send it to me.

---

## 📋 **What This Fixes**

In production, the exact same issue occurred:
1. ✅ Database was correct
2. ✅ OAuth trigger was installed
3. ❌ **Supabase redirect URLs were wrong**
4. ❌ **Vercel was deploying old code**

Fixing both solved it immediately.

