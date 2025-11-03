-- =====================================================
-- CHECK IF YOUR PROFILE WAS CREATED
-- =====================================================
-- Run this in Supabase SQL Editor (Staging)
-- https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/sql/new
-- =====================================================

-- Check 1: List all auth.users
SELECT 
  '=== AUTH USERS ===' as section,
  email,
  created_at,
  id
FROM auth.users
ORDER BY created_at DESC;

-- Check 2: List all public.users
SELECT 
  '=== PUBLIC USERS ===' as section,
  email,
  name,
  organization_id,
  id
FROM users
ORDER BY created_at DESC;

-- Check 3: Check for orphaned users (in auth but not public)
SELECT 
  '=== ORPHANED USERS ===' as section,
  au.email,
  au.created_at,
  '❌ NO PROFILE' as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- Check 4: Verify OAuth trigger is installed
SELECT 
  '=== TRIGGER STATUS ===' as section,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
    THEN '✅ Trigger installed'
    ELSE '❌ Trigger MISSING'
  END as status;

-- Check 5: Check trigger function has SECURITY DEFINER
SELECT 
  '=== TRIGGER SECURITY ===' as section,
  proname as function_name,
  CASE 
    WHEN prosecdef THEN '✅ SECURITY DEFINER enabled'
    ELSE '❌ SECURITY DEFINER disabled'
  END as status
FROM pg_proc
WHERE proname = 'handle_new_user';

