# 🔍 CHECK IF VERCEL IS USING YOUR ENVIRONMENT VARIABLES

## ⚠️ CRITICAL: Verify your deployment is actually using the env vars

---

## ✅ **STEP 1: Check Deployment Environment Variables**

1. Go to: https://vercel.com/dashboard
2. Find your project
3. Click **Deployments** tab
4. Click on the **latest staging deployment**
5. Scroll down to **"Environment Variables"** section (near the bottom)

**What do you see?**

- [ ] It shows: `NEXT_PUBLIC_SUPABASE_URL = https://ougntjrrskfsuognjmcw.supabase.co` ✅
- [ ] It shows a DIFFERENT Supabase URL (production?) ❌
- [ ] It shows: `NEXT_PUBLIC_APP_URL = https://assettracer-staging.vercel.app` ✅
- [ ] It shows a DIFFERENT app URL ❌
- [ ] It doesn't show any environment variables at all ❌

**If it shows wrong values or no values, that's the problem!**

---

## ✅ **STEP 2: Verify Environment Variable Scope**

Go to: Your Project → **Settings** → **Environment Variables**

For each variable (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_APP_URL, etc.):

**Check which environments they're set for:**
- [ ] Production only ❌
- [ ] Preview ✅ (this is what you need for staging branch)
- [ ] Development

**If they're only set for Production, that's the problem!**

---

## ✅ **STEP 3: Check Branch Deployment**

In Vercel → **Settings** → **Git**:

**What branch is your staging deployment using?**
- [ ] `main` branch
- [ ] `staging` branch
- [ ] Other?

**Environment variables MUST be set for the correct environment:**
- If deploying from `main` branch → needs "Production" environment
- If deploying from `staging` branch → needs "Preview" environment
- If deploying from any other branch → needs "Preview" environment

---

## ✅ **STEP 4: Force Redeploy (If Variables Were Wrong)**

If you just fixed the environment variable scope:

1. Go to Vercel → Deployments
2. Click latest deployment → "..." → "Redeploy"
3. **⚠️ UNCHECK "Use existing Build Cache"**
4. Click Redeploy
5. Wait for build to complete (2-3 minutes)

---

## 🎯 **Most Common Issues**

### **Issue 1: Environment Variables Only in "Production"**
- Symptom: Network tab shows nothing, redirected to login
- Cause: Staging deployment isn't finding the env vars
- Fix: Add all variables to "Preview" environment

### **Issue 2: Wrong Supabase URL in Deployment**
- Symptom: Auth fails silently
- Cause: Deployment is using production Supabase instead of staging
- Fix: Verify NEXT_PUBLIC_SUPABASE_URL in deployment env vars

### **Issue 3: APP_URL Not Set or Wrong**
- Symptom: Redirected to login immediately
- Cause: OAuth callback URL is wrong
- Fix: Set NEXT_PUBLIC_APP_URL to `https://assettracer-staging.vercel.app`

---

## 📋 **TELL ME:**

1. **In Vercel Deployments → Latest Deployment → Environment Variables:**
   - What does `NEXT_PUBLIC_SUPABASE_URL` show?
   - What does `NEXT_PUBLIC_APP_URL` show?
   - Or does it show NO environment variables?

2. **In Vercel Settings → Environment Variables:**
   - Are your variables set for "Preview" environment?
   - Or only "Production"?

3. **What branch is your staging deployment from?**
   - `main`?
   - `staging`?
   - Other?

