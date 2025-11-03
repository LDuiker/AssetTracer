# 🔍 VERIFY VERCEL ENVIRONMENT VARIABLES - STAGING

## ⚠️ CRITICAL: Wrong env vars = redirect to sign-in page

---

## ✅ **STEP 1: Check Vercel Environment Variables**

Go to your Vercel project → **Settings → Environment Variables**

**Verify these EXACT values for "Preview" or "Staging" environment:**

### **Supabase (STAGING project)**
```
NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-staging-service-key>
```

### **App URL (MUST MATCH EXACTLY)**
```
NEXT_PUBLIC_APP_URL=https://assettracer-staging.vercel.app
```
⚠️ **NO trailing slash!**
⚠️ **Must be https, not http**

### **Polar (Sandbox)**
```
POLAR_API_KEY=<your-sandbox-api-key>
POLAR_PRO_PRICE_ID=<your-sandbox-pro-price-id>
POLAR_BUSINESS_PRICE_ID=<your-sandbox-business-price-id>
```

### **Resend**
```
RESEND_API_KEY=<your-resend-key>
```

### **Cron Secret**
```
CRON_SECRET=<any-random-secret>
```

---

## ✅ **STEP 2: Check Which Vercel Environment**

**CRITICAL**: Are these environment variables set for:
- ✅ **Preview** (recommended for staging branch)
- ✅ **Staging** (if you have a staging environment)
- ❌ **NOT Production** (that's for your main branch)

**If they're only set for "Production", that's the problem!**

---

## ✅ **STEP 3: Verify Deployment is Using Staging Variables**

1. Go to Vercel → **Deployments**
2. Click on your latest staging deployment
3. Scroll down to **"Environment Variables"** section
4. Check if it shows the correct Supabase URL (`ougntjrrskfsuognjmcw`)

**If it shows a different Supabase URL, that's the problem!**

---

## ✅ **STEP 4: Force Redeploy (MANDATORY)**

After verifying/fixing environment variables:

1. Go to Vercel → Deployments
2. Click latest deployment → "..." → "Redeploy"
3. **⚠️ UNCHECK "Use existing Build Cache"** ← CRITICAL!
4. Click Redeploy
5. Wait 2-3 minutes

---

## ✅ **STEP 5: Test OAuth Callback**

After redeploy completes:

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Go to: https://assettracer-staging.vercel.app
4. Click "Continue with Google"
5. Select your Google account
6. **Watch the Network tab**

**Look for redirects to:**
- ✅ Should see: `https://assettracer-staging.vercel.app/auth/callback?code=...`
- ❌ If you see: `localhost` or different URL = wrong APP_URL

---

## 🎯 **Most Common Issues**

### **Issue 1: Environment Variables Only Set for Production**
**Symptom**: Redirected to sign-in page
**Fix**: Add environment variables to "Preview" or "Staging" environment

### **Issue 2: NEXT_PUBLIC_APP_URL is Wrong**
**Symptom**: Redirected to sign-in page or localhost
**Fix**: Set to `https://assettracer-staging.vercel.app` (no trailing slash)

### **Issue 3: Vercel Not Using New Environment Variables**
**Symptom**: Still failing after adding env vars
**Fix**: Force redeploy with cache unchecked

### **Issue 4: Vercel Deploying Old Code**
**Symptom**: Everything looks correct but still failing
**Fix**: Force redeploy with cache unchecked

---

## 📋 **Quick Checklist**

- [ ] Supabase URL is `ougntjrrskfsuognjmcw.supabase.co`
- [ ] APP_URL is `https://assettracer-staging.vercel.app`
- [ ] Environment variables set for "Preview" or "Staging" (NOT just Production)
- [ ] Forced redeploy with cache unchecked
- [ ] Tested in fresh incognito window

---

**TELL ME:**
1. Which environment are your variables set for? (Production/Preview/Staging)
2. What does NEXT_PUBLIC_APP_URL show in Vercel?
3. Did you force redeploy with cache unchecked?

