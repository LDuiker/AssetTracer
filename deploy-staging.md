# 🚀 Deploy Staging to Vercel

## Current Status
- ✅ Staging branch created: `staging`
- ✅ Environment variables ready
- ✅ Target URL: https://assettracer-staging.vercel.app

---

## Vercel Configuration

### 1. Environment Variables (Preview Environment)

Go to: **Vercel Dashboard → Settings → Environment Variables**

Add these for **Preview** environment:

```
NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91Z250anJyc2tmc3VvZ25qbWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MjE4MzAsImV4cCI6MjA1MzI5NzgzMH0.c2VnVl0xKZqNlCdDmxYN3dMfS3JLxKbCCWyJ5kQglRM
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
RESEND_API_KEY=<your_resend_key>
POLAR_API_KEY=polar_oat_4wgNyL10vdUTUr8xdNYVQOdNuxayBLZGTTQqe1bpvC3
POLAR_PRO_PRICE_ID=15716604-b369-47b2-bc73-90d452a3c9b7
POLAR_BUSINESS_PRICE_ID=ef965b20-266e-4bad-96d3-387a19f2c7c8
CRON_SECRET=esugD/VLx0GaKrP5OJPn0lYnPNGriOS0iBSYvrwIhfA=
NEXT_PUBLIC_APP_URL=https://assettracer-staging.vercel.app
NODE_ENV=staging
```

**Important**: Set environment to **"Preview"**, not "Production"!

---

### 2. Domain Configuration

**Option A: Use Vercel Preview URL**
- Vercel will auto-generate: `assettracer-staging-<hash>.vercel.app`
- No configuration needed
- Update `NEXT_PUBLIC_APP_URL` with this URL after first deploy

**Option B: Custom Domain**
1. Go to: **Settings → Domains**
2. Click **"Add Domain"**
3. Enter: `assettracer-staging.vercel.app`
4. Assign to branch: `staging`

---

### 3. Git Branch Configuration

- **Production Branch**: `main` → Production deployment
- **Preview Branch**: `staging` → Staging deployment
- Vercel will automatically deploy when you push to `staging`

---

### 4. Supabase Configuration

Update OAuth redirect URLs in Supabase:

1. Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration
2. **Site URL**: `https://assettracer-staging.vercel.app`
3. **Redirect URLs**:
   - `https://assettracer-staging.vercel.app/auth/callback`
   - `https://assettracer-staging.vercel.app/*`

---

## Deploy Commands

### Push to Staging Branch
```powershell
git add .
git commit -m "feat: Configure staging environment"
git push origin staging
```

Vercel will automatically deploy!

---

## Verification

After deployment:

1. ✅ Visit: https://assettracer-staging.vercel.app
2. ✅ Sign in with Google OAuth
3. ✅ Dashboard should load with staging data
4. ✅ Try creating a quotation
5. ✅ Test Polar subscription (sandbox - no real payment)

---

## Troubleshooting

### Issue: 404 or Build Error
- Check Vercel build logs
- Verify Root Directory is set to `asset-tracer`
- Check `vercel.json` configuration

### Issue: OAuth Redirect to Wrong URL
- Update Supabase Site URL to match deployment
- Add redirect URLs for staging domain

### Issue: Environment Variables Not Working
- Verify they're set to "Preview" environment, not "Production"
- Redeploy after changing env vars

---

## Staging vs Production

| Aspect | Staging | Production |
|--------|---------|------------|
| **URL** | assettracer-staging.vercel.app | www.asset-tracer.com |
| **Branch** | `staging` | `main` |
| **Database** | ougntjrrskfsuognjmcw (staging) | Production project |
| **Polar** | Sandbox (test payments) | Live (real payments) |
| **Purpose** | Testing new features | Live for users |

---

**Ready to deploy!** Push any changes to the `staging` branch and Vercel will automatically deploy.

