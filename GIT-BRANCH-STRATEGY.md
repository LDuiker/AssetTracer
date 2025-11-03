# 🌿 Git Branch Strategy for Staging & Production

## Overview

This guide explains the recommended Git branch strategy for managing staging and production environments.

---

## 🎯 Recommended Strategy

### Branch Structure
```
main (or master)
├── Deploys to: Production (www.asset-tracer.com)
├── Status: Protected, stable code only
└── Updates: Only from tested staging code

staging (or develop)
├── Deploys to: Staging (assettracer-staging.vercel.app)
├── Status: Active development, testing
└── Updates: From feature branches

feature/* branches
├── Deploys to: Preview URLs (optional)
├── Status: Work in progress
└── Updates: Merge to staging when complete
```

---

## 🔄 Development Workflow

### Daily Development

```bash
# 1. Start new feature
git checkout staging
git pull origin staging
git checkout -b feature/new-feature

# 2. Make changes
# ... code ...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 3. Merge to staging for testing
git checkout staging
git merge feature/new-feature
git push origin staging
# → Auto-deploys to staging.vercel.app

# 4. Test on staging
# Visit: https://assettracer-staging.vercel.app
# Test all features thoroughly

# 5. If tests pass, promote to production
git checkout main
git merge staging
git push origin main
# → Auto-deploys to production

# 6. Tag release (optional but recommended)
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0
```

---

## 🚨 Hotfix Workflow

For urgent production fixes:

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix the issue
# ... fix code ...
git add .
git commit -m "Fix critical bug"

# 3. Merge to main (production)
git checkout main
git merge hotfix/critical-bug
git push origin main
# → Deploys to production immediately

# 4. Also merge back to staging to keep in sync
git checkout staging
git merge hotfix/critical-bug
git push origin staging
# → Updates staging

# 5. Tag the hotfix
git tag -a v1.2.1 -m "Hotfix: critical bug"
git push origin v1.2.1
```

---

## 📋 Branch Protection Rules

### Recommended Settings on GitHub

**Main Branch:**
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass (CI/CD)
- ✅ Require branches to be up to date
- ✅ Include administrators
- ❌ Allow force pushes

**Staging Branch:**
- ✅ Require status checks to pass (optional)
- ✅ Allow direct pushes (for faster development)
- ❌ Strict review requirements

---

## ⚙️ Vercel Configuration

### Staging Project Settings

**Project:** `assettracer-staging`

**Git Settings:**
- Production Branch: `staging`
- Deploy Previews: Enabled for all branches
- Auto-deploy: Enabled

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
POLAR_API_KEY=<sandbox-api-key>
NEXT_PUBLIC_POLAR_SANDBOX=true
NEXT_PUBLIC_ENV=staging
```

**Domains:**
- Primary: `assettracer-staging.vercel.app`

---

### Production Project Settings

**Project:** `assettracer` or `assettracer-production`

**Git Settings:**
- Production Branch: `main`
- Deploy Previews: Disabled or only for PRs
- Auto-deploy: Enabled

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://<prod-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
POLAR_API_KEY=<live-api-key>
NEXT_PUBLIC_POLAR_SANDBOX=false
NEXT_PUBLIC_ENV=production
```

**Domains:**
- Primary: `www.asset-tracer.com`
- Alias: `asset-tracer.com`

---

## 🧪 Testing Strategy

### On Staging (Before Merging to Main)

Test these features:
- ✅ New features work as expected
- ✅ No regressions in existing features
- ✅ Database migrations successful
- ✅ OAuth/Authentication works
- ✅ Payments work (sandbox mode)
- ✅ Email notifications send
- ✅ Performance is acceptable
- ✅ Mobile responsive
- ✅ No console errors

### On Production (After Deploy)

Quick smoke tests:
- ✅ Homepage loads
- ✅ Login works
- ✅ Dashboard loads
- ✅ Critical features functional
- ✅ No 500 errors

---

## 🔄 Keeping Branches in Sync

### Regular Sync (Recommended: Weekly)

```bash
# Ensure staging has all production fixes
git checkout staging
git merge main
git push origin staging

# Or use rebase for cleaner history
git checkout staging
git rebase main
git push origin staging --force-with-lease
```

### After Production Hotfix

Always merge hotfix back to staging:
```bash
git checkout staging
git merge main
git push origin staging
```

---

## 📊 Deployment Flow Diagram

```
┌─────────────────┐
│ Feature Branch  │
└────────┬────────┘
         │ merge
         ↓
┌─────────────────┐       ┌──────────────────┐
│ Staging Branch  │──────→│ Staging Deploy   │
└────────┬────────┘       └──────────────────┘
         │ test & merge
         ↓
┌─────────────────┐       ┌──────────────────┐
│  Main Branch    │──────→│ Production Deploy│
└─────────────────┘       └──────────────────┘
```

---

## 🛠️ Quick Setup Script

Run this to create your staging branch:

```powershell
.\setup-staging-branch.ps1
```

This script will:
1. Create staging branch from main
2. Push to GitHub
3. Give you configuration instructions

---

## 📝 Common Commands

### Switch Branches
```bash
git checkout staging      # Switch to staging
git checkout main         # Switch to main
git checkout -b feature/x # Create new feature branch
```

### Update Branch
```bash
git pull origin staging   # Update staging
git pull origin main      # Update main
```

### Merge Changes
```bash
# Merge staging into main (for production release)
git checkout main
git merge staging
git push origin main

# Merge main into staging (to sync after hotfix)
git checkout staging
git merge main
git push origin staging
```

### View Branches
```bash
git branch                # List local branches
git branch -r             # List remote branches
git branch -a             # List all branches
```

### Delete Feature Branch
```bash
# After merging to staging
git branch -d feature/new-feature        # Delete local
git push origin --delete feature/new-feature  # Delete remote
```

---

## ⚠️ Important Considerations

### Why NOT to Use Main for Both?

1. **No Safety Net**: Changes go straight to production
2. **Can't Test First**: No way to validate before production
3. **Risky Rollbacks**: Have to revert commits on main
4. **No Experimentation**: Can't try things on staging first
5. **Confusing**: Staging and production show same code always

### Why Use Separate Branches?

1. **Safety**: Test everything on staging first
2. **Flexibility**: Can have different code on staging
3. **Rollback**: Easy to roll back staging without affecting production
4. **Confidence**: Know production code is tested
5. **Industry Standard**: Best practice used by most teams

---

## 🎯 Current Situation & Recommendation

### Your Current Setup (Likely)
```
Both environments on main branch
├── Staging: git-main-... URL (preview)
└── Production: main URL

Problem: Changes deploy to both at once
```

### Recommended Setup
```
Separate branches
├── Staging: staging branch → assettracer-staging.vercel.app
└── Production: main branch → www.asset-tracer.com

Benefit: Test on staging before production
```

---

## 🚀 Action Items

To implement proper branch strategy:

1. **Create staging branch**: Run `setup-staging-branch.ps1`
2. **Configure Vercel**: Set production branch for each project
3. **Update Supabase**: Configure auth URLs for each environment
4. **Test workflow**: Make a change on staging → test → merge to main
5. **Document**: Update your team on the new workflow

---

## 📚 Resources

- [Git Flow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Vercel Git Integration](https://vercel.com/docs/concepts/git)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)

---

**Ready to set up proper branching?** Run `.\setup-staging-branch.ps1` to get started!

