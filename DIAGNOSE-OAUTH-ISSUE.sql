-- =====================================================
-- DIAGNOSE OAUTH ISSUE
-- =====================================================
-- Run this in PRODUCTION to see what's wrong
-- =====================================================

-- Step 1: Check how many users in auth.users
SELECT 
  '=== AUTH USERS ===' as section,
  COUNT(*) as total_auth_users
FROM auth.users;

-- Step 2: Show all auth users
SELECT 
  '=== ALL AUTH USERS ===' as section,
  id,
  email,
  created_at,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
ORDER BY created_at DESC;

-- Step 3: Check how many users in public.users
SELECT 
  '=== PUBLIC USERS ===' as section,
  COUNT(*) as total_public_users
FROM users;

-- Step 4: Show all public users
SELECT 
  '=== ALL PUBLIC USERS ===' as section,
  id,
  email,
  name,
  organization_id,
  created_at
FROM users
ORDER BY created_at DESC;

-- Step 5: Check for users in auth but NOT in public
SELECT 
  '=== USERS WITHOUT PROFILES ===' as section,
  au.id,
  au.email,
  au.created_at,
  'Missing profile!' as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- Step 6: Check if trigger exists
SELECT 
  '=== TRIGGER STATUS ===' as section,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 7: Check if trigger function exists
SELECT 
  '=== TRIGGER FUNCTION ===' as section,
  proname as function_name,
  prosecdef as is_security_definer,
  CASE WHEN prosecdef THEN 'Yes (Good!)' ELSE 'No (Bad!)' END as security_status
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Step 8: Check organizations
SELECT 
  '=== ORGANIZATIONS ===' as section,
  COUNT(*) as total_organizations
FROM organizations;

-- Step 9: Show all organizations
SELECT 
  '=== ALL ORGANIZATIONS ===' as section,
  id,
  name,
  created_at
FROM organizations
ORDER BY created_at DESC;

-- =====================================================
-- SUMMARY
-- =====================================================
DO $$
DECLARE
  auth_count INTEGER;
  public_count INTEGER;
  org_count INTEGER;
  trigger_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO public_count FROM users;
  SELECT COUNT(*) INTO org_count FROM organizations;
  
  SELECT EXISTS(
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) INTO trigger_exists;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'DIAGNOSIS SUMMARY';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Auth users: %', auth_count;
  RAISE NOTICE 'Public users: %', public_count;
  RAISE NOTICE 'Organizations: %', org_count;
  RAISE NOTICE 'Trigger installed: %', CASE WHEN trigger_exists THEN 'YES' ELSE 'NO' END;
  RAISE NOTICE '';
  
  IF auth_count > public_count THEN
    RAISE NOTICE '⚠️ PROBLEM: % users in auth.users but only % profiles in public.users', auth_count, public_count;
    RAISE NOTICE '   Missing % profiles!', (auth_count - public_count);
  ELSIF public_count = auth_count THEN
    RAISE NOTICE '✅ Good: All auth users have profiles';
  END IF;
  
  IF NOT trigger_exists THEN
    RAISE NOTICE '⚠️ PROBLEM: Trigger not installed!';
    RAISE NOTICE '   Run: INSTALL-OAUTH-TRIGGER-NOW.sql';
  ELSE
    RAISE NOTICE '✅ Good: Trigger is installed';
  END IF;
  
  IF org_count = 0 THEN
    RAISE NOTICE '⚠️ PROBLEM: No organizations exist!';
    RAISE NOTICE '   Run: FIX-NEW-USER-NOW.sql';
  ELSIF org_count < public_count THEN
    RAISE NOTICE '⚠️ WARNING: % users but only % organizations', public_count, org_count;
  ELSE
    RAISE NOTICE '✅ Good: Organizations exist';
  END IF;
  
  RAISE NOTICE '================================================';
END $$;

