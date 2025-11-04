-- Fix Invoice Number Constraint in Production (Same as Quotations)
-- Change from globally unique to per-organization unique (SaaS standard)

-- This allows each organization to have independent numbering:
-- Org A: INV-202511-0001, INV-202511-0002, INV-202511-0003
-- Org B: INV-202511-0001, INV-202511-0002, INV-202511-0003 (same numbers, different org)

-- Step 1: Drop the existing global unique constraint on invoice_number
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;

-- Step 2: Create a composite unique constraint on (organization_id, invoice_number)
-- This allows the same invoice_number for different organizations
-- but prevents duplicates within the same organization
CREATE UNIQUE INDEX IF NOT EXISTS invoices_organization_id_invoice_number_key 
ON invoices(organization_id, invoice_number);

-- Step 3: Verify the fix
SELECT 
  'Constraint fixed - invoices now use per-organization numbering' as status,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'invoices' 
  AND indexname LIKE '%invoice_number%';

-- Step 4: Confirm both tables are now fixed
SELECT 
  'quotations' as table_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'quotations' 
  AND indexname LIKE '%quotation_number%'

UNION ALL

SELECT 
  'invoices' as table_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'invoices' 
  AND indexname LIKE '%invoice_number%'
ORDER BY table_name;

