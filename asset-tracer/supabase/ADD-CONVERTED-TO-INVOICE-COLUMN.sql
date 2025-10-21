-- =====================================================
-- ADD CONVERTED TO INVOICE COLUMN
-- =====================================================
-- This migration adds the converted_to_invoice_id column
-- and updates the status constraint
-- =====================================================

-- Step 1: Add the converted_to_invoice_id column
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS converted_to_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Step 2: Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_quotations_converted_to_invoice 
ON quotations(converted_to_invoice_id);

-- Step 3: Remove the old status constraint
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check CASCADE;

-- Step 4: Add the new constraint with 'invoiced' included
ALTER TABLE quotations 
ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'invoiced'));

-- Step 5: Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quotations'
  AND column_name = 'converted_to_invoice_id';

-- Step 6: Verify the constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'quotations'::regclass
  AND conname = 'quotations_status_check';

-- Success message
SELECT '✅ SUCCESS: Column and constraint added successfully!' as result;

