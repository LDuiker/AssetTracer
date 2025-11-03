# Remove Cron Jobs from Vercel Staging Project

## 🐛 Problem
Vercel is trying to create cron jobs even though `vercel.json` has them removed. This means cron jobs exist in the Vercel Dashboard and need to be manually deleted.

## ✅ Solution: Delete Cron Jobs in Vercel Dashboard

### Step 1: Go to Your Staging Project

1. **Open Vercel Dashboard**: https://vercel.com/dashboard
2. **Click on your STAGING project** (e.g., `assettracer-staging`)

### Step 2: Go to Cron Jobs Settings

1. **Click**: **Settings** (top navigation)
2. **Click**: **Cron Jobs** (left sidebar)
   - Or go directly: **Settings → Cron Jobs**

### Step 3: Delete All Cron Jobs

You should see 2 cron jobs listed:
- `/api/cron/send-invoice-reminders` - Daily at 9 AM
- `/api/cron/send-weekly-reports` - Mondays at 9 AM

**For each cron job:**
1. Click the **three dots** (⋯) or **trash icon** next to the cron job
2. Click **Delete** or **Remove**
3. Confirm deletion

**OR** If there's a bulk delete option:
- Select all cron jobs
- Click **Delete Selected**

### Step 4: Verify Cron Jobs Are Gone

1. Refresh the Cron Jobs page
2. You should see: **"No Cron Jobs"** or **"Add your first cron job"**

### Step 5: Redeploy (Optional)

After deleting cron jobs, you may want to trigger a new deployment:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Check **"Use existing Build Cache"** = **UNCHECKED**
5. Click **Redeploy**

## 🎯 Alternative: Check Production Project

**Important**: Make sure you're deleting from the **STAGING** project, not production!

**Staging project**: `assettracer-staging` (or similar)
**Production project**: `assettracer` or `assettracer-production`

Cron jobs might be configured in the wrong project. Check both!

## 📋 Quick Checklist

- [ ] Opened Vercel Dashboard
- [ ] Selected STAGING project (not production)
- [ ] Went to Settings → Cron Jobs
- [ ] Deleted all 2 cron jobs
- [ ] Verified no cron jobs remain
- [ ] Redeployed (optional)

## 🔍 Why This Happens

Even though we removed `crons` from `vercel.json`, if cron jobs were:
1. Previously configured in `vercel.json` and deployed
2. Manually added via Vercel Dashboard

They will remain active until manually deleted. Vercel doesn't automatically remove cron jobs when you remove them from `vercel.json`.

## ✅ After Fixing

Once cron jobs are deleted from staging:
- ✅ Deployments will succeed
- ✅ No more "cron job limit exceeded" error
- ✅ Cron jobs can still be added to PRODUCTION manually via dashboard

---

**Next**: Delete the cron jobs in Vercel Dashboard, then redeploy. The error should be gone!

