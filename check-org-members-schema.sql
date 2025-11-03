-- =====================================================
-- CHECK ORGANIZATION_MEMBERS SCHEMA
-- =====================================================
-- Run this to see what columns actually exist in the table
-- =====================================================

-- Check if table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'organization_members'
    ) 
    THEN '✅ organization_members table EXISTS'
    ELSE '❌ organization_members table DOES NOT EXIST'
  END as table_status;

-- Show all columns in the table
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organization_members'
ORDER BY ordinal_position;

-- Show sample data if any
SELECT 
  COUNT(*) as total_records,
  'records in organization_members' as description
FROM organization_members
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'organization_members'
);

-- Show all data with corrected column names
SELECT 
  om.id,
  om.organization_id,
  om.user_id,
  om.role,
  om.created_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'organization_members' 
      AND column_name = 'joined_at'
    ) 
    THEN '(joined_at exists)'
    ELSE '(no joined_at)'
  END as joined_at_status
FROM organization_members om
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'organization_members'
)
ORDER BY om.created_at DESC;

-- =====================================================
-- Recommendation
-- =====================================================
DO $$
DECLARE
  has_joined_at BOOLEAN;
BEGIN
  -- Check if joined_at column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'organization_members' 
    AND column_name = 'joined_at'
  ) INTO has_joined_at;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'ORGANIZATION_MEMBERS COLUMN CHECK';
  RAISE NOTICE '================================================';
  
  IF has_joined_at THEN
    RAISE NOTICE '✅ Column joined_at EXISTS';
    RAISE NOTICE 'You can use: om.joined_at in queries';
  ELSE
    RAISE NOTICE '❌ Column joined_at MISSING';
    RAISE NOTICE '💡 Use: om.created_at instead';
    RAISE NOTICE '';
    RAISE NOTICE 'To add joined_at column, run:';
    RAISE NOTICE 'ALTER TABLE organization_members';
    RAISE NOTICE '  ADD COLUMN joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();';
  END IF;
  
  RAISE NOTICE '================================================';
END $$;

