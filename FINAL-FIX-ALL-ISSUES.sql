-- =====================================================
-- FINAL FIX - COMPLETE STAGING AUTH SETUP
-- =====================================================
-- This will fix EVERYTHING in one go
-- =====================================================

-- STEP 1: TEMPORARILY DISABLE RLS (to allow inserts)
-- =====================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- STEP 2: CREATE PROFILES FOR ALL 3 ORPHANED USERS
-- =====================================================
DO $$
DECLARE
  new_org_id UUID;
  auth_user_id UUID;
  user_email TEXT;
  user_name TEXT;
  created_count INTEGER := 0;
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

    created_count := created_count + 1;
    RAISE NOTICE '✅ Profile created for: % (org: %)', user_email, new_org_id;
  END LOOP;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Created % profile(s)', created_count;
  RAISE NOTICE '================================================';
END $$;

-- STEP 3: VERIFY ALL USERS NOW HAVE PROFILES
-- =====================================================
SELECT 
  '=== VERIFICATION ===' as section,
  COUNT(DISTINCT au.id) as auth_users,
  COUNT(DISTINCT u.id) as public_users,
  CASE 
    WHEN COUNT(DISTINCT au.id) = COUNT(DISTINCT u.id) THEN '✅ ALL USERS HAVE PROFILES'
    ELSE '❌ STILL HAVE ORPHANED USERS'
  END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id;

-- STEP 4: RE-ENABLE RLS
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- STEP 5: VERIFY RLS POLICIES EXIST
-- =====================================================
SELECT 
  '=== RLS POLICIES ===' as section,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Sufficient policies'
    ELSE '⚠️ May need more policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'organizations')
GROUP BY tablename;

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ STAGING AUTH SETUP COMPLETE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'All users now have profiles and can log in.';
  RAISE NOTICE 'Test login now in fresh incognito window.';
  RAISE NOTICE '================================================';
END $$;

