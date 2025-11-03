-- =====================================================
-- VERIFY OAUTH TRIGGER ACTUALLY WORKS
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose
-- =====================================================

-- Step 1: Check if trigger exists
SELECT 
  '🎯 TRIGGER CHECK' as step,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 2: Check function details
SELECT 
  '⚙️ FUNCTION CHECK' as step,
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Step 3: Check auth users vs public users
SELECT 
  '📊 USER COUNT COMPARISON' as step,
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM users) as public_users,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM users) as orphaned_count;

-- Step 4: Show orphaned users with details
SELECT 
  '👻 ORPHANED USERS DETAIL' as step,
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- Step 5: Check if tables exist
SELECT 
  '📋 TABLES CHECK' as step,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'organizations')
ORDER BY table_name;

-- Step 6: Check users table structure
SELECT 
  '📋 USERS TABLE COLUMNS' as step,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Step 7: Try to manually test the trigger function
-- This will show if the function has errors
DO $$
DECLARE
  test_result TEXT;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '🧪 TESTING TRIGGER FUNCTION';
  RAISE NOTICE '================================================';
  
  -- Check if function exists
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE NOTICE '✅ Function exists';
    
    -- Check if it's SECURITY DEFINER
    IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user' AND prosecdef = true) THEN
      RAISE NOTICE '✅ Function has SECURITY DEFINER';
    ELSE
      RAISE NOTICE '❌ Function is NOT SECURITY DEFINER - THIS IS THE PROBLEM!';
      RAISE NOTICE '   The trigger cannot bypass RLS without SECURITY DEFINER';
    END IF;
  ELSE
    RAISE NOTICE '❌ Function does NOT exist!';
  END IF;
  
  -- Check if trigger exists
  IF EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') THEN
    RAISE NOTICE '✅ Trigger exists';
  ELSE
    RAISE NOTICE '❌ Trigger does NOT exist!';
  END IF;
  
  RAISE NOTICE '================================================';
END $$;

-- Final diagnosis
DO $$
DECLARE
  v_trigger_exists BOOLEAN;
  v_function_exists BOOLEAN;
  v_security_definer BOOLEAN;
  v_orphaned_count INTEGER;
BEGIN
  -- Check components
  SELECT EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
  INTO v_trigger_exists;
  
  SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
  INTO v_function_exists;
  
  SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user' AND prosecdef = true)
  INTO v_security_definer;
  
  SELECT COUNT(*) INTO v_orphaned_count
  FROM auth.users au
  LEFT JOIN users u ON au.id = u.id
  WHERE u.id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔍 FINAL DIAGNOSIS';
  RAISE NOTICE '================================================';
  
  IF NOT v_function_exists THEN
    RAISE NOTICE '❌ CRITICAL: Function handle_new_user does NOT exist!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FIX: Run INSTALL-OAUTH-TRIGGER-NOW.sql';
  ELSIF NOT v_security_definer THEN
    RAISE NOTICE '❌ CRITICAL: Function exists but lacks SECURITY DEFINER!';
    RAISE NOTICE '   The function cannot create users without SECURITY DEFINER.';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FIX:';
    RAISE NOTICE '   DROP FUNCTION IF EXISTS public.handle_new_user();';
    RAISE NOTICE '   -- Then run INSTALL-OAUTH-TRIGGER-NOW.sql';
  ELSIF NOT v_trigger_exists THEN
    RAISE NOTICE '❌ CRITICAL: Function exists but trigger is NOT installed!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FIX: Run INSTALL-OAUTH-TRIGGER-NOW.sql';
  ELSIF v_orphaned_count > 0 THEN
    RAISE NOTICE '⚠️  Trigger is installed but % orphaned users exist', v_orphaned_count;
    RAISE NOTICE '   This means the trigger is NOT working when users sign in!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 POSSIBLE CAUSES:';
    RAISE NOTICE '   1. Function has errors (check function source above)';
    RAISE NOTICE '   2. RLS policies blocking the trigger';
    RAISE NOTICE '   3. Column name mismatch (name vs full_name)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FIX: Reinstall trigger:';
    RAISE NOTICE '   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;';
    RAISE NOTICE '   DROP FUNCTION IF EXISTS public.handle_new_user();';
    RAISE NOTICE '   -- Then run INSTALL-OAUTH-TRIGGER-NOW.sql';
  ELSE
    RAISE NOTICE '✅ Everything looks good!';
    RAISE NOTICE '   Trigger is installed with SECURITY DEFINER';
    RAISE NOTICE '   No orphaned users';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 If still failing, check:';
    RAISE NOTICE '   - Vercel environment variables';
    RAISE NOTICE '   - Browser console for errors';
    RAISE NOTICE '   - Supabase logs for trigger errors';
  END IF;
  
  RAISE NOTICE '================================================';
END $$;

