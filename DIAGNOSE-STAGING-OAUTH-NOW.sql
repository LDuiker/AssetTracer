-- =====================================================
-- DIAGNOSE STAGING OAUTH ISSUE - RUN THIS NOW
-- =====================================================
-- Run this in your STAGING Supabase SQL Editor
-- This checks why OAuth redirects to landing page
-- =====================================================

-- Check 1: Is OAuth trigger installed?
SELECT 
  '🎯 STEP 1: OAuth Trigger Check' as step,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
    THEN '✅ INSTALLED'
    ELSE '❌ MISSING - This is your problem!'
  END as status;

-- Check 2: Is trigger function present?
SELECT 
  '⚙️ STEP 2: Trigger Function Check' as step,
  proname as function_name,
  CASE prosecdef 
    WHEN true THEN '✅ SECURITY DEFINER'
    ELSE '❌ NOT SECURITY DEFINER'
  END as security_status
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check 3: Do tables exist?
SELECT 
  '📋 STEP 3: Tables Check' as step,
  COUNT(*) as table_count,
  CASE 
    WHEN COUNT(*) = 14 THEN '✅ All 14 tables exist'
    WHEN COUNT(*) = 0 THEN '❌ NO TABLES - Database is empty!'
    ELSE '⚠️ Only ' || COUNT(*) || ' tables (expected 14)'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check 4: List all tables
SELECT 
  '📋 STEP 4: Table List' as step,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check 5: Check for orphaned auth users
SELECT 
  '👻 STEP 5: Orphaned Users Check' as step,
  au.id,
  au.email,
  au.created_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ ORPHANED - No profile created'
    ELSE '✅ Has profile'
  END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
ORDER BY au.created_at DESC;

-- Check 6: RLS status
SELECT 
  '🔒 STEP 6: RLS Check' as step,
  tablename,
  CASE rowsecurity 
    WHEN true THEN '✅'
    ELSE '❌'
  END as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'organizations')
ORDER BY tablename;

-- Check 7: RLS policies count
SELECT 
  '🛡️ STEP 7: RLS Policies' as step,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 14 THEN '✅ Policies exist'
    WHEN COUNT(*) = 0 THEN '❌ NO POLICIES'
    ELSE '⚠️ Only ' || COUNT(*) || ' policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public';

-- DIAGNOSIS SUMMARY
DO $$
DECLARE
  v_trigger_exists boolean;
  v_table_count integer;
  v_orphaned_count integer;
  v_policy_count integer;
BEGIN
  -- Check trigger
  SELECT EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
  INTO v_trigger_exists;
  
  -- Check tables
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  -- Check orphaned users
  SELECT COUNT(*) INTO v_orphaned_count
  FROM auth.users au
  LEFT JOIN users u ON au.id = u.id
  WHERE u.id IS NULL;
  
  -- Check policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔍 DIAGNOSIS SUMMARY';
  RAISE NOTICE '================================================';
  
  IF NOT v_trigger_exists THEN
    RAISE NOTICE '❌ PROBLEM FOUND: OAuth trigger NOT installed';
    RAISE NOTICE '   → This is why users are redirected to landing page';
    RAISE NOTICE '   → FIX: Run INSTALL-OAUTH-TRIGGER-NOW.sql';
  ELSE
    RAISE NOTICE '✅ OAuth trigger is installed';
  END IF;
  
  IF v_table_count = 0 THEN
    RAISE NOTICE '❌ PROBLEM FOUND: Database is EMPTY';
    RAISE NOTICE '   → No tables exist';
    RAISE NOTICE '   → FIX: Run SETUP-STAGING-FROM-PRODUCTION.sql';
  ELSIF v_table_count < 14 THEN
    RAISE NOTICE '⚠️  WARNING: Only % tables exist (expected 14)', v_table_count;
    RAISE NOTICE '   → Some tables are missing';
    RAISE NOTICE '   → FIX: Run SETUP-STAGING-FROM-PRODUCTION.sql';
  ELSE
    RAISE NOTICE '✅ All 14 tables exist';
  END IF;
  
  IF v_orphaned_count > 0 THEN
    RAISE NOTICE '❌ PROBLEM FOUND: % orphaned users', v_orphaned_count;
    RAISE NOTICE '   → Users in auth.users but NOT in public.users';
    RAISE NOTICE '   → This causes redirect to landing page';
    RAISE NOTICE '   → FIX: Run NUCLEAR-FIX-STAGING-NOW.sql to clean up';
  ELSE
    RAISE NOTICE '✅ No orphaned users';
  END IF;
  
  IF v_policy_count = 0 THEN
    RAISE NOTICE '❌ PROBLEM FOUND: No RLS policies';
    RAISE NOTICE '   → FIX: Run FIX-RLS-POLICIES-V2.sql';
  ELSIF v_policy_count < 14 THEN
    RAISE NOTICE '⚠️  WARNING: Only % RLS policies (expected 14+)', v_policy_count;
  ELSE
    RAISE NOTICE '✅ RLS policies configured';
  END IF;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  
  -- Give specific fix instructions
  IF NOT v_trigger_exists OR v_orphaned_count > 0 THEN
    RAISE NOTICE '🔧 IMMEDIATE FIX NEEDED:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Delete test user:';
    RAISE NOTICE '   DELETE FROM auth.users WHERE email = ''your-email@gmail.com'';';
    RAISE NOTICE '';
    RAISE NOTICE '2. Install OAuth trigger:';
    RAISE NOTICE '   Run: INSTALL-OAUTH-TRIGGER-NOW.sql';
    RAISE NOTICE '';
    RAISE NOTICE '3. Fix RLS policies:';
    RAISE NOTICE '   Run: FIX-RLS-POLICIES-V2.sql';
    RAISE NOTICE '';
    RAISE NOTICE '4. Clear browser cache and try again in incognito';
  ELSE
    RAISE NOTICE '✅ Everything looks good!';
    RAISE NOTICE '';
    RAISE NOTICE 'If still failing, check:';
    RAISE NOTICE '- Supabase Site URL matches Vercel URL';
    RAISE NOTICE '- Supabase Redirect URLs include staging URL';
    RAISE NOTICE '- Vercel env vars point to staging database';
  END IF;
  
  RAISE NOTICE '================================================';
END $$;

