-- =====================================================
-- ADD INVOICED STATUS TO QUOTATIONS
-- =====================================================
-- This migration adds 'invoiced' as a valid status for quotations
-- =====================================================

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE quotations 
DROP CONSTRAINT IF EXISTS quotations_status_check;

-- Step 2: Add the new CHECK constraint with 'invoiced' included
ALTER TABLE quotations 
ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'invoiced'));

-- Step 3: Verify the constraint was added
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'quotations'::regclass
  AND conname = 'quotations_status_check';

-- Success message
SELECT 'SUCCESS: Invoiced status added to quotations table' as result;

