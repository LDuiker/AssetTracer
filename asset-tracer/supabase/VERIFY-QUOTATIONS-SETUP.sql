-- =====================================================
-- VERIFY QUOTATIONS TABLES SETUP
-- =====================================================
-- This script verifies that quotations tables exist
-- and are properly configured
-- =====================================================

-- Check if quotations table exists
SELECT 
  'quotations table exists' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'quotations'
    ) THEN '✅ YES'
    ELSE '❌ NO'
  END AS status;

-- Check if quotation_items table exists
SELECT 
  'quotation_items table exists' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'quotation_items'
    ) THEN '✅ YES'
    ELSE '❌ NO'
  END AS status;

-- Check quotations table columns
SELECT 
  'quotations columns' AS check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'quotations'
ORDER BY ordinal_position;

-- Check quotation_items table columns
SELECT 
  'quotation_items columns' AS check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'quotation_items'
ORDER BY ordinal_position;

-- Check RLS policies on quotations
SELECT 
  'quotations RLS policies' AS check_name,
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'Has USING clause' ELSE 'No USING clause' END as using_clause,
  CASE WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause' ELSE 'No WITH CHECK clause' END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'quotations';

-- Check RLS policies on quotation_items
SELECT 
  'quotation_items RLS policies' AS check_name,
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'Has USING clause' ELSE 'No USING clause' END as using_clause,
  CASE WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause' ELSE 'No WITH CHECK clause' END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'quotation_items';

-- Test query to see if we can fetch quotations
-- (This will show what error you're getting, if any)
SELECT 
  'Test fetch quotations' AS check_name,
  COUNT(*) AS quotation_count
FROM quotations;

-- Check if clients table exists (required foreign key)
SELECT 
  'clients table exists' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'clients'
    ) THEN '✅ YES'
    ELSE '❌ NO - This will cause errors!'
  END AS status;

-- Check for any data in quotations
SELECT 
  'Quotations data check' AS info,
  COUNT(*) as total_quotations,
  COUNT(DISTINCT organization_id) as organizations_with_quotations,
  COUNT(DISTINCT client_id) as unique_clients
FROM quotations;

