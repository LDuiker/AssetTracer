# 🔄 Make Vercel Detect Staging Branch

## Problem
Vercel only shows `main` branch, not the new `staging` branch you just created.

## Why?
Vercel caches the list of branches and hasn't refreshed to see the new one yet.

---

## ✅ Solution - 3 Methods (Try in Order)

### Method 1: Trigger a Push (Easiest)

Make a small change on staging branch to trigger Vercel to detect it:

```bash
# Switch to staging branch
git checkout staging

# Make a tiny change (add a comment to README)
echo "" >> README.md

# Commit and push
git add README.md
git commit -m "Trigger Vercel branch detection"
git push origin staging
```

**Expected**: Vercel will now see the staging branch and deploy it!

---

### Method 2: Disconnect and Reconnect Git (If Method 1 Doesn't Work)

**In Vercel Dashboard:**

1. Go to your project → **Settings** → **Git**

2. Scroll to bottom → Click **"Disconnect"** (scary but safe!)

3. Click **"Connect Git Repository"**

4. Select your GitHub repository again

5. Authorize

**Expected**: Vercel will re-scan and detect both branches

---

### Method 3: Manual Branch Selection in Deployment Settings

**In Vercel Dashboard:**

1. Go to your project → **Settings** → **Git**

2. Look for **"Production Branch"** section

3. You might see a dropdown or text input

4. Type: `staging` manually

5. Save

**Expected**: Vercel will now track the staging branch

---

## 🎯 Quick Fix (Do This Now)

Run these commands:

```powershell
# Verify you're in the right directory
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer"

# Switch to staging
git checkout staging

# Trigger Vercel detection
git commit --allow-empty -m "Trigger Vercel to detect staging branch"
git push origin staging
```

Then:
1. Go to Vercel Dashboard
2. Check **Deployments** tab
3. You should see a new deployment for staging branch!

---

## 🔍 Verify It Worked

**In Vercel Dashboard:**

1. Go to **Settings** → **Git**
2. Under "Production Branch", you should now see `staging` as an option
3. Or check **Deployments** tab - you should see deployment from `staging` branch

---

## 📋 What About Your Two Environments?

You mentioned you only see one project in Vercel. Let's clarify your setup:

### Option A: Two Separate Vercel Projects (Recommended)

**You should have:**
- Project 1: `assettracer-staging` (or similar)
  - Uses `staging` branch
  - Deploys to: `assettracer-staging.vercel.app`
  - Has staging env vars

- Project 2: `assettracer` or `assettracer-production`
  - Uses `main` branch
  - Deploys to: `www.asset-tracer.com`
  - Has production env vars

### Option B: One Project with Branch Deployments

**If you only have ONE project:**
- Set production branch to `main`
- Staging branch will create preview deployments
- Access staging at: preview URLs (like `git-staging-...vercel.app`)

**Problem with Option B**: Both environments share same environment variables!

---

## 🆘 If You Only Have One Vercel Project

You should create a second one for proper separation:

### Create Second Vercel Project:

1. Go to: https://vercel.com/new

2. Click **"Import Project"**

3. Select your GitHub repository: `AssetTracer`

4. Give it a name: `assettracer-staging`

5. **Before deploying**, configure:
   - **Framework**: Next.js
   - **Root Directory**: `./asset-tracer` (if not at root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

6. Add **Environment Variables** (staging ones):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
   NEXT_PUBLIC_POLAR_SANDBOX=true
   NEXT_PUBLIC_ENV=staging
   ```

7. Click **Deploy**

8. After deployment:
   - Go to **Settings** → **Git**
   - Set **Production Branch** to: `staging`

Now you have proper separation!

---

## ✅ Final Setup Should Look Like:

```
GitHub Repository: AssetTracer
├── main branch
│   └── Vercel Project: "assettracer-production"
│       └── URL: www.asset-tracer.com
│       └── Env: Production Supabase
│
└── staging branch
    └── Vercel Project: "assettracer-staging"  
        └── URL: assettracer-staging.vercel.app
        └── Env: Staging Supabase
```

---

## 🚀 Immediate Action

**Do this RIGHT NOW:**

```powershell
# Make Vercel detect staging branch
git checkout staging
git commit --allow-empty -m "Detect staging branch"
git push origin staging
```

Then:
- Check Vercel Dashboard → Deployments
- See if staging branch appears

**Tell me:**
1. Do you see a deployment from `staging` branch now?
2. Do you have ONE or TWO projects in Vercel?
3. What are the project names?

---

**Run those git commands now and let me know what happens!** 🚀

