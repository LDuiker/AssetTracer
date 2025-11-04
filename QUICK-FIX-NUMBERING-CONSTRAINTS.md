# Quick Fix: Quotation & Invoice Numbering Constraints

## 🚨 Problem: "Duplicate key value violates unique constraint"

If you see this error when creating quotations or invoices, the database constraints are configured incorrectly (global instead of per-organization).

---

## ✅ Quick Diagnosis (30 seconds)

Run this in Supabase SQL Editor:

```sql
-- Check if constraints are correct
SELECT 
  tablename,
  indexname,
  indexdef,
  CASE 
    WHEN indexdef LIKE '%organization_id%' THEN '✅ CORRECT (Per-Org)'
    ELSE '❌ WRONG (Global - Will Cause Issues)'
  END as status
FROM pg_indexes
WHERE tablename IN ('quotations', 'invoices')
  AND indexname LIKE '%number%'
ORDER BY tablename;
```

**Expected Output:**
```
quotations  | quotations_organization_id_quotation_number_key  | ✅ CORRECT
invoices    | invoices_organization_id_invoice_number_key      | ✅ CORRECT
```

**Bad Output:**
```
quotations  | quotations_quotation_number_key  | ❌ WRONG
invoices    | invoices_invoice_number_key      | ❌ WRONG
```

---

## 🔧 Quick Fix (2 minutes)

### Option 1: Run Pre-Made Scripts

**In Supabase SQL Editor:**

1. **For Quotations:**
   - Run: `asset-tracer/supabase/FIX-QUOTATION-CONSTRAINT-PRODUCTION.sql`

2. **For Invoices:**
   - Run: `asset-tracer/supabase/FIX-INVOICE-CONSTRAINT-PRODUCTION.sql`

### Option 2: Manual SQL (Copy-Paste)

```sql
-- Fix Quotations Table
ALTER TABLE quotations 
DROP CONSTRAINT IF EXISTS quotations_quotation_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS quotations_organization_id_quotation_number_key 
ON quotations(organization_id, quotation_number);

-- Fix Invoices Table
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_organization_id_invoice_number_key 
ON invoices(organization_id, invoice_number);

-- Verify Fix
SELECT 
  tablename,
  indexname,
  CASE 
    WHEN indexdef LIKE '%organization_id%' THEN '✅ FIXED'
    ELSE '❌ STILL WRONG'
  END as status
FROM pg_indexes
WHERE tablename IN ('quotations', 'invoices')
  AND indexname LIKE '%number%';
```

---

## 🎯 What This Does

**Before (WRONG):**
- Only ONE organization can use `QUO-2025-0001`
- If Org A has it, Org B gets duplicate key error ❌

**After (CORRECT):**
- Each organization has independent numbering
- Org A: `QUO-2025-0001`, `QUO-2025-0002`, `QUO-2025-0003`
- Org B: `QUO-2025-0001`, `QUO-2025-0002`, `QUO-2025-0003`
- No conflicts ✅

---

## 🔄 When to Use This

- After cloning/restoring a database
- After manual schema changes
- When seeing duplicate key errors in production
- Before deploying if staging and production schemas differ

---

## 📋 Prevention Checklist

Before every production deployment:

1. ✅ Run `COMPARE-SCHEMAS-STAGING-VS-PRODUCTION.sql` in both environments
2. ✅ Verify quotations/invoices show "✅ PER-ORG (Correct)"
3. ✅ Fix any differences in production FIRST
4. ✅ Then deploy code

See: `STAGING-TO-PRODUCTION-WORKFLOW.md` for full workflow

---

## 💾 Rollback (If Needed)

If you accidentally need to rollback (not recommended):

```sql
-- Rollback to global constraint (NOT RECOMMENDED)
ALTER TABLE quotations 
DROP CONSTRAINT IF EXISTS quotations_organization_id_quotation_number_key;

CREATE UNIQUE INDEX quotations_quotation_number_key 
ON quotations(quotation_number);

-- But seriously, don't do this in production
```

---

## 📞 Quick Reference

**Files:**
- Fix Scripts: `FIX-QUOTATION-CONSTRAINT-PRODUCTION.sql`, `FIX-INVOICE-CONSTRAINT-PRODUCTION.sql`
- Check Script: `COMPARE-SCHEMAS-STAGING-VS-PRODUCTION.sql`
- Full Workflow: `STAGING-TO-PRODUCTION-WORKFLOW.md`

**Support:**
- This is stored in AI memory for quick recall
- All scripts are in `asset-tracer/supabase/` folder

