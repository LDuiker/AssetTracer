-- =====================================================
-- TEST RLS AS CURRENT USER
-- =====================================================
-- Run this while LOGGED IN to test if RLS is working
-- This simulates what the app does when loading dashboard
-- =====================================================

-- Show current auth user
SELECT 
  '=== CURRENT AUTH USER ===' as section,
  auth.uid() as user_id,
  auth.email() as email;

-- Test: Can I read my own user profile?
SELECT 
  '=== MY USER PROFILE ===' as section,
  id,
  email,
  name,
  organization_id,
  role
FROM users
WHERE id = auth.uid();

-- Test: Can I read my organization?
SELECT 
  '=== MY ORGANIZATION ===' as section,
  o.id,
  o.name,
  o.default_currency,
  o.timezone
FROM organizations o
WHERE o.id = (SELECT organization_id FROM users WHERE id = auth.uid());

-- Test: Can I do a JOIN (what the app does)?
SELECT 
  '=== JOIN TEST (WHAT APP DOES) ===' as section,
  u.id as user_id,
  u.email,
  u.name,
  u.organization_id,
  o.name as org_name,
  o.default_currency
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.id = auth.uid();

-- Show all policies on users table
SELECT 
  '=== POLICIES ON USERS TABLE ===' as section,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Show all policies on organizations table
SELECT 
  '=== POLICIES ON ORGANIZATIONS TABLE ===' as section,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY policyname;

-- Show RLS status for all tables
SELECT 
  '=== RLS STATUS ===' as section,
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

