# Vercel Root Directory Configuration Fix

## 🎯 Issue

Vercel build is failing with:
```
Error: The file "/vercel/path0/asset-tracer/next/routes-manifest.json" couldn't be found.
```

This happens because the Next.js app is in the `asset-tracer` subdirectory, but Vercel is looking for build outputs in the wrong location.

---

## ✅ Solution: Configure Root Directory in Vercel Dashboard

### Step 1: Go to Project Settings

1. Open your Vercel dashboard: https://vercel.com/dashboard
2. Click on your **AssetTracer** project
3. Click **Settings** (top navigation)

### Step 2: Update Root Directory

1. In the left sidebar, click **General**
2. Scroll down to **Build & Development Settings**
3. Find **Root Directory**
4. Click **Edit** next to Root Directory
5. Enter: `asset-tracer`
6. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click the **...** (three dots) menu
4. Click **Redeploy**
5. **IMPORTANT**: Uncheck "Use existing Build Cache"
6. Click **Redeploy**

---

## 📋 Expected Settings

After configuration, your settings should be:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `asset-tracer` |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` (auto-detected) |

---

## 🔍 Why This Works

When you set the Root Directory to `asset-tracer`:

1. Vercel will `cd` into `asset-tracer` directory first
2. Then run `npm install` (finds `asset-tracer/package.json`)
3. Then run `npm run build` (executes `next build --turbopack`)
4. Build outputs go to `asset-tracer/.next/`
5. Vercel can now find `routes-manifest.json` at the correct path

---

## ✅ Verification

After redeployment, you should see in the build log:

```bash
✓ Compiled successfully
✓ Generating static pages (51/51)
✓ Finalizing page optimization
✓ Build completed successfully
```

**No more "routes-manifest.json not found" error!** ✅

---

## 🚀 Next Steps After Successful Deployment

1. **Add Environment Variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `POLAR_API_KEY`
   - `POLAR_PRO_PRICE_ID`
   - `POLAR_BUSINESS_PRICE_ID`
   - `RESEND_API_KEY`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL`

2. **Configure Webhooks**:
   - Polar webhook: `https://your-domain.vercel.app/api/webhooks/polar`

3. **Test Your Live App**:
   - Visit your Vercel URL
   - Test login/signup
   - Test subscription flow

---

## 📞 Support

If you still see errors after following these steps:
1. Check the Vercel build logs for the exact error
2. Verify the Root Directory is set to `asset-tracer`
3. Ensure you unchecked "Use existing Build Cache" when redeploying

---

**Last Updated**: 2024-10-22  
**Status**: Ready to deploy! 🚀

