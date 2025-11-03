-- =====================================================
-- COMPLETE STAGING AUTH DIAGNOSTIC
-- =====================================================
-- Run this in Supabase SQL Editor (Staging)
-- This will verify EVERYTHING is configured correctly
-- =====================================================

-- =====================================================
-- PART 1: Database Configuration
-- =====================================================

-- Check 1: OAuth Trigger Installation
SELECT 
  '=== OAUTH TRIGGER ===' as section,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
    )
    THEN '✅ Trigger EXISTS'
    ELSE '❌ Trigger MISSING'
  END as status;

-- Check 2: Trigger Function Security
SELECT 
  '=== TRIGGER SECURITY ===' as section,
  p.proname AS function_name,
  CASE 
    WHEN p.prosecdef THEN '✅ SECURITY DEFINER SET'
    ELSE '❌ SECURITY DEFINER MISSING'
  END AS status
FROM pg_proc p
WHERE p.proname = 'handle_new_user';

-- Check 3: Auth Users vs Public Users
SELECT 
  '=== USER PROFILE STATUS ===' as section,
  COUNT(DISTINCT au.id) as auth_users_count,
  COUNT(DISTINCT u.id) as public_users_count,
  COUNT(DISTINCT au.id) - COUNT(DISTINCT u.id) as orphaned_count
FROM auth.users au
LEFT JOIN users u ON au.id = u.id;

-- Check 4: List All Users (auth vs public)
SELECT 
  '=== USER DETAILS ===' as section,
  au.email,
  au.created_at as auth_created,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ HAS PROFILE'
    ELSE '❌ NO PROFILE (ORPHANED)'
  END as profile_status,
  u.organization_id,
  o.name as org_name
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY au.created_at DESC;

-- Check 5: RLS Status
SELECT 
  '=== RLS STATUS ===' as section,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'organizations')
ORDER BY tablename;

-- Check 6: RLS Policy Count
SELECT 
  '=== RLS POLICIES ===' as section,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'organizations')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- PART 2: Expected Results
-- =====================================================
-- ✅ Trigger exists with SECURITY DEFINER
-- ✅ All auth.users have corresponding public.users (orphaned_count = 0)
-- ✅ RLS is ENABLED on users and organizations
-- ✅ Each table has 4+ policies
-- =====================================================

-- =====================================================
-- PART 3: If Orphaned Users Found, Run This:
-- =====================================================
-- Uncomment and run if orphaned users are found above

/*
DO $$
DECLARE
  new_org_id UUID;
  auth_user_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  FOR auth_user_id, user_email, user_name IN
    SELECT 
      au.id,
      au.email,
      COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1)
      )
    FROM auth.users au
    LEFT JOIN users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    -- Create organization
    INSERT INTO organizations (
      name, default_currency, timezone, date_format
    )
    VALUES (
      user_name || '''s Organization',
      'USD', 'UTC', 'MM/DD/YYYY'
    )
    RETURNING id INTO new_org_id;

    -- Create user profile
    INSERT INTO users (id, email, name, organization_id)
    VALUES (auth_user_id, user_email, user_name, new_org_id);

    RAISE NOTICE '✅ Profile created for: %', user_email;
  END LOOP;
END $$;
*/

