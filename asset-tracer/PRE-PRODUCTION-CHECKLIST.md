# 🚀 Pre-Production Deployment Checklist

**Date:** 2025-11-21  
**Status:** In Progress

---

## ✅ **1. Dependency Security Audit**

### Step 1.1: Run Production Dependency Audit
```bash
npm audit --production
```

**Status:** ✅ **COMPLETE**  
**Expected:** 0 vulnerabilities  
**Result:** ✅ **0 vulnerabilities found**

**Date Completed:** 2025-11-21

### Step 1.2: Run Full Dependency Audit (Including Dev)
```bash
npm audit --audit-level=moderate
```

**Status:** ✅ **COMPLETE**  
**Expected:** 0 critical/high vulnerabilities  
**Result:** ✅ **0 vulnerabilities found**

**Date Completed:** 2025-11-21

### Step 1.3: Fix Any Vulnerabilities
```bash
npm audit fix
```

**Status:** ✅ **COMPLETE**  
**Result:** ✅ **No vulnerabilities to fix - all dependencies are secure**

**Date Completed:** 2025-11-21

---

## ✅ **2. Environment Variables Verification**

### Step 2.1: Verify Vercel Production Environment Variables

**Location:** Vercel Dashboard → Project → Settings → Environment Variables

**Required Variables for Production:**

**Supabase:**
- [x] `NEXT_PUBLIC_SUPABASE_URL` = `https://[production-project].supabase.co` ✅
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (production anon key) ✅
- [x] `SUPABASE_SERVICE_ROLE_KEY` = (production service role key) ✅

**Application:**
- [x] `NEXT_PUBLIC_APP_URL` = `https://www.asset-tracer.com` ✅
- [x] `NEXT_PUBLIC_ENV` = (environment identifier) ✅
- [x] `CRON_SECRET` = (random secret for cron jobs) ✅

**Polar.sh (Billing):**
- [x] `POLAR_API_KEY` = (production Polar API key) ✅
- [x] `NEXT_PUBLIC_POLAR_PRO_PRICE_ID` = (production Pro monthly price ID) ✅
- [x] `NEXT_PUBLIC_POLAR_BUSINESS_PRICE_ID` = (production Business monthly price ID) ✅
- [x] `POLAR_PRO_YEARLY_PRICE_ID` = (production Pro yearly price ID) ✅
- [x] `POLAR_BUSINESS_YEARLY_PRICE_ID` = (production Business yearly price ID) ✅
- [x] `NEXT_PUBLIC_POLAR_ORGANIZATION_ID` = (Polar organization ID) ✅
- [x] `POLAR_WEBHOOK_SECRET` = (webhook signature secret) ✅

**Email (Resend):**
- [x] `RESEND_API_KEY` = (production Resend API key) ✅
- [x] `EMAIL_FROM` = (sender email address) ✅

**Status:** ✅ **ALL REQUIRED VARIABLES PRESENT**

**Note:** `NODE_ENV` is automatically set by Vercel/Next.js to `production` in production deployments. You have `NEXT_PUBLIC_ENV` which is fine for client-side environment detection.

**Verification Checklist:**
- [x] All Supabase variables present ✅
- [x] All Polar variables present (including yearly prices) ✅
- [x] Resend API key and email configured ✅
- [x] App URL set to production domain ✅
- [x] Webhook secret configured ✅
- [x] Cron secret configured ✅

**Status:** ⏳ Pending  
**Action Required:** Verify all variables are set for "Production" environment in Vercel

---

## ⏳ **3. Supabase Configuration**

### Step 3.1: Verify Supabase Site URL

**Location:** Supabase Dashboard → Authentication → URL Configuration

- [x] **Site URL:** `https://www.asset-tracer.com` ✅
- [x] **Redirect URLs:**
  - [x] `https://www.asset-tracer.com/auth/callback` ✅
  - [x] `https://www.asset-tracer.com/dashboard` ✅
  - [x] `https://www.asset-tracer.com/checkout` ✅

**Status:** ✅ **VERIFIED**

**Date Completed:** 2025-11-21

### Step 3.2: Verify OAuth Provider Settings

**Location:** Supabase Dashboard → Authentication → Providers → Google

- [x] Google OAuth is **Enabled** ✅
- [x] Client ID and Client Secret are configured ✅
- [x] Redirect URL matches production domain ✅

**Status:** ✅ **VERIFIED**

**Date Completed:** 2025-11-21

### Step 3.3: Verify Database RLS Policies

**Location:** Supabase Dashboard → SQL Editor

**Instructions:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the queries from `VERIFY-PRODUCTION-DATABASE.sql`
3. Run Query #1: "CHECK ROW LEVEL SECURITY (RLS) STATUS"

**Expected Result:** All tables should show `✅ ENABLED`

**Quick Check Query:**
```sql
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED' 
    ELSE '❌ DISABLED - SECURITY RISK!' 
  END as "Status"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'organizations', 'assets', 'invoices', 
    'quotations', 'clients', 'quotation_items', 'invoice_items',
    'transactions', 'subscriptions', 'organization_members', 
    'team_invitations', 'inventory_items'
  )
ORDER BY tablename;
```

**Status:** ⏳ **PENDING - Run SQL query to verify**

**Action Required:** Run the query above and verify all tables show "✅ ENABLED"

### Step 3.4: Verify Database Constraints

**Location:** Supabase Dashboard → SQL Editor

**Instructions:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy queries #3 and #4 from `VERIFY-PRODUCTION-DATABASE.sql`
3. Run Query #3: "VERIFY UNIQUE CONSTRAINTS FOR QUOTATIONS"
4. Run Query #4: "VERIFY UNIQUE CONSTRAINTS FOR INVOICES"

**Expected Results:**
- **Quotations:** Should have constraint with BOTH `organization_id` AND `quotation_number`
  - ✅ Correct: `quotations_organization_id_quotation_number_key`
  - ❌ Wrong: `quotations_quotation_number_key` (global uniqueness - causes conflicts!)

- **Invoices:** Should have constraint with BOTH `organization_id` AND `invoice_number`
  - ✅ Correct: `invoices_organization_id_invoice_number_key`
  - ❌ Wrong: `invoices_invoice_number_key` (global uniqueness - causes conflicts!)

**Quick Check Query:**
```sql
-- Check Quotations Constraint
SELECT 
  tc.constraint_name,
  STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as "Columns",
  CASE 
    WHEN tc.constraint_name LIKE '%organization_id%' AND tc.constraint_name LIKE '%quotation_number%' 
      THEN '✅ CORRECT'
    ELSE '❌ WRONG - Needs organization_id'
  END as "Status"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name = 'quotations'
GROUP BY tc.constraint_name;

-- Check Invoices Constraint
SELECT 
  tc.constraint_name,
  STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as "Columns",
  CASE 
    WHEN tc.constraint_name LIKE '%organization_id%' AND tc.constraint_name LIKE '%invoice_number%' 
      THEN '✅ CORRECT'
    ELSE '❌ WRONG - Needs organization_id'
  END as "Status"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name = 'invoices'
GROUP BY tc.constraint_name;
```

**Status:** ⏳ **PENDING - Run SQL queries to verify**

**Action Required:** Run the queries above and verify both show "✅ CORRECT"

---

## ⏳ **4. Security Verification**

### Step 4.1: Verify Security Headers

**Test:** Visit `https://www.asset-tracer.com` and check response headers

**Expected Headers:**
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Content-Security-Policy` (present and configured)

**Status:** ⏳ Pending  
**Tool:** Use browser DevTools → Network tab or https://securityheaders.com

### Step 4.2: Verify OAuth Flow

**Test Steps:**
1. [ ] Visit `https://www.asset-tracer.com/login`
2. [ ] Click "Sign in with Google"
3. [ ] Complete OAuth flow
4. [ ] Verify redirect to dashboard
5. [ ] Verify user profile is created
6. [ ] Verify organization is created

**Status:** ⏳ Pending

### Step 4.3: Verify Rate Limiting

**Test:** Make multiple requests to API endpoints

**Expected:**
- [ ] Rate limit headers present (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- [ ] 429 response after exceeding limits

**Status:** ⏳ Pending

---

## ⏳ **5. Database Schema Verification**

### Step 5.1: Compare Production vs Staging Schema

**Action:** Run schema comparison queries in both environments

**Location:** `STAGING-TO-PRODUCTION-WORKFLOW.md`

**Status:** ⏳ Pending

### Step 5.2: Verify All Required Tables Exist

**Tables Required:**
- [ ] `users`
- [ ] `organizations`
- [ ] `assets`
- [ ] `invoices`
- [ ] `invoice_items`
- [ ] `quotations`
- [ ] `quotation_items`
- [ ] `clients`
- [ ] `transactions`
- [ ] `subscriptions`
- [ ] `organization_members`
- [ ] `team_invitations`
- [ ] `inventory_items`

**Status:** ⏳ Pending

---

## ⏳ **6. Code Deployment**

### Step 6.1: Verify Latest Code is on Main Branch

```bash
git checkout main
git pull origin main
git log -1 --oneline
```

**Status:** ⏳ Pending

### Step 6.2: Merge Staging to Main

```bash
git checkout main
git merge staging
git push origin main
```

**Status:** ⏳ Pending

### Step 6.3: Verify Vercel Deployment

**Location:** Vercel Dashboard → Deployments

- [ ] Latest deployment shows correct commit hash
- [ ] Build completed successfully
- [ ] No build errors or warnings

**Status:** ⏳ Pending

---

## ⏳ **7. Post-Deployment Testing**

### Step 7.1: Smoke Tests

- [ ] Homepage loads correctly
- [ ] Login page accessible
- [ ] OAuth flow works
- [ ] Dashboard loads after login
- [ ] Can create an asset
- [ ] Can create a client
- [ ] Can create an invoice
- [ ] Can create a quotation

**Status:** ⏳ Pending

### Step 7.2: Security Tests

- [ ] Security headers present (use securityheaders.com)
- [ ] XSS sanitization works (test with `<script>alert('XSS')</script>`)
- [ ] Error messages are generic (no stack traces)
- [ ] Rate limiting works

**Status:** ⏳ Pending

### Step 7.3: Performance Check

- [ ] Page load times are acceptable
- [ ] API response times are reasonable
- [ ] No console errors
- [ ] No network errors

**Status:** ⏳ Pending

---

## 📋 **Checklist Summary**

| Category | Status | Notes |
|----------|--------|-------|
| Dependency Audit | ✅ **COMPLETE** | 0 vulnerabilities found |
| Environment Variables | ✅ **VERIFIED** | All required variables present |
| Supabase Configuration | ⏳ **IN PROGRESS** | URLs & OAuth verified, RLS & constraints pending |
| Security Verification | ⏳ Pending | |
| Database Schema | ⏳ Pending | |
| Code Deployment | ⏳ Pending | |
| Post-Deployment Testing | ⏳ Pending | |

---

## ✅ **Completion Criteria**

All items must be checked before considering production deployment complete:

- [ ] All dependency vulnerabilities fixed (0 vulnerabilities)
- [ ] All environment variables verified in Vercel
- [ ] Supabase configuration verified
- [ ] Database RLS policies enabled
- [ ] Security headers present
- [ ] OAuth flow tested and working
- [ ] Code deployed to production
- [ ] Smoke tests passed
- [ ] Security tests passed

---

**Last Updated:** 2025-11-21  
**Next Review:** After each checklist item completion

