-- =====================================================
-- VERIFY STAGING DATABASE SCHEMA
-- =====================================================
-- Run this in your STAGING database after setup
-- This checks that everything is properly configured
-- =====================================================

-- Check 1: Count tables
SELECT 
  '📋 TABLE COUNT CHECK' as check_name,
  COUNT(*) as actual_count,
  '14' as expected_count,
  CASE 
    WHEN COUNT(*) = 14 THEN '✅ PASS'
    ELSE '❌ FAIL - Missing tables!'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check 2: List all tables
SELECT 
  '📋 ALL TABLES' as section,
  table_name,
  '✅' as exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check 3: Verify OAuth trigger
SELECT 
  '🎯 OAUTH TRIGGER' as section,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' THEN '✅ INSTALLED'
    ELSE '❌ PROBLEM'
  END as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check 4: Verify trigger function
SELECT 
  '⚙️ TRIGGER FUNCTION' as section,
  proname as function_name,
  CASE prosecdef 
    WHEN true THEN '✅ SECURITY DEFINER'
    ELSE '❌ NOT SECURITY DEFINER'
  END as security_status
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check 5: Verify RLS is enabled
SELECT 
  '🔒 ROW LEVEL SECURITY' as section,
  tablename,
  CASE rowsecurity 
    WHEN true THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check 6: Count RLS policies
SELECT 
  '🛡️ RLS POLICIES' as section,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ HAS POLICIES'
    ELSE '❌ NO POLICIES'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check 7: Verify foreign keys
SELECT 
  '🔗 FOREIGN KEYS' as section,
  COUNT(*) as fk_count,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ PASS'
    ELSE '⚠️ CHECK - Expected ~15 foreign keys'
  END as status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';

-- Check 8: Verify indexes
SELECT 
  '📇 INDEXES' as section,
  COUNT(*) as index_count,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ PASS'
    ELSE '⚠️ CHECK - Expected ~25 indexes'
  END as status
FROM pg_indexes
WHERE schemaname = 'public';

-- Check 9: Verify storage buckets
SELECT 
  '📦 STORAGE BUCKETS' as section,
  id,
  name,
  CASE public 
    WHEN true THEN '✅ PUBLIC'
    ELSE '🔒 PRIVATE'
  END as public_status
FROM storage.buckets
WHERE name = 'company-logos';

-- Check 10: Record counts (should be 0 for fresh staging)
DO $$
DECLARE
  t record;
  v_count integer;
  v_warning boolean := false;
BEGIN
  RAISE NOTICE '📊 RECORD COUNTS (should be 0 for fresh staging)';
  RAISE NOTICE '==================================================';
  
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', t.table_name) INTO v_count;
    
    IF v_count > 0 THEN
      RAISE NOTICE '⚠️  % : % records (expected 0)', t.table_name, v_count;
      v_warning := true;
    ELSE
      RAISE NOTICE '✅ % : 0 records', t.table_name;
    END IF;
  END LOOP;
  
  IF v_warning THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  WARNING: Some tables have data.';
    RAISE NOTICE '    This is normal if you already tested sign-ups.';
    RAISE NOTICE '    Run NUCLEAR-FIX-STAGING-NOW.sql to reset.';
  END IF;
END $$;

-- Check 11: Summary
SELECT 
  '✅ VERIFICATION SUMMARY' as section,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as triggers,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies,
  (SELECT COUNT(*) FROM storage.buckets WHERE name = 'company-logos') as buckets;

-- Final status
DO $$
DECLARE
  v_table_count integer;
  v_trigger_count integer;
  v_policy_count integer;
  v_all_good boolean := true;
BEGIN
  SELECT COUNT(*) INTO v_table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  SELECT COUNT(*) INTO v_trigger_count 
  FROM information_schema.triggers 
  WHERE trigger_name = 'on_auth_user_created';
  
  SELECT COUNT(*) INTO v_policy_count 
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '🎯 FINAL VERIFICATION RESULT';
  RAISE NOTICE '================================================';
  
  IF v_table_count = 14 THEN
    RAISE NOTICE '✅ Tables: % (expected 14)', v_table_count;
  ELSE
    RAISE NOTICE '❌ Tables: % (expected 14)', v_table_count;
    v_all_good := false;
  END IF;
  
  IF v_trigger_count = 1 THEN
    RAISE NOTICE '✅ OAuth Trigger: Installed';
  ELSE
    RAISE NOTICE '❌ OAuth Trigger: MISSING!';
    v_all_good := false;
  END IF;
  
  IF v_policy_count >= 14 THEN
    RAISE NOTICE '✅ RLS Policies: % policies', v_policy_count;
  ELSE
    RAISE NOTICE '⚠️  RLS Policies: Only % policies (expected 14+)', v_policy_count;
  END IF;
  
  RAISE NOTICE '================================================';
  
  IF v_all_good THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED!';
    RAISE NOTICE '';
    RAISE NOTICE 'Your staging database is ready to use.';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Configure Supabase Auth URLs in dashboard';
    RAISE NOTICE '2. Update Vercel environment variables';
    RAISE NOTICE '3. Force Vercel redeploy (uncheck cache)';
    RAISE NOTICE '4. Test Google OAuth sign-in';
  ELSE
    RAISE NOTICE '❌ SOME CHECKS FAILED!';
    RAISE NOTICE '';
    RAISE NOTICE 'FIX NEEDED:';
    IF v_table_count != 14 THEN
      RAISE NOTICE '- Re-run SETUP-STAGING-FROM-PRODUCTION.sql';
    END IF;
    IF v_trigger_count != 1 THEN
      RAISE NOTICE '- Run INSTALL-OAUTH-TRIGGER-NOW.sql';
    END IF;
    IF v_policy_count < 14 THEN
      RAISE NOTICE '- Run FIX-RLS-POLICIES-V2.sql';
    END IF;
  END IF;
  
  RAISE NOTICE '================================================';
END $$;

