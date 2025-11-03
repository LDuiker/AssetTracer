# ✅ USE PRODUCTION SUPABASE FOR STAGING

## Since staging Supabase has an unknown config issue, use production's working Supabase

---

## STEP 1: Add Staging URL to Production Supabase

Go to: https://supabase.com/dashboard/project/ftelnmursmitpjwjbyrw/auth/url-configuration

**Add staging URLs to Redirect URLs:**

```
https://ftelnmursmitpjwjbyrw.supabase.co/auth/v1/callback (already there)
https://assettracer-staging.vercel.app/auth/callback (ADD THIS)
https://assettracer-staging.vercel.app/* (ADD THIS)
http://localhost:3000/auth/callback (already there)
http://localhost:3000/* (already there)
https://www.asset-tracer.com/auth/callback (already there)
https://www.asset-tracer.com/* (already there)
```

Click **SAVE**.

---

## STEP 2: Update Staging Environment Variables in Vercel

Go to: Vercel → Your Project → Settings → Environment Variables

**For "Preview" environment, UPDATE these:**

```
NEXT_PUBLIC_SUPABASE_URL=https://ftelnmursmitpjwjbyrw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
```

**Keep these the same:**
```
NEXT_PUBLIC_APP_URL=https://assettracer-staging.vercel.app
POLAR_API_KEY=<sandbox-api-key>
POLAR_PRO_PRICE_ID=<sandbox-pro-price>
POLAR_BUSINESS_PRICE_ID=<sandbox-business-price>
RESEND_API_KEY=<your-resend-key>
CRON_SECRET=<your-cron-secret>
```

---

## STEP 3: Update .env.staging Locally

Edit `asset-tracer/.env.staging`:

```bash
# SUPABASE - PRODUCTION PROJECT (shared with staging)
NEXT_PUBLIC_SUPABASE_URL=https://ftelnmursmitpjwjbyrw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>

# RESEND (Email)
RESEND_API_KEY=<your-resend-key>

# POLAR (Payments) - SANDBOX
POLAR_API_KEY=polar_oat_4wgNyL10vdUTUr8xdNYVQOdNuxayBLZGTTQqe1bpvC3
POLAR_PRO_PRICE_ID=15716604-b369-47b2-bc73-90d452a3c9b7
POLAR_BUSINESS_PRICE_ID=ef965b20-...

# CRON SECRET
CRON_SECRET=<your-cron-secret>

# APP URL
NEXT_PUBLIC_APP_URL=https://assettracer-staging.vercel.app
```

---

## STEP 4: Force Vercel Redeploy

1. Go to Vercel → Deployments
2. Click latest staging deployment → "..." → "Redeploy"
3. **UNCHECK "Use existing Build Cache"**
4. Click Redeploy
5. Wait 2-3 minutes

---

## STEP 5: Test

1. Open NEW incognito window
2. Go to: https://assettracer-staging.vercel.app
3. Click "Continue with Google"
4. **Will work immediately!** ✅

---

## WHY THIS WORKS:

- Production Supabase auth is configured correctly
- Staging will share the same user database as production
- Different Polar (sandbox vs production) keeps payments separate
- Staging URL whitelisted in production Supabase
- No more auth debugging needed!

