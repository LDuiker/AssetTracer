-- Check Quotation Number Constraint in Production
-- Compare with staging to find the difference

-- Step 1: Check current constraints on quotations table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'quotations'::regclass
ORDER BY conname;

-- Step 2: Check indexes on quotations table (especially for quotation_number)
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'quotations'
ORDER BY indexname;

-- Step 3: Check if quotation_number is globally unique or per-organization unique
-- If this query shows constraint on just quotation_number, it's globally unique (PROBLEM)
-- If it shows constraint on (organization_id, quotation_number), it's per-org (CORRECT)

SELECT 
  i.relname as index_name,
  a.attname as column_name,
  am.amname as index_type
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
JOIN pg_am am ON i.relam = am.oid
WHERE t.relname = 'quotations'
  AND i.relname LIKE '%quotation_number%'
ORDER BY i.relname, a.attnum;

-- Step 4: Test query - check if multiple orgs can have same quotation number
-- If this returns rows, quotation_number is globally unique (PROBLEM for SaaS)
-- If this returns no rows or allows it, it's per-org unique (CORRECT)
SELECT 
  quotation_number,
  COUNT(DISTINCT organization_id) as org_count,
  array_agg(DISTINCT organization_id) as organizations
FROM quotations
GROUP BY quotation_number
HAVING COUNT(DISTINCT organization_id) > 1;

-- Expected result for SaaS: Multiple orgs CAN have same quotation_number
-- Current result in production: Likely shows constraint preventing this

