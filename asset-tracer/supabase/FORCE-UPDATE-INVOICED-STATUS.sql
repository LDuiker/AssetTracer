-- =====================================================
-- FORCE UPDATE INVOICED STATUS
-- =====================================================
-- This script will forcefully update the status constraint
-- and then update all converted quotations
-- =====================================================

-- Step 1: Check current constraint
SELECT 'Current Constraint:' as info;
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'quotations'::regclass
  AND conname = 'quotations_status_check';

-- Step 2: Drop ALL existing check constraints on status
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'quotations'::regclass 
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE quotations DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_record.conname);
    RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
  END LOOP;
END $$;

-- Step 3: Add the new constraint
ALTER TABLE quotations 
ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'invoiced'));

-- Step 4: Verify new constraint
SELECT 'New Constraint:' as info;
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'quotations'::regclass
  AND conname = 'quotations_status_check';

-- Step 5: Find quotations that have been converted but not marked as invoiced
SELECT 'Quotations to update:' as info;
SELECT 
  id,
  quotation_number,
  status,
  converted_to_invoice_id
FROM quotations
WHERE converted_to_invoice_id IS NOT NULL
  AND status != 'invoiced';

-- Step 6: Update all converted quotations to 'invoiced' status
UPDATE quotations
SET status = 'invoiced'
WHERE converted_to_invoice_id IS NOT NULL
  AND status != 'invoiced';

-- Step 7: Verify the updates
SELECT 'Updated quotations:' as info;
SELECT 
  id,
  quotation_number,
  status,
  converted_to_invoice_id
FROM quotations
WHERE converted_to_invoice_id IS NOT NULL
ORDER BY created_at DESC;

-- Step 8: Test that we can manually set status to invoiced
-- This will fail if the constraint doesn't allow it
DO $$
BEGIN
  -- Try to update a test record
  UPDATE quotations 
  SET status = 'invoiced' 
  WHERE id = (SELECT id FROM quotations LIMIT 1);
  
  RAISE NOTICE 'SUCCESS: Invoiced status is now allowed';
  
  -- Rollback the test
  ROLLBACK;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
    ROLLBACK;
END $$;

SELECT 'Migration complete!' as result;

