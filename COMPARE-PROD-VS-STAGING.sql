-- =====================================================
-- COMPARE PRODUCTION VS STAGING DATABASE
-- =====================================================
-- This checks what's missing in staging that works in prod
-- Run this in STAGING database SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Check OAuth Trigger
-- =====================================================
SELECT 
  '=== OAUTH TRIGGER STATUS ===' as section,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
    THEN '✅ OAuth trigger EXISTS'
    ELSE '❌ OAuth trigger MISSING - This is why you are redirected!'
  END as trigger_status;

-- Check if function exists
SELECT 
  '=== TRIGGER FUNCTION ===' as section,
  routine_name,
  routine_type,
  security_type,
  CASE 
    WHEN security_type = 'DEFINER' THEN '✅ SECURITY DEFINER (correct)'
    ELSE '⚠️ NOT DEFINER (will fail)'
  END as security_status
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- =====================================================
-- STEP 2: Check Table Columns (Schema Match)
-- =====================================================
-- Check users table columns
SELECT 
  '=== USERS TABLE COLUMNS ===' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check if users has 'name' or 'full_name'
SELECT 
  '=== USERS TABLE NAME COLUMN ===' as section,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name')
    THEN '✅ Has "name" column (correct)'
    WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name')
    THEN '⚠️ Has "full_name" column (trigger will fail!)'
    ELSE '❌ Missing name column!'
  END as name_column_status;

-- Check organizations table
SELECT 
  '=== ORGANIZATIONS TABLE COLUMNS ===' as section,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'organizations'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 3: Check RLS Policies
-- =====================================================
-- Check if RLS is enabled
SELECT 
  '=== RLS STATUS ===' as section,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'organizations', 'invoice_items')
ORDER BY tablename;

-- Count policies per table
SELECT 
  '=== POLICY COUNT ===' as section,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Has policies'
    ELSE '❌ NO POLICIES (will block access)'
  END as status
FROM pg_policies
WHERE tablename IN ('users', 'organizations', 'invoice_items')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- STEP 4: Check Current Auth Users Without Profiles
-- =====================================================
-- Find auth users without public.users profile
SELECT 
  '=== ORPHANED AUTH USERS ===' as section,
  au.id,
  au.email,
  au.created_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ NO PROFILE (this causes redirect!)'
    ELSE '✅ Has profile'
  END as profile_status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
ORDER BY au.created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 5: Check Table Count
-- =====================================================
SELECT 
  '=== TABLE COUNT ===' as section,
  COUNT(*) as table_count,
  CASE 
    WHEN COUNT(*) >= 14 THEN '✅ All tables exist (14)'
    ELSE '⚠️ Missing tables (should be 14)'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- List all tables
SELECT 
  '=== ALL TABLES ===' as section,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- STEP 6: Check Middleware Requirements
-- =====================================================
-- Test if a user can query their own data
SELECT 
  '=== USER DATA ACCESS TEST ===' as section,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ User authenticated'
    ELSE '⚠️ Not authenticated (run while logged in)'
  END as auth_status;

-- Try to access users table
SELECT 
  '=== USERS TABLE ACCESS ===' as section,
  COUNT(*) as accessible_users,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Can access users table'
    WHEN auth.uid() IS NULL THEN '⚠️ Not logged in'
    ELSE '❌ RLS blocking access'
  END as status
FROM users
WHERE id = auth.uid();

-- =====================================================
-- STEP 7: Compare with Production Schema
-- =====================================================
-- Production schema expectations:
SELECT 
  '=== PRODUCTION SCHEMA CHECKLIST ===' as section,
  'users.name (not full_name)' as requirement,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name')
    THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END as status
UNION ALL
SELECT 
  '=== PRODUCTION SCHEMA CHECKLIST ===' as section,
  'organizations (no slug column)' as requirement,
  CASE 
    WHEN NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'slug')
    THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END as status
UNION ALL
SELECT 
  '=== PRODUCTION SCHEMA CHECKLIST ===' as section,
  'OAuth trigger with SECURITY DEFINER' as requirement,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'handle_new_user' 
      AND security_type = 'DEFINER'
    )
    THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END as status
UNION ALL
SELECT 
  '=== PRODUCTION SCHEMA CHECKLIST ===' as section,
  'RLS policies on all tables' as requirement,
  CASE 
    WHEN (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public') >= 12
    THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END as status;

-- =====================================================
-- SUMMARY
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'DIAGNOSTIC COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Review the output above to find:';
  RAISE NOTICE '  1. Missing OAuth trigger';
  RAISE NOTICE '  2. Missing RLS policies';
  RAISE NOTICE '  3. Schema mismatches';
  RAISE NOTICE '  4. Orphaned auth users without profiles';
  RAISE NOTICE '================================================';
END $$;

