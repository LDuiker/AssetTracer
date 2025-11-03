-- =====================================================
-- CHECK WHAT HAPPENS WHEN YOU TRY TO LOGIN
-- =====================================================
-- Run this AFTER trying to sign in with Google
-- =====================================================

-- Step 1: Check if user was created in auth.users
SELECT 
  '👤 AUTH USERS (Last 3)' as step,
  id,
  email,
  created_at,
  last_sign_in_at,
  confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 3;

-- Step 2: Check if profile was created in public.users
SELECT 
  '👤 PUBLIC USERS (Last 3)' as step,
  id,
  email,
  name,
  organization_id,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 3;

-- Step 3: Check orphaned users
SELECT 
  '👻 ORPHANED USERS' as step,
  au.id,
  au.email,
  au.created_at as auth_created_at,
  'NO PROFILE IN PUBLIC.USERS!' as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- Step 4: Check organizations created
SELECT 
  '🏢 ORGANIZATIONS (Last 3)' as step,
  id,
  name,
  created_at
FROM organizations
ORDER BY created_at DESC
LIMIT 3;

-- Step 5: Check if trigger is actually firing
-- Look for users created in the last hour
SELECT 
  '🕐 RECENT ACTIVITY (Last Hour)' as step,
  'Auth users created: ' || COUNT(*) as activity
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
  '🕐 RECENT ACTIVITY (Last Hour)' as step,
  'Public users created: ' || COUNT(*) as activity
FROM users
WHERE created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
  '🕐 RECENT ACTIVITY (Last Hour)' as step,
  'Organizations created: ' || COUNT(*) as activity
FROM organizations
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Step 6: Detailed diagnosis
DO $$
DECLARE
  v_auth_count INTEGER;
  v_public_count INTEGER;
  v_orphaned_count INTEGER;
  v_recent_auth INTEGER;
  v_recent_public INTEGER;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO v_auth_count FROM auth.users;
  SELECT COUNT(*) INTO v_public_count FROM users;
  SELECT COUNT(*) INTO v_orphaned_count FROM auth.users au LEFT JOIN users u ON au.id = u.id WHERE u.id IS NULL;
  SELECT COUNT(*) INTO v_recent_auth FROM auth.users WHERE created_at > NOW() - INTERVAL '1 hour';
  SELECT COUNT(*) INTO v_recent_public FROM users WHERE created_at > NOW() - INTERVAL '1 hour';
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔍 LOGIN DIAGNOSTIC RESULTS';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total auth users: %', v_auth_count;
  RAISE NOTICE 'Total public users: %', v_public_count;
  RAISE NOTICE 'Orphaned users: %', v_orphaned_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Recent (last hour):';
  RAISE NOTICE '  Auth users created: %', v_recent_auth;
  RAISE NOTICE '  Public users created: %', v_recent_public;
  RAISE NOTICE '';
  
  IF v_recent_auth > 0 AND v_recent_public = 0 THEN
    RAISE NOTICE '❌ PROBLEM IDENTIFIED:';
    RAISE NOTICE '   User was created in auth.users';
    RAISE NOTICE '   BUT trigger did NOT create profile in public.users!';
    RAISE NOTICE '';
    RAISE NOTICE '   This means the trigger is NOT working despite being installed.';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 POSSIBLE CAUSES:';
    RAISE NOTICE '   1. Trigger function has errors (check function code)';
    RAISE NOTICE '   2. RLS policies blocking the INSERT';
    RAISE NOTICE '   3. Column mismatch in users table';
    RAISE NOTICE '   4. Function not set as SECURITY DEFINER';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FIX: Delete orphaned user and reinstall trigger:';
    RAISE NOTICE '   DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM users);';
    RAISE NOTICE '   -- Then reinstall trigger with SECURITY DEFINER';
  ELSIF v_recent_auth = 0 THEN
    RAISE NOTICE '⚠️  NO RECENT AUTH ACTIVITY';
    RAISE NOTICE '   No users created in the last hour.';
    RAISE NOTICE '';
    RAISE NOTICE '   This could mean:';
    RAISE NOTICE '   1. OAuth is not completing (check Supabase auth logs)';
    RAISE NOTICE '   2. Session is not being created';
    RAISE NOTICE '   3. Redirect URL is wrong';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CHECK:';
    RAISE NOTICE '   - Browser console for errors';
    RAISE NOTICE '   - Supabase Auth logs (Dashboard > Auth > Logs)';
    RAISE NOTICE '   - Vercel environment variables';
  ELSIF v_recent_auth = v_recent_public THEN
    RAISE NOTICE '✅ TRIGGER IS WORKING!';
    RAISE NOTICE '   Users are being created successfully.';
    RAISE NOTICE '';
    RAISE NOTICE '   If you''re still being redirected to login, the issue is:';
    RAISE NOTICE '   1. Session not persisting in browser';
    RAISE NOTICE '   2. Middleware blocking access';
    RAISE NOTICE '   3. Cookie issue';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 TRY:';
    RAISE NOTICE '   - Clear ALL browser cookies';
    RAISE NOTICE '   - Use different browser';
    RAISE NOTICE '   - Check browser console for errors';
  END IF;
  
  RAISE NOTICE '================================================';
END $$;

