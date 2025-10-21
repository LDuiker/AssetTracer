-- =====================================================
-- VERIFY QUOTATION_ITEMS TABLE SCHEMA
-- =====================================================
-- Check if asset_id column exists and view full table structure
-- =====================================================

-- Check all columns in quotation_items table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'quotation_items'
ORDER BY ordinal_position;

-- Check if asset_id column specifically exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'quotation_items' 
      AND column_name = 'asset_id'
    ) THEN 'asset_id column EXISTS ✓'
    ELSE 'asset_id column MISSING ✗'
  END as status;

