# Git Workflow: Staging to Production

## 🎯 Workflow Overview

**CRITICAL RULE**: All changes must be tested in staging FIRST before merging to production.

```
Feature Branch/Staging → Test → Production (Main)
```

## 📋 Standard Workflow

### Step 1: Make Changes in Staging
```bash
git checkout staging
git pull origin staging
# Make your changes
git add .
git commit -m "Description of changes"
git push origin staging
```

### Step 2: Deploy to Staging Environment
- Vercel should auto-deploy staging branch to staging URL
- Test all functionality thoroughly
- Verify fixes work as expected
- Check for any errors or issues

### Step 3: Only After Testing Passes - Merge to Production
```bash
# Make sure staging is tested and working
git checkout main
git pull origin main
git merge staging -m "Merge tested changes from staging to production"
git push origin main
```

### Step 4: Deploy to Production
- Vercel will auto-deploy main branch to production
- Monitor for any issues
- Check production logs

## 🚫 What NOT to Do

❌ **NEVER** merge staging to production without testing first
❌ **NEVER** make changes directly in main/production
❌ **NEVER** skip staging testing
❌ **NEVER** merge production back into staging (staging should always be ahead)

## ✅ Best Practices

1. **Always test in staging first**
   - Create the change in staging
   - Deploy and test
   - Only merge after verification

2. **Keep staging ahead of production**
   - Staging should have all the latest changes
   - Production should only have tested, verified changes

3. **Use descriptive commit messages**
   - Makes it easier to track what was tested
   - Helps with rollback if needed

4. **Tag releases**
   - Tag production releases for easy rollback
   - Example: `git tag -a v1.0.0 -m "Production release"`

## 🔄 Current Branch Status

**Staging**: Should contain all new development work
**Production (Main)**: Should only contain tested, production-ready code

## 📝 Example Workflow

### Scenario: Fix a bug

1. **Create fix in staging:**
   ```bash
   git checkout staging
   # Make fix
   git add .
   git commit -m "Fix: Quotation error handling"
   git push origin staging
   ```

2. **Test in staging environment:**
   - Deploy to staging
   - Test the fix
   - Verify it works
   - Check logs for errors

3. **After testing passes:**
   ```bash
   git checkout main
   git merge staging -m "Merge tested fix: Quotation error handling"
   git push origin main
   ```

4. **Monitor production:**
   - Check deployment
   - Monitor logs
   - Verify fix works in production

## 🔐 Security Benefits

- ✅ All changes tested before production
- ✅ Reduced risk of production outages
- ✅ Ability to catch issues early
- ✅ Easier rollback if needed
- ✅ Clear separation of environments

## 🚨 Emergency Hotfixes

If you need to fix production immediately:

1. Create hotfix branch from main:
   ```bash
   git checkout main
   git checkout -b hotfix/critical-bug
   ```

2. Make the fix and test quickly:
   ```bash
   # Make fix
   git add .
   git commit -m "Hotfix: Critical production bug"
   git push origin hotfix/critical-bug
   ```

3. Merge hotfix to both main AND staging:
   ```bash
   # Merge to main (production)
   git checkout main
   git merge hotfix/critical-bug
   git push origin main
   
   # Merge to staging (so it has the fix too)
   git checkout staging
   git merge hotfix/critical-bug
   git push origin staging
   ```

4. Delete hotfix branch:
   ```bash
   git branch -d hotfix/critical-bug
   git push origin --delete hotfix/critical-bug
   ```

## 📊 Branch Comparison

Check what's in staging but not in production:
```bash
git log main..staging --oneline
```

Check what's in production but not in staging:
```bash
git log staging..main --oneline
```

(Staging should typically be ahead, meaning staging will have more commits)
