# 🚨 FORCE VERCEL TO DEPLOY LATEST CODE - STAGING

## ⚠️ CRITICAL: This is the #1 cause of auth issues

Vercel frequently deploys OLD commits even after pushing new code. This causes redirects to login page because the old code has outdated OAuth logic.

---

## ✅ **SOLUTION: Manual Redeploy with Cache Cleared**

### **Step 1: Check Current Deployment**

1. Go to: https://vercel.com/dashboard
2. Find your **staging** project (or the project with staging environment)
3. Click on **"Deployments"** tab
4. Look at the **latest deployment**
5. Check the **commit hash** - is it the latest from your `staging` branch?

---

### **Step 2: Force Redeploy (MANDATORY)**

1. Click on the **latest deployment**
2. Click the **"..." menu** (top right)
3. Click **"Redeploy"**
4. **⚠️ CRITICAL:** **UNCHECK** "Use existing Build Cache"
5. Click **"Redeploy"**
6. Wait for build to complete (~2-3 minutes)

---

### **Step 3: Verify Deployment**

After deployment completes:

1. Check the commit hash matches your latest staging commit
2. Open a **NEW INCOGNITO WINDOW**
3. Go to: https://assettracer-staging.vercel.app
4. Try logging in with Google

---

## 🔍 **How to Verify Commit Hash**

### **Local (Git):**
```powershell
git checkout staging
git log -1 --oneline
```

### **Vercel Dashboard:**
- Deployments tab → Latest deployment → Shows commit message and hash
- **These must match!**

---

## 🎯 **Why This Happens**

- Vercel caches builds aggressively
- Sometimes webhook from GitHub → Vercel fails
- Build cache can serve old code even after new push
- **ALWAYS manually redeploy with cache cleared for critical changes**

---

## 📋 **What Worked in Production**

This exact issue happened in production. The fix was:
1. ✅ Database schema was correct
2. ✅ OAuth trigger was installed
3. ✅ RLS policies were correct
4. ❌ **Vercel was deploying old code**
5. ✅ **Manual redeploy with cache cleared FIXED IT**

---

**DO THIS NOW:**
1. Run `FIX-STAGING-AUTH-NOW.sql` in Supabase (staging)
2. Force redeploy in Vercel (uncheck cache)
3. Test in fresh incognito window

