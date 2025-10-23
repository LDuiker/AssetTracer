# 🚀 Staging Environment Setup Guide

This guide will help you set up a complete staging environment for AssetTracer.

---

## 📋 What You'll Need

Before starting, gather these credentials:

### 1. **Supabase Staging Project**
- ✅ You already have: `https://ougntjrrskfsuognjmcw.supabase.co`
- Get from: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/settings/api
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon key)
  - `SUPABASE_SERVICE_ROLE_KEY` (service_role key)

### 2. **Resend Email Account**
- Option A: Use same account with test mode
- Option B: Create separate staging account
- Get from: https://resend.com/api-keys

### 3. **Polar Sandbox Account**
- ⚠️ **IMPORTANT**: Use SANDBOX, not production
- Dashboard: https://sandbox.polar.sh/dashboard
- API Key: https://sandbox.polar.sh/settings
- Create test products and get Price IDs

---

## 🛠️ Option 1: Automated Setup (Recommended)

Run the PowerShell setup script:

```powershell
# From project root
.\setup-staging-env.ps1
```

This will:
1. ✅ Generate a secure `CRON_SECRET`
2. ✅ Prompt you for all required values
3. ✅ Create `asset-tracer/.env.staging` file
4. ✅ Show you a summary of what's configured
5. ✅ Provide next steps

---

## 🛠️ Option 2: Manual Setup

### Step 1: Copy Template

```powershell
Copy-Item ENV-STAGING-TEMPLATE.txt asset-tracer\.env.staging
```

### Step 2: Generate CRON_SECRET

```powershell
.\generate-cron-secret.ps1
```

Copy the generated value.

### Step 3: Edit `.env.staging`

Open `asset-tracer/.env.staging` and fill in all values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Resend
RESEND_API_KEY=re_your_key_here

# Polar (SANDBOX)
POLAR_API_KEY=polar_oat_your_sandbox_key_here
POLAR_PRO_PRICE_ID=price_id_here
POLAR_BUSINESS_PRICE_ID=price_id_here

# Cron
CRON_SECRET=paste_generated_secret_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=staging
```

---

## 🗄️ Database Setup

Your staging database (`ougntjrrskfsuognjmcw`) already has 14 tables. To ensure it's up-to-date:

### Verify Schema

Run in Supabase SQL Editor:

```sql
-- Check table count
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';
-- Should return 14
```

### Apply Migrations (if needed)

If any tables are missing, run these in order:

1. **`asset-tracer/supabase/complete-schema.sql`** - Base 8 tables
2. **`asset-tracer/supabase/CREATE-QUOTATIONS-TABLES.sql`** - Quotations tables
3. **`asset-tracer/supabase/ADD-TEAM-MANAGEMENT.sql`** - Team features
4. **`asset-tracer/supabase/ADD-SUBSCRIPTION-TIER.sql`** - Subscription columns
5. **`CREATE-3-MISSING-TABLES.sql`** - inventory_items, organization_members, subscriptions

### Apply RLS Policies

Run in Supabase SQL Editor:

```sql
-- Apply comprehensive RLS policies
```

**File**: `FIX-RLS-POLICIES-V2.sql`

### Install OAuth Trigger

Run in Supabase SQL Editor:

```sql
-- Install auto-provisioning trigger
```

**File**: `INSTALL-OAUTH-TRIGGER-NOW.sql`

### Configure OAuth (Optional for staging)

If you want to test Google OAuth in staging:

1. Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/providers
2. Enable Google provider
3. Add OAuth credentials (can use same as production)
4. Set redirect URLs:
   - Site URL: `http://localhost:3000` (or your staging domain)
   - Redirect URLs: `http://localhost:3000/auth/callback`

---

## 🧪 Testing Locally

### Start the Server

```powershell
cd asset-tracer
npm run dev
```

### Verify Environment

1. Open browser to `http://localhost:3000`
2. Check console for Polar client initialization
3. Try signing up / logging in
4. Create a test quotation
5. Convert it to an invoice

### Test Features

- ✅ Sign up / Login (OAuth or email)
- ✅ Create assets, clients, invoices
- ✅ Create quotations
- ✅ Convert quotation to invoice
- ✅ Subscribe to Pro plan (Polar sandbox - no real payment)
- ✅ Invite team members
- ✅ Receive email notifications (if Resend configured)

---

## ☁️ Deploy to Vercel Staging

### Option 1: Separate Project

1. Create new Vercel project for staging
2. Link to same GitHub repo
3. Set root directory: `asset-tracer`
4. Add all environment variables from `.env.staging`
5. Set environment to: **Staging**
6. Deploy from `staging` branch (if you have one)

### Option 2: Preview Deployments

1. Push to any branch (not `main`)
2. Vercel creates preview deployment automatically
3. Add staging env vars to **Preview** environment in Vercel
4. Test the preview URL

### Add Environment Variables to Vercel

Go to: Vercel Dashboard → Settings → Environment Variables

Add each variable from `.env.staging`:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ougnt...` | Staging |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Staging |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Staging |
| `RESEND_API_KEY` | `re_...` | Staging |
| `POLAR_API_KEY` | `polar_oat_...` | Staging |
| `POLAR_PRO_PRICE_ID` | `price_...` | Staging |
| `POLAR_BUSINESS_PRICE_ID` | `price_...` | Staging |
| `CRON_SECRET` | `your_secret` | Staging |
| `NEXT_PUBLIC_APP_URL` | `https://staging...` | Staging |
| `NODE_ENV` | `staging` | Staging |

---

## 🔐 Polar Sandbox Setup

### Create Sandbox Account

1. Go to: https://sandbox.polar.sh
2. Sign up for free
3. Get API key from: https://sandbox.polar.sh/settings

### Create Test Products

1. Go to: https://sandbox.polar.sh/dashboard/products
2. Create "Pro Plan":
   - Name: `AssetTracer Pro (Staging)`
   - Price: $10/month (any amount - it's test mode)
   - Copy the Price ID → `POLAR_PRO_PRICE_ID`
3. Create "Business Plan":
   - Name: `AssetTracer Business (Staging)`
   - Price: $20/month
   - Copy the Price ID → `POLAR_BUSINESS_PRICE_ID`

### Test Payments

Use Polar's test card:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**No real money is charged in sandbox mode!**

---

## 📊 Monitoring & Debugging

### Check Logs

**Vercel Logs:**
```
Vercel Dashboard → Project → Logs
```

**Supabase Logs:**
```
Supabase Dashboard → Logs & Reports
```

### Common Issues

#### 1. "Organization not found" after login
**Cause**: OAuth trigger not installed  
**Fix**: Run `INSTALL-OAUTH-TRIGGER-NOW.sql` in staging

#### 2. 500 errors when accessing data
**Cause**: RLS policies too restrictive  
**Fix**: Run `FIX-RLS-POLICIES-V2.sql` in staging

#### 3. Quotation conversion fails
**Cause**: Missing RLS policy on invoice_items  
**Fix**: Run `FIX-INVOICE-ITEMS-RLS.sql` in staging

#### 4. Polar checkout doesn't work
**Cause**: Using production API instead of sandbox  
**Fix**: Verify `POLAR_API_KEY` starts with `polar_oat_` and is from sandbox

---

## ✅ Staging Checklist

Before considering staging ready:

- [ ] `.env.staging` created with all values
- [ ] Supabase staging project has all 14 tables
- [ ] RLS policies applied and tested
- [ ] OAuth trigger installed
- [ ] Google OAuth configured (optional)
- [ ] Polar sandbox products created
- [ ] Local testing passed
- [ ] Vercel deployment successful
- [ ] Test sign-up works
- [ ] Test quotation → invoice conversion
- [ ] Test Polar subscription (sandbox)
- [ ] Test email notifications (if enabled)

---

## 🎯 Staging vs Production

| Aspect | Staging | Production |
|--------|---------|------------|
| **Supabase** | `ougntjrrskfsuognjmcw` | Your prod project |
| **Polar** | Sandbox (no real $$$) | Live (real payments) |
| **Domain** | `staging.asset-tracer.com` | `www.asset-tracer.com` |
| **Data** | Test data, safe to delete | Real user data |
| **Purpose** | Testing new features | Live for users |

---

## 🚀 Next Steps

Once staging is working:

1. ✅ Test all features thoroughly
2. ✅ Invite team members to test
3. ✅ Fix any bugs found
4. ✅ Deploy tested changes to production
5. ✅ Monitor production logs

---

## 📞 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review Vercel and Supabase logs
3. Run diagnostic scripts:
   - `DIAGNOSE-OAUTH-ISSUE.sql`
   - `DIAGNOSE-QUOTATION-CONVERSION.sql`
   - `TEST-RLS-AS-USER.sql`

---

**Created**: October 23, 2025  
**Status**: Ready for setup  
**Environment**: Staging

