-- =====================================================
-- CHECK IF OAUTH TRIGGER IS ACTUALLY WORKING
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose the issue
-- =====================================================

-- Check 1: Is trigger installed?
SELECT 
  '🎯 TRIGGER CHECK' as check_name,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check 2: Is function present with SECURITY DEFINER?
SELECT 
  '⚙️ FUNCTION CHECK' as check_name,
  proname as function_name,
  CASE prosecdef 
    WHEN true THEN '✅ SECURITY DEFINER'
    ELSE '❌ NOT SECURITY DEFINER - THIS IS THE PROBLEM!'
  END as security_status
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check 3: Check for orphaned users (in auth but not in public)
SELECT 
  '👻 ORPHANED USERS' as check_name,
  au.id,
  au.email,
  au.created_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ NO PROFILE - This user is orphaned!'
    ELSE '✅ Has profile'
  END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
ORDER BY au.created_at DESC
LIMIT 5;

-- Check 4: Check users table structure
SELECT 
  '📋 USERS TABLE CHECK' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check 5: Check RLS on users table
SELECT 
  '🔒 RLS CHECK' as check_name,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- Check 6: Check RLS policies on users
SELECT 
  '🛡️ USERS POLICIES' as check_name,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- SPECIFIC CHECK: Try to see if there's a user with the email you just used
DO $$
DECLARE
  v_auth_count integer;
  v_public_count integer;
  v_trigger_exists boolean;
BEGIN
  -- Count auth users
  SELECT COUNT(*) INTO v_auth_count FROM auth.users;
  
  -- Count public users
  SELECT COUNT(*) INTO v_public_count FROM users;
  
  -- Check trigger
  SELECT EXISTS(
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) INTO v_trigger_exists;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔍 DIAGNOSIS SUMMARY';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Auth users (auth.users): %', v_auth_count;
  RAISE NOTICE 'Public users (public.users): %', v_public_count;
  RAISE NOTICE 'Trigger installed: %', v_trigger_exists;
  
  IF v_auth_count > v_public_count THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ PROBLEM FOUND: % orphaned users!', (v_auth_count - v_public_count);
    RAISE NOTICE '   Users exist in auth.users but NOT in public.users';
    RAISE NOTICE '   This means the OAuth trigger is NOT working!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FIX: Run these commands:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Delete orphaned auth users:';
    RAISE NOTICE '   DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM users);';
    RAISE NOTICE '';
    RAISE NOTICE '2. Drop and recreate trigger:';
    RAISE NOTICE '   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;';
    RAISE NOTICE '   DROP FUNCTION IF EXISTS public.handle_new_user();';
    RAISE NOTICE '   -- Then run INSTALL-OAUTH-TRIGGER-NOW.sql';
  ELSIF NOT v_trigger_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ PROBLEM: Trigger is NOT installed!';
    RAISE NOTICE '   Run: INSTALL-OAUTH-TRIGGER-NOW.sql';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ Trigger appears to be working';
    RAISE NOTICE '   Check other issues (RLS policies, Supabase URLs, etc)';
  END IF;
  
  RAISE NOTICE '================================================';
END $$;

-- Show most recent auth user details
SELECT 
  '👤 LATEST AUTH USER' as info,
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

