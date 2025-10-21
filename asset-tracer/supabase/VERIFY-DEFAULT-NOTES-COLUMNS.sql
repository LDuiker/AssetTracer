-- =====================================================
-- Verify and Add Default Notes and Terms Columns
-- =====================================================
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Check if columns exist
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('default_notes', 'invoice_terms', 'quotation_terms')
ORDER BY column_name;

-- If the above returns no rows, run this:
-- (If it returns 3 rows, the columns already exist and you're good!)

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS default_notes TEXT,
ADD COLUMN IF NOT EXISTS invoice_terms TEXT DEFAULT 'Payment due within 30 days. Late payments may incur additional charges.',
ADD COLUMN IF NOT EXISTS quotation_terms TEXT DEFAULT 'This quotation is valid for 30 days from the date of issue. Prices are subject to change after this period.';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('default_notes', 'invoice_terms', 'quotation_terms')
ORDER BY column_name;

-- Success message
SELECT 'Migration complete! Columns added successfully.' AS status;

