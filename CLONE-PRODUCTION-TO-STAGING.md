# 🔄 Clone Production Database to Staging

## Overview
This guide will help you clone your production Supabase database to create a fresh staging environment.

---

## 📋 Prerequisites

- **Production Database**: Your existing production Supabase project
- **Staging Database**: Project `ougntjrrskfsuognjmcw` on Supabase (or create new one)
- Access to both Supabase dashboards
- SQL scripts in this repository

---

## 🎯 Quick Start

### Option 1: Export Schema from Production (Recommended)

This creates a clean staging environment with the same schema but no production data.

### Option 2: Clone Schema + Data

This copies both schema and data (use for testing with real data scenarios).

---

## 🚀 Step-by-Step Instructions

### Step 1: Access Your Staging Supabase Project

1. Go to https://supabase.com/dashboard
2. Select project: `ougntjrrskfsuognjmcw` (or create a new one)
3. Note down:
   - **Project URL**: `https://ougntjrrskfsuognjmcw.supabase.co`
   - **Anon Key**: (Settings → API)
   - **Service Role Key**: (Settings → API)

---

### Step 2: Export Production Schema

1. Go to your **Production** Supabase project dashboard
2. Click **Database** → **Migrations** → **Export Schema**
3. Or use the SQL script: `EXPORT-PRODUCTION-SCHEMA.sql`

Alternatively, use the migration files in order (see below).

---

### Step 3: Run Staging Setup Script

**Run this script in your STAGING database:**

```sql
-- File: SETUP-STAGING-FROM-PRODUCTION.sql
```

This will:
- ✅ Create all 14 tables with correct schema
- ✅ Install OAuth trigger for Google sign-in
- ✅ Set up RLS policies
- ✅ Create necessary functions
- ✅ Set up storage buckets

---

### Step 4: Verify Schema

Run this verification script:

```sql
-- File: VERIFY-STAGING-SCHEMA.sql
```

Expected tables:
1. users
2. organizations  
3. assets
4. clients
5. expenses
6. invoices
7. invoice_items
8. quotations
9. quotation_items
10. transactions
11. inventory_items
12. organization_members
13. team_invitations
14. subscriptions

---

### Step 5: Configure Supabase Auth Settings

**In STAGING Supabase Dashboard:**

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://assettracer-staging.vercel.app`
3. Set **Redirect URLs**:
   ```
   https://assettracer-staging.vercel.app/**
   https://assettracer-staging.vercel.app/auth/callback
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

4. Go to **Authentication** → **Providers** → **Google**
5. Enable Google OAuth
6. Use same credentials as production (or separate test app)

---

### Step 6: Update Vercel Environment Variables

1. Go to Vercel Dashboard
2. Select your staging project
3. Go to **Settings** → **Environment Variables**
4. Update:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
   ```

---

### Step 7: Force Vercel Redeploy

1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment → **"..."** menu
3. Click **Redeploy**
4. **UNCHECK** "Use existing Build Cache"
5. Click **Redeploy**

---

### Step 8: Test Staging

1. Open **incognito/private browser window**
2. Go to: `https://assettracer-staging.vercel.app`
3. Click "Sign in with Google"
4. **Expected behavior**:
   - ✅ Redirects to Google
   - ✅ Redirects back to staging
   - ✅ Creates user profile automatically
   - ✅ Redirects to dashboard
   - ✅ Dashboard shows empty state

---

## 📄 Migration Scripts to Run (In Order)

If you prefer to run migrations manually instead of the all-in-one script:

### Core Schema (Required)
1. `asset-tracer/supabase/tables-schema.sql`
2. `asset-tracer/supabase/functions.sql`
3. `INSTALL-OAUTH-TRIGGER-NOW.sql`
4. `FIX-RLS-POLICIES-V2.sql`

### Additional Features (Required)
5. `asset-tracer/supabase/CREATE-QUOTATIONS-TABLES.sql`
6. `asset-tracer/supabase/ADD-ASSET-ID-TO-QUOTATION-ITEMS.sql`
7. `asset-tracer/supabase/ADD-CONVERTED-TO-INVOICE-COLUMN.sql`
8. `COMPLETE-POLAR-MIGRATION.sql`
9. `ADD-EMAIL-NOTIFICATIONS.sql`
10. `asset-tracer/supabase/ADD-TEAM-MANAGEMENT.sql`

### Optional Enhancements
11. `asset-tracer/supabase/ADD-COMPANY-PROFILE-FIELDS.sql`
12. `asset-tracer/supabase/CREATE-COMPANY-LOGOS-BUCKET.sql`
13. `asset-tracer/supabase/ADD-ORGANIZATION-SETTINGS.sql`

---

## 🔄 Alternative: Use Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to production
supabase link --project-ref YOUR_PROD_PROJECT_REF

# Generate migrations from production
supabase db dump --schema public > production-schema.sql

# Link to staging
supabase link --project-ref ougntjrrskfsuognjmcw

# Apply to staging
supabase db push
```

---

## 🗂️ What Gets Cloned

### ✅ Schema (Structure)
- All table definitions
- All column types and constraints
- All indexes
- All functions
- All triggers
- All RLS policies

### ❌ Data (Not Cloned by Default)
- User accounts
- Organizations
- Assets
- Invoices/Quotations
- Any production data

**Why?** Staging should start clean with test data only.

---

## 🧪 Optional: Copy Production Data

**⚠️ Warning**: Only do this if you need to test with real data.

```sql
-- This copies data from production to staging
-- Run carefully!

-- Copy organizations
INSERT INTO organizations 
SELECT * FROM production.organizations;

-- Copy users
INSERT INTO users 
SELECT * FROM production.users;

-- etc...
```

**Better approach**: Create test data in staging instead.

---

## 🛡️ Security Checklist

Before testing:

- ✅ Staging uses separate Supabase project
- ✅ Staging uses separate environment variables in Vercel
- ✅ OAuth trigger is installed (`INSTALL-OAUTH-TRIGGER-NOW.sql`)
- ✅ RLS policies are enabled (`FIX-RLS-POLICIES-V2.sql`)
- ✅ Supabase redirect URLs point to staging URL
- ✅ Polar is in SANDBOX mode (`NEXT_PUBLIC_POLAR_SANDBOX=true`)

---

## 🔧 Troubleshooting

### Issue: "Table does not exist"
**Solution**: Run `asset-tracer/supabase/tables-schema.sql` first

### Issue: "Redirect loop after login"
**Solution**: 
1. Check OAuth trigger is installed
2. Check RLS policies are correct
3. Check Supabase redirect URLs

### Issue: "Organization not found"
**Solution**: 
1. Run `INSTALL-OAUTH-TRIGGER-NOW.sql`
2. Delete test user from `auth.users`
3. Try signing in again

### Issue: "500 error on dashboard"
**Solution**: Check RLS policies - run `FIX-RLS-POLICIES-V2.sql`

### Issue: Vercel shows old code
**Solution**: Force redeploy with cache UNCHECKED

---

## 📊 Database Comparison

| Aspect | Production | Staging |
|--------|-----------|---------|
| **Project** | Production Project | ougntjrrskfsuognjmcw |
| **URL** | asset-tracer.com | assettracer-staging.vercel.app |
| **Data** | Real users | Test data only |
| **Polar** | Live mode | Sandbox mode |
| **Emails** | Real emails | Test emails |
| **Backups** | Critical | Optional |

---

## ✅ Final Checklist

Before going live with staging:

- [ ] Schema cloned successfully
- [ ] OAuth trigger installed
- [ ] RLS policies applied
- [ ] Supabase auth URLs configured
- [ ] Vercel environment variables updated
- [ ] Vercel redeployed (cache OFF)
- [ ] Test login works
- [ ] Dashboard loads
- [ ] Can create assets
- [ ] Can create quotations
- [ ] Webhooks configured (if testing subscriptions)

---

## 🎉 Success!

Your staging environment should now be:
- ✅ Identical schema to production
- ✅ Clean database (no production data)
- ✅ Fully functional
- ✅ Safe for testing
- ✅ Ready for QA

---

## 📚 Related Documents

- `DEPLOYMENT-GUIDE.md` - Full deployment documentation
- `STAGING-FIX-CHECKLIST.md` - Troubleshooting guide
- `NUCLEAR-FIX-STAGING-NOW.sql` - Emergency reset script
- `PRODUCTION-DATABASE-SETUP.md` - Production setup reference

---

**Need help?** Check the troubleshooting section or run the verification scripts.

