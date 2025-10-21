-- =====================================================
-- COMPLETE FIX FOR INVOICED STATUS
-- =====================================================
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Remove the old constraint
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check CASCADE;

-- Step 2: Add the new constraint with 'invoiced' included
ALTER TABLE quotations 
ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'invoiced'));

-- Step 3: Update ALL quotations that have been converted to invoices
UPDATE quotations
SET status = 'invoiced'
WHERE converted_to_invoice_id IS NOT NULL
  AND status != 'invoiced';

-- Step 4: Verify the changes
SELECT 
  quotation_number,
  status,
  CASE 
    WHEN converted_to_invoice_id IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as converted,
  updated_at
FROM quotations
WHERE converted_to_invoice_id IS NOT NULL
ORDER BY updated_at DESC;

-- Step 5: Test that 'invoiced' status works
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_constraint 
      WHERE conrelid = 'quotations'::regclass 
        AND conname = 'quotations_status_check'
        AND pg_get_constraintdef(oid) LIKE '%invoiced%'
    ) THEN '✅ SUCCESS: Invoiced status is now allowed'
    ELSE '❌ FAILED: Invoiced status not in constraint'
  END as result;

