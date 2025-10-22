# Vercel Subdirectory Project Fix

## 🎯 Issue Summary

AssetTracer is a Next.js app located in the `asset-tracer/` subdirectory, not the repository root. This caused deployment errors:

1. ❌ `routes-manifest.json not found` (path resolution issues)
2. ❌ `No Next.js version detected` (framework detection issues)

## ✅ Solution: Use Root Directory Setting ONLY

After testing multiple approaches, the correct solution is:

**Use ONLY the Vercel dashboard "Root Directory" setting**

Do NOT use:
- ❌ Root-level `vercel.json` with custom paths
- ❌ Custom `buildCommand` or `installCommand`
- ❌ Custom `outputDirectory`

---

## 🛠️ Step-by-Step Fix

### 1. Configure Root Directory in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click on your **AssetTracer** project
3. Click **Settings** (top navigation)
4. Click **General** (left sidebar)
5. Scroll to **"Build & Development Settings"**
6. Find **"Root Directory"**
7. Click **"Edit"**
8. Enter: `asset-tracer`
9. Click **"Save"**

### 2. Verify Settings

After saving, your settings should look like:

```
Framework Preset:     Next.js (auto-detected)
Root Directory:       asset-tracer
Build Command:        (leave default - auto-detected)
Output Directory:     (leave default - auto-detected)
Install Command:      (leave default - auto-detected)
```

### 3. Redeploy

1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click the **"..."** (three dots) menu
4. Click **"Redeploy"**
5. **⚠️ UNCHECK** "Use existing Build Cache"
6. Click **"Redeploy"**

---

## ✅ Why This Works

When you set **Root Directory** to `asset-tracer`:

```
1. Vercel clones: github.com/LDuiker/AssetTracer
2. Vercel changes directory: cd asset-tracer/
3. Vercel finds: package.json ✅
4. Vercel detects: Next.js 15.5.4 ✅
5. Vercel runs: npm install ✅
6. Vercel runs: npm run build ✅
7. Vercel finds output: .next/ ✅
8. Vercel deploys: SUCCESS! 🎉
```

---

## 🚫 What We Tried (That Didn't Work)

### Attempt 1: Root-level vercel.json with explicit commands
```json
{
  "buildCommand": "cd asset-tracer && npm run build",
  "installCommand": "cd asset-tracer && npm install",
  "outputDirectory": "asset-tracer/.next"
}
```
**Result**: ❌ Framework detection failed

### Attempt 2: Clear Root Directory + root vercel.json
**Result**: ❌ Path resolution issues

### Attempt 3: Root Directory + root vercel.json
**Result**: ❌ Configuration conflicts

### Solution: Only Root Directory setting
**Result**: ✅ **WORKS!**

---

## 📋 Configuration Files

### Root Level
```
AssetTracer/
├── .gitignore
├── README.md
└── asset-tracer/          ← Next.js app here
    ├── package.json       ← Next.js defined here
    ├── next.config.ts
    ├── app/
    ├── components/
    └── vercel.json        ← Only for cron jobs
```

### asset-tracer/vercel.json (Final Version)
```json
{
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

**Note**: No `buildCommand`, `installCommand`, or `outputDirectory` needed!

---

## 🔍 Troubleshooting

### If you still see "routes-manifest.json not found"

1. Verify Root Directory is set to `asset-tracer` (not empty, not `.`)
2. Redeploy WITHOUT cache
3. Check build log shows: `Detected Next.js version: 15.5.4`

### If you see "No Next.js version detected"

1. Verify `asset-tracer/package.json` has `"next"` in dependencies
2. Verify Root Directory is set to `asset-tracer`
3. Remove any root-level `vercel.json` if it exists

### If build succeeds but routes fail

1. Check that output is NOT going to `asset-tracer/next/` (wrong)
2. Should be: `asset-tracer/.next/` (correct)

---

## ✅ Expected Build Log (Success)

```bash
✓ Cloning github.com/LDuiker/AssetTracer (Commit: b8e83c4)
✓ Running "vercel build"
✓ Detected Next.js version: 15.5.4
✓ Running "install" command: npm install
✓ added 664 packages in 18s
✓ Running "build" command: npm run build
✓ Compiled successfully in 33.9s
✓ Generating static pages (51/51)
✓ Finalizing page optimization
✓ Build completed successfully
✓ Deployment Ready
```

---

## 📚 References

- Vercel Docs: [Root Directory](https://vercel.com/docs/concepts/projects/overview#root-directory)
- Vercel Docs: [Monorepos](https://vercel.com/docs/concepts/git/monorepos)
- Next.js Docs: [Deployment](https://nextjs.org/docs/deployment)

---

## 🎉 Final Configuration

| Setting | Value |
|---------|-------|
| **Root Directory** | `asset-tracer` |
| **Framework** | Next.js (auto-detected) |
| **Build Command** | (auto-detected) |
| **Output Directory** | (auto-detected) |
| **Install Command** | (auto-detected) |
| **vercel.json Location** | `asset-tracer/vercel.json` |
| **vercel.json Purpose** | Cron jobs only |

---

**Last Updated**: 2024-10-22  
**Working Commit**: `b8e83c4`  
**Status**: ✅ Ready to deploy!

