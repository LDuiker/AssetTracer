# Staging to Production Workflow - Prevent Production Issues

## The Problem We Just Fixed
- Staging had correct database schema (per-org numbering)
- Production had incorrect schema (global numbering)
- Code worked in staging but failed in production
- **Root cause**: Database schema differences between environments

---

## Solution: Keep Staging and Production in Sync

### 1. **Database Schema Parity Check** (CRITICAL)

Before deploying code changes, verify schemas match:

```sql
-- Run this in BOTH staging and production
-- Compare the output - they should be identical

-- Check all constraints
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('quotations', 'invoices', 'clients', 'assets', 'users', 'organizations')
ORDER BY tablename, indexname;

-- Check all unique constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;
```

**Action**: Save outputs from both environments and compare. Fix any differences BEFORE deploying code.

---

### 2. **Recommended Workflow** (Same as you suggested earlier)

#### Phase 1: Develop & Test in Staging
```
1. Make code changes
2. Push to staging branch
3. Vercel auto-deploys to staging
4. Test thoroughly in staging
5. Document any database changes needed
```

#### Phase 2: Apply Database Changes to Production FIRST
```
6. If staging required database changes (SQL migrations):
   → Apply the SAME changes to production database FIRST
   → Verify with schema comparison queries above
7. This ensures production database is ready for the new code
```

#### Phase 3: Deploy Code to Production
```
8. Merge staging → main
9. Vercel deploys to production
10. Code now works because database is already ready
```

---

### 3. **Migration Scripts Strategy**

Create a `migrations/` folder with numbered, dated migration files:

```
asset-tracer/supabase/migrations/
  ├── 001_2025-11-04_per-org-quotation-numbering.sql
  ├── 002_2025-11-04_per-org-invoice-numbering.sql
  ├── 003_2025-11-05_add-new-feature.sql
  └── README.md (tracks which migrations ran where)
```

**Migration File Template**:
```sql
-- Migration: [DESCRIPTION]
-- Date: YYYY-MM-DD
-- Applied to Staging: [DATE]
-- Applied to Production: [DATE/PENDING]

-- Step 1: Check if already applied
-- (Add a check query)

-- Step 2: Apply changes
-- (Your migration SQL)

-- Step 3: Verify
-- (Verification query)
```

---

### 4. **Pre-Deployment Checklist**

Before merging staging → production:

- [ ] All features tested in staging
- [ ] Database schema compared (staging vs production)
- [ ] Any database migrations applied to production FIRST
- [ ] Environment variables match (except credentials)
- [ ] RLS policies verified in both environments
- [ ] Subscription limits tested (free tier restrictions)
- [ ] Vercel deployment settings identical

---

### 5. **Database Schema Version Tracking**

Add a table to track schema versions:

```sql
-- Run in BOTH staging and production
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  applied_at TIMESTAMP DEFAULT NOW(),
  applied_by VARCHAR(100)
);

-- Example: Record a migration
INSERT INTO schema_migrations (version, description, applied_by)
VALUES ('001', 'Per-organization quotation numbering', 'admin@asset-tracer.com');
```

Then before deploying, check:
```sql
-- Should return same versions in both environments
SELECT version, description, applied_at 
FROM schema_migrations 
ORDER BY version;
```

---

### 6. **Automated Schema Comparison Script**

Create a PowerShell script to compare schemas:

```powershell
# compare-schemas.ps1
# Queries both databases and highlights differences

$stagingSchema = # query staging
$prodSchema = # query production

if ($stagingSchema -ne $prodSchema) {
    Write-Error "⚠️ SCHEMA MISMATCH! Do not deploy."
    # Show differences
} else {
    Write-Output "✅ Schemas match. Safe to deploy."
}
```

---

### 7. **Key Rules to Follow**

1. **NEVER** apply database changes directly to production without testing in staging first
2. **ALWAYS** apply database migrations to production BEFORE deploying code that depends on them
3. **DOCUMENT** every database change in a migration script (even manual changes)
4. **VERIFY** schema parity before every production deployment
5. **TEST** subscription limits (free tier) in staging before production
6. **USE** the same RLS policies in both environments

---

### 8. **Emergency Rollback Plan**

If production breaks after deployment:

1. **Code Rollback**: Redeploy previous working commit in Vercel
2. **Database Rollback**: Have a rollback script for each migration
   ```sql
   -- Every migration should have a corresponding rollback
   -- 001_per-org-quotation_ROLLBACK.sql
   ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_organization_id_quotation_number_key;
   CREATE UNIQUE INDEX quotations_quotation_number_key ON quotations(quotation_number);
   ```

---

### 9. **Monitoring & Alerts**

Set up alerts for:
- 500 errors in Vercel logs
- Failed database queries (Supabase logs)
- Duplicate key constraint violations
- RLS policy violations

---

## Quick Reference: Deployment Day Checklist

```
□ Run schema comparison queries
□ Apply pending migrations to production database
□ Verify migrations with test queries
□ Update schema_migrations table
□ Merge staging → main
□ Monitor Vercel deployment
□ Test critical flows in production:
  - User signup/login
  - Create quotation
  - Create invoice
  - Convert quotation to invoice
  - Subscription limit enforcement
□ Check Vercel logs for errors
□ Keep staging branch up-to-date with main after deployment
```

---

## TL;DR - The Golden Rule

**🎯 Database changes FIRST, then code deployment**

This ensures the database is always ready for the code that's about to run.

