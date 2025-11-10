-- =====================================================
-- VERIFY ASSET GROUPS SCHEMA - Run this first
-- =====================================================
-- This will show you the current state of the assets table
-- =====================================================

-- Check if columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'assets' 
  AND column_name IN ('asset_type', 'parent_group_id', 'quantity')
ORDER BY column_name;

-- If no rows returned, columns don't exist yet
-- If rows returned, columns already exist

