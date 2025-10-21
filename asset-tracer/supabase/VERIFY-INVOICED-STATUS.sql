-- =====================================================
-- VERIFY INVOICED STATUS IMPLEMENTATION
-- =====================================================
-- This script checks if the 'invoiced' status is working
-- =====================================================

-- Step 1: Check the constraint definition
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'quotations'::regclass
  AND conname = 'quotations_status_check';

-- Step 2: Check current quotations with their statuses
SELECT 
  id,
  quotation_number,
  status,
  converted_to_invoice_id,
  created_at
FROM quotations
ORDER BY created_at DESC
LIMIT 10;

-- Step 3: Try to manually update a quotation to 'invoiced' status
-- (Replace the quotation_number with the one you just converted)
-- Uncomment the line below and replace 'QUO-XXXX' with your actual quotation number
-- UPDATE quotations SET status = 'invoiced' WHERE quotation_number = 'QUO-XXXX';

-- Step 4: Check if the update worked
-- SELECT quotation_number, status FROM quotations WHERE quotation_number = 'QUO-XXXX';

