# 🔧 Fix: Staging Deployment Triggers Production Deployment and Fails

## Problem
When you push to `staging` branch, Vercel deploys BOTH staging AND production, and production deployment fails.

**Current Symptoms:**
- Push to `staging` branch ✅
- Staging deploys successfully ✅
- Production ALSO deploys ❌
- Production deployment fails ❌

---

## 🎯 Root Cause

You likely have **ONE Vercel project** that's watching **BOTH branches**, or production project is configured incorrectly.

---

## 🔍 Diagnose Your Vercel Setup

### Go to Vercel Dashboard
Visit: https://vercel.com/dashboard

**Answer these questions:**

1. **How many projects do you see?**
   - [ ] One project (e.g., "AssetTracer" or "asset-tracer")
   - [ ] Two projects (e.g., "AssetTracer" and "AssetTracer-Staging")

2. **If ONE project, what's the "Production Branch" setting?**
   - Settings → Git → Production Branch
   - Current value: _____________

3. **Do you see preview deployments?**
   - Deployments tab
   - Do you see URLs like `git-staging-xyz-...vercel.app`?

---

## ✅ Solution Based on Your Setup

### Scenario A: You Have TWO Projects

#### Staging Project Settings
1. Go to **staging** project (e.g., "AssetTracer-Staging")
2. Settings → Git → Production Branch: Should be **`staging`**
3. Domain: Should be `assettracer-staging.vercel.app`
4. Environment Variables: Should point to staging Supabase

#### Production Project Settings
1. Go to **production** project (e.g., "AssetTracer" or "asset-tracer")
2. Settings → Git → Production Branch: Should be **`main`** (NOT `staging`!)
3. Domain: Should be `www.asset-tracer.com`
4. Environment Variables: Should point to production Supabase

**If production branch is set to `staging`:** That's your problem! Change it to `main`.

---

### Scenario B: You Have ONE Project

**Problem:** One project can't properly separate staging and production environments.

**Solutions:**

#### Option 1: Create Second Project (RECOMMENDED)

1. **Go to:** https://vercel.com/new

2. **Click:** "Add New" → "Project"

3. **Import your GitHub repo:**
   - Repository: `LDuiker/AssetTracer`
   - Framework: Next.js (auto-detected)
   - Root Directory: `asset-tracer`

4. **Project Name:** `assettracer-staging`

5. **Environment Variables:** Add ALL staging environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
   POLAR_API_KEY=<your-polar-key>
   POLAR_PRO_PRICE_ID=<price-id>
   POLAR_BUSINESS_PRICE_ID=<price-id>
   NEXT_PUBLIC_APP_URL=https://assettracer-staging.vercel.app
   NODE_ENV=staging
   ```

6. **Click:** Deploy

7. **After deployment:**
   - Go to Settings → Git
   - Set **Production Branch** to: `staging`
   - Save

8. **Configure first project:**
   - Go to your original project
   - Settings → Git
   - Set **Production Branch** to: `main` (if not already)

**Now you have:**
- Project 1: `assettracer-staging` → `staging` branch
- Project 2: `asset-tracer` → `main` branch

---

#### Option 2: Use Branch-Specific Environment Variables (NOT RECOMMENDED)

If you can't create a second project, you can use one project with different env vars per branch, but this is error-prone.

1. Settings → Environment Variables
2. When adding variable, select "Preview" environment (for staging branch)
3. Then add same variable again, but select "Production" environment (for main branch)

**Problem:** This is confusing and easy to make mistakes.

---

### Scenario C: Production Branch is Set Wrong

**Most Common Issue:** Production project's "Production Branch" is set to `staging` instead of `main`.

**Fix:**

1. Go to your **production** Vercel project
2. Settings → Git
3. Find "Production Branch"
4. Change from `staging` to `main`
5. Save

---

## 🚨 Quick Diagnostic Commands

### Check What's Happening

```bash
# See recent deployments
git log --oneline -10

# Check which branches exist
git branch -a

# Check what's on staging
git checkout staging
git log --oneline -5

# Check what's on main
git checkout main
git log --oneline -5
```

---

## ✅ Expected Behavior After Fix

### When You Push to Staging:
```bash
git checkout staging
# ... make changes ...
git commit -m "New feature"
git push origin staging
```
**Expected:** ONLY staging deploys

### When You Push to Main:
```bash
git checkout main
git merge staging
git push origin main
```
**Expected:** ONLY production deploys

---

## 🔍 Verify Fix

### Test Staging Deployment:
1. Make a small change on `staging` branch
2. Push to `staging`
3. Check Vercel dashboard
4. **Should see:** Only staging deployment triggered
5. **Should NOT see:** Production deployment

### Test Production Deployment:
1. Merge `staging` to `main`
2. Push to `main`
3. Check Vercel dashboard
4. **Should see:** Only production deployment triggered
5. **Should NOT see:** Staging deployment

---

## 🆘 Still Having Issues?

### If Production Still Deploys When You Push to Staging:

**Check these in Vercel Dashboard:**

1. **Git Integration:**
   - Settings → Git
   - Is GitHub integration properly connected?
   - Are there any webhooks errors?

2. **Deploy Hooks:**
   - Check if there are any webhook URLs configured
   - Make sure production project only has webhook for `main` branch

3. **Build Settings:**
   - Settings → General
   - Is "Auto-deploy" enabled?
   - Is it set to deploy from correct branch?

4. **Recent Deployments:**
   - Go to Deployments tab
   - Check last 5 deployments
   - Which branches triggered them?
   - If you see staging deployments on production project, that's the issue

---

## 🎯 Action Items

**Do THIS NOW:**

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Count your projects: _______ (1 or 2?)
3. For EACH project, check:
   - Production Branch: __________
   - Environment: __________
   - Domains: __________

4. Tell me:
   - How many projects you have
   - What each project's production branch is set to
   - Which deployment is failing and why

---

## 📊 Example of Correct Setup

```
Vercel Dashboard:
├── Project: "asset-tracer" (Production)
│   ├── Production Branch: main ✅
│   ├── Domain: www.asset-tracer.com
│   ├── Environment: Production
│   └── Deploys from: main branch ONLY
│
└── Project: "assettracer-staging" (Staging)
    ├── Production Branch: staging ✅
    ├── Domain: assettracer-staging.vercel.app
    ├── Environment: Staging
    └── Deploys from: staging branch ONLY
```

---

**Come back and tell me:**
1. How many projects do you have?
2. What is each project's "Production Branch" setting?
3. I'll help you fix it from there!

