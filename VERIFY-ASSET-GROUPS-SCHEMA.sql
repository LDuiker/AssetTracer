-- =====================================================
-- VERIFY ASSET GROUPS SCHEMA
-- =====================================================
-- Run this to check if the columns exist
-- =====================================================

-- Check if columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'assets' 
  AND column_name IN ('asset_type', 'parent_group_id', 'quantity')
ORDER BY column_name;

-- Check if indexes exist
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'assets' 
  AND (indexname LIKE '%asset_type%' OR indexname LIKE '%parent_group_id%')
ORDER BY indexname;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'assets'
      AND column_name = 'asset_type'
  ) THEN
    RAISE NOTICE 'Sample asset data (including new columns):';
    EXECUTE $$
      SELECT 
        id,
        name,
        asset_type,
        parent_group_id,
        quantity
      FROM assets
      ORDER BY id
      LIMIT 5
    $$;
  ELSE
    RAISE NOTICE 'Column asset_type not found; skipping sample asset data check.';
    EXECUTE $$
      SELECT 
        id,
        name
      FROM assets
      ORDER BY id
      LIMIT 5
    $$;
  END IF;
END
$$;

