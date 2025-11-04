-- Check Invoice Number Constraint in Production
-- Same issue as quotations - needs to be per-organization, not global

-- Step 1: Check current constraints on invoices table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'invoices'::regclass
ORDER BY conname;

-- Step 2: Check indexes on invoices table (especially for invoice_number)
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'invoices'
ORDER BY indexname;

-- Step 3: Check if invoice_number is globally unique or per-organization unique
SELECT 
  i.relname as index_name,
  a.attname as column_name,
  am.amname as index_type
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
JOIN pg_am am ON i.relam = am.oid
WHERE t.relname = 'invoices'
  AND i.relname LIKE '%invoice_number%'
ORDER BY i.relname, a.attnum;

-- Step 4: Test - check if multiple orgs can have same invoice number
SELECT 
  invoice_number,
  COUNT(DISTINCT organization_id) as org_count,
  array_agg(DISTINCT organization_id) as organizations
FROM invoices
GROUP BY invoice_number
HAVING COUNT(DISTINCT organization_id) > 1;

-- If Step 4 returns no rows, invoice_number is globally unique (PROBLEM)
-- It should allow multiple orgs to have the same invoice_number

