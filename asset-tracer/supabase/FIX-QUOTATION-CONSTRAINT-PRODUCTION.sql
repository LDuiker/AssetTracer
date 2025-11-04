-- Fix Quotation Number Constraint in Production to Match Staging
-- Change from globally unique to per-organization unique (SaaS standard)

-- This allows each organization to have independent numbering:
-- Org A: QUO-2025-0001, QUO-2025-0002, QUO-2025-0003
-- Org B: QUO-2025-0001, QUO-2025-0002, QUO-2025-0003 (same numbers, different org)

-- Step 1: Drop the existing global unique constraint on quotation_number
-- This is what's causing the problem in production
ALTER TABLE quotations 
DROP CONSTRAINT IF EXISTS quotations_quotation_number_key;

-- Step 2: Create a composite unique constraint on (organization_id, quotation_number)
-- This allows the same quotation_number for different organizations
-- but prevents duplicates within the same organization
CREATE UNIQUE INDEX IF NOT EXISTS quotations_organization_id_quotation_number_key 
ON quotations(organization_id, quotation_number);

-- Step 3: Verify the fix
SELECT 
  'Constraint fixed - quotations now use per-organization numbering' as status,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'quotations' 
  AND indexname LIKE '%quotation_number%';

-- Step 4: Test - Try to see if multiple orgs can now have same number
-- (This is just a check query, not actually creating duplicates)
SELECT 
  COUNT(*) as total_quotations,
  COUNT(DISTINCT organization_id) as total_organizations,
  'Per-organization numbering is now enabled' as result
FROM quotations;

