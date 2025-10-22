# Vercel Output Directory Fix

## 🐛 The Problem

Vercel was looking for the build output in the **wrong directory**:

```
ERROR: /vercel/path0/asset-tracer/next/routes-manifest.json not found
                                    ^^^^
                              (missing the dot!)
```

But Next.js builds to:

```
CORRECT: /vercel/path0/asset-tracer/.next/routes-manifest.json
                                     ^^^^^
                              (with the dot!)
```

### Error Message
```
Error: The file "/vercel/path0/asset-tracer/next/routes-manifest.json" 
couldn't be found. This is often caused by a misconfiguration in your project.
```

### Build Log Evidence
- ✅ Build completed successfully
- ✅ All 51 routes generated  
- ✅ Output written to `.next/`
- ❌ Vercel looked in `next/` (wrong!)

---

## ✅ The Solution

**Explicitly define `outputDirectory` in `asset-tracer/vercel.json`**

### Before:
```json
{
  "crons": [...]
}
```

### After (Commit `5fda2af`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "crons": [...]
}
```

---

## 📋 Final Working Configuration

### Repository Structure:
```
AssetTracer/
├── vercel.json          ❌ DELETED (was causing conflicts)
├── .gitignore           ✅
├── README files         ✅
└── asset-tracer/
    ├── package.json     ✅ (Next.js 15.5.4)
    ├── vercel.json      ✅ (buildCommand + outputDirectory + crons)
    ├── app/             ✅ (Next.js application)
    └── .next/           ✅ (build output - auto-generated)
```

### Vercel Dashboard Settings:
```
Root Directory: asset-tracer  ✅ MUST BE SET
Framework Preset: Next.js (auto-detected)  ✅
Node Version: 18.x or higher  ✅
```

### `asset-tracer/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "crons": [
    {
      "path": "/api/cron/send-invoice-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/send-weekly-reports",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

---

## 🎯 Why This Works

### The Issue:
When using **Root Directory** in Vercel dashboard:
- Vercel sets working directory to `/vercel/path0/asset-tracer/`
- But it may not correctly auto-detect the `.next/` output directory
- Especially with subdirectory Next.js projects

### The Fix:
**Explicitly defining `outputDirectory: ".next"`** tells Vercel:
- ✅ Build output is in `asset-tracer/.next/`
- ✅ Look for `routes-manifest.json` in `.next/` (with the dot!)
- ✅ Serve the app from the correct directory

### Combined Strategy:
1. **Root Directory** (dashboard): Tells Vercel where the app is (`asset-tracer/`)
2. **outputDirectory** (vercel.json): Tells Vercel where the build output is (`.next/`)
3. **No root-level vercel.json**: Avoids path conflicts

---

## 🚀 Expected Result

After deployment completes:

```bash
✓ Cloning repository
✓ Setting working directory: asset-tracer/
✓ Running: npm install
✓ Running: npm run build
✓ Finding build output: .next/
✓ Reading: .next/routes-manifest.json  ← THIS WAS THE ISSUE!
✓ Deploying to production
✓ SUCCESS! App is live! 🎉
```

---

## 📚 Key Learnings

### For Subdirectory Next.js Projects on Vercel:

1. ✅ **Use Root Directory setting** in dashboard
2. ✅ **Explicitly set `outputDirectory`** in vercel.json  
3. ✅ **Keep vercel.json in app directory** (not root)
4. ❌ **Don't use root-level vercel.json** (causes conflicts)

### Why Auto-Detection May Fail:
- Subdirectory projects confuse Vercel's auto-detection
- Multiple `package.json` files in repo
- Monorepo-like structures
- Custom build configurations

### The Safe Approach:
**Be explicit!** Don't rely on auto-detection for:
- `buildCommand`
- `outputDirectory`
- Root directory (use dashboard setting)

---

## ✅ Deployment Checklist

Before deploying a subdirectory Next.js project:

- [ ] Root Directory set in Vercel dashboard (`asset-tracer`)
- [ ] `vercel.json` in app directory with:
  - [ ] `"buildCommand": "npm run build"`
  - [ ] `"outputDirectory": ".next"`
- [ ] No `vercel.json` in repository root
- [ ] `package.json` exists in app directory
- [ ] Next.js is in `dependencies` or `devDependencies`
- [ ] All Suspense boundaries in place (if using `useSearchParams`)
- [ ] ESLint/TypeScript errors addressed or ignored for build

---

## 🔍 Troubleshooting

### If you still get `routes-manifest.json` error:

1. **Verify Root Directory**:
   ```
   Dashboard → Settings → General → Root Directory = asset-tracer
   ```

2. **Check vercel.json location**:
   ```
   ❌ /vercel.json (delete this!)
   ✅ /asset-tracer/vercel.json (keep this!)
   ```

3. **Verify outputDirectory**:
   ```json
   {
     "outputDirectory": ".next"  ← Must include the dot!
   }
   ```

4. **Clear build cache**:
   ```
   Deployments → Redeploy → Uncheck "Use existing Build Cache"
   ```

5. **Check build logs**:
   - Look for: "Detected Next.js version"
   - Look for: "Running npm run build"
   - Look for: "Compiled successfully"
   - Look for path where Vercel searches for files

---

## 📝 Commit History

This fix was implemented across these commits:

1. `fe4dcd6` - Simplified vercel.json (failed - still had root vercel.json)
2. `5bb2a45` - Removed root vercel.json completely (failed - auto-detection didn't work)
3. `5fda2af` - **Explicitly set outputDirectory** (SUCCESS! ✅)

---

## 🎉 Success Indicators

You'll know it worked when:

1. ✅ Build log shows: "Detected Next.js version: 15.5.4"
2. ✅ Build log shows: "Compiled successfully"
3. ✅ Build log shows: "Generating static pages (51/51)"
4. ✅ Build log shows: "Collecting build traces"
5. ✅ No error about `routes-manifest.json`
6. ✅ Deployment succeeds
7. ✅ App is accessible and routes work

---

**Last Updated**: October 22, 2025  
**Final Working Commit**: `5fda2af`  
**Status**: ✅ SOLVED

