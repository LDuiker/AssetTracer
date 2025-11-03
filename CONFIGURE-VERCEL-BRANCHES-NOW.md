# 🔧 Configure Vercel Branch Settings - DO THIS NOW

## Why This Matters

Right now both your staging and production might be deploying from the same branch. We need to separate them.

---

## 🎯 Step 1: Find Your Projects

Go to: **https://vercel.com/dashboard**

You should have TWO projects:
1. **Staging project** (e.g., `assettracer-staging`)
2. **Production project** (e.g., `assettracer` or `assettracer-production`)

**If you only have ONE project:** You need to create a second one, or configure different branches for different environments.

---

## ⚙️ Step 2: Configure STAGING Project

### A. Go to Staging Project Settings

1. Click on your **staging** project
2. Go to **Settings** tab
3. Click **Git** in the left sidebar

### B. Set Production Branch

Find the section: **"Production Branch"**

**Change it to:** `staging`

This means:
- ✅ Pushes to `staging` branch → Deploy to staging
- ❌ Pushes to `main` branch → NO deployment

### C. Configure Domains (Optional)

Go to **Domains** tab:
- Main domain: `assettracer-staging.vercel.app`
- Remove any production domains if present

### D. Verify Environment Variables

Go to **Environment Variables** tab:

Ensure these point to your **STAGING** Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
NEXT_PUBLIC_POLAR_SANDBOX=true
NEXT_PUBLIC_ENV=staging
```

---

## ⚙️ Step 3: Configure PRODUCTION Project

### A. Go to Production Project Settings

1. Click on your **production** project
2. Go to **Settings** tab
3. Click **Git** in the left sidebar

### B. Set Production Branch

Find the section: **"Production Branch"**

**Ensure it's set to:** `main`

This means:
- ✅ Pushes to `main` branch → Deploy to production
- ❌ Pushes to `staging` branch → NO deployment

### C. Configure Domains

Go to **Domains** tab:
- Main domain: `www.asset-tracer.com`
- Alias: `asset-tracer.com`

### D. Verify Environment Variables

Go to **Environment Variables** tab:

Ensure these point to your **PRODUCTION** Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://<prod-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
NEXT_PUBLIC_POLAR_SANDBOX=false
NEXT_PUBLIC_ENV=production
```

---

## 🚀 Step 4: Force Redeployments

After changing branch settings:

### For Staging:
1. Go to **Deployments** tab
2. Click latest deployment
3. Click **"..."** menu → **Redeploy**
4. **UNCHECK** "Use existing Build Cache"
5. Click **Redeploy**

### For Production:
1. Same steps as staging
2. This ensures production is deploying from `main`

---

## 📊 Final Configuration Summary

After setup, you should have:

| Project | Branch | URL | Database |
|---------|--------|-----|----------|
| **Staging** | `staging` | assettracer-staging.vercel.app | Staging Supabase (ougntjrrskfsuognjmcw) |
| **Production** | `main` | www.asset-tracer.com | Production Supabase |

---

## ✅ Verification

Test the setup:

### Test Staging Branch:
```bash
# Make a test change
git checkout staging
echo "# Test change" >> README.md
git add README.md
git commit -m "Test staging deployment"
git push origin staging
```

**Expected**: Only staging deploys (not production)

### Test Main Branch:
```bash
# Merge to main
git checkout main
git merge staging
git push origin main
```

**Expected**: Only production deploys (not staging)

---

## 🆘 Troubleshooting

### Issue: "I only see ONE project in Vercel"

**Solution**: You need to create a second project or use different branch settings.

**Option A - Create Second Project:**
1. In Vercel, click **"Add New"** → **"Project"**
2. Import same GitHub repository
3. Give it a different name (e.g., `assettracer-staging`)
4. Configure with staging env vars

**Option B - Use Same Project (Not Recommended):**
- Set production branch to `main`
- Add staging domain as additional domain
- Use branch-specific environment variables

### Issue: "Changes deploy to both environments"

**Solution**: Check that:
1. Each project has different production branch
2. Environment variables are different
3. You're pushing to the correct branch

### Issue: "Preview URLs still showing"

**Solution**: 
- Preview URLs (like `git-main-...`) are normal
- Use the main domain URLs for testing
- You can disable preview deployments in Git settings

---

## 🎯 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Staging Supabase**: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw
- **Production Supabase**: https://supabase.com/dashboard/project/[your-prod-ref]

---

## ✨ After Configuration

Once configured, your workflow becomes:

```bash
# Daily development
git checkout staging
# ... make changes ...
git commit -m "New feature"
git push origin staging
# → Auto-deploys to STAGING ONLY

# After testing, promote to production
git checkout main
git merge staging
git push origin main
# → Auto-deploys to PRODUCTION ONLY
```

---

**Do this configuration NOW before continuing!**

