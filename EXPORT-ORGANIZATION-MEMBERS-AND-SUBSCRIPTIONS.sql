-- =====================================================
-- EXPORT organization_members & subscriptions TABLES
-- =====================================================
-- Run this in your STAGING database (ougntjrrskfsuognjmcw)
-- Copy ALL the output and share it with me
-- =====================================================

-- =====================================================
-- PART 1: organization_members table
-- =====================================================

-- Show columns for organization_members
SELECT 
  '=== organization_members COLUMNS ===' as section,
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'organization_members'
ORDER BY ordinal_position;

-- Show constraints for organization_members
SELECT
  '=== organization_members CONSTRAINTS ===' as section,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'organization_members'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Show indexes for organization_members
SELECT
  '=== organization_members INDEXES ===' as section,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'organization_members'
ORDER BY indexname;

-- =====================================================
-- PART 2: subscriptions table
-- =====================================================

-- Show columns for subscriptions
SELECT 
  '=== subscriptions COLUMNS ===' as section,
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Show constraints for subscriptions
SELECT
  '=== subscriptions CONSTRAINTS ===' as section,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'subscriptions'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Show indexes for subscriptions
SELECT
  '=== subscriptions INDEXES ===' as section,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'subscriptions'
ORDER BY indexname;

-- =====================================================
-- PART 3: Check for RLS policies
-- =====================================================

-- Check RLS status
SELECT
  '=== RLS STATUS ===' as section,
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables pt
JOIN pg_class pc ON pt.tablename = pc.relname
WHERE pt.schemaname = 'public'
  AND pt.tablename IN ('organization_members', 'subscriptions');

-- Show RLS policies for organization_members
SELECT
  '=== organization_members RLS POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'organization_members';

-- Show RLS policies for subscriptions
SELECT
  '=== subscriptions RLS POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'subscriptions';

-- =====================================================
-- PART 4: Sample data (to understand structure)
-- =====================================================

-- Show sample row from organization_members (if any)
SELECT '=== organization_members SAMPLE ===' as section;
SELECT * FROM organization_members LIMIT 1;

-- Show sample row from subscriptions (if any)
SELECT '=== subscriptions SAMPLE ===' as section;
SELECT * FROM subscriptions LIMIT 1;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. Run this ENTIRE script in your STAGING database
-- 2. Copy ALL the output (it will be long)
-- 3. Paste it in chat
-- 4. I'll create the exact CREATE TABLE statements for production
-- =====================================================

