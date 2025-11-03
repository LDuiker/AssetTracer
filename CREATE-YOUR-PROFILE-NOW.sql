-- =====================================================
-- CREATE YOUR PROFILE MANUALLY - STAGING
-- =====================================================
-- This will create your profile if it's missing
-- =====================================================

-- Step 1: Check current status
SELECT 
  '=== CURRENT STATUS ===' as section,
  au.email,
  au.id as auth_id,
  u.id as profile_id,
  u.organization_id,
  CASE 
    WHEN u.id IS NULL THEN '❌ NO PROFILE - WILL CREATE'
    ELSE '✅ PROFILE EXISTS'
  END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
ORDER BY au.created_at DESC;

-- Step 2: Create profiles for ALL orphaned users
DO $$
DECLARE
  new_org_id UUID;
  auth_user_id UUID;
  user_email TEXT;
  user_name TEXT;
  orphaned_count INTEGER := 0;
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
    orphaned_count := orphaned_count + 1;
    
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

    RAISE NOTICE '✅ Profile created for: % (org: %)', user_email, new_org_id;
  END LOOP;
  
  IF orphaned_count = 0 THEN
    RAISE NOTICE '✅ No orphaned users found - all profiles exist';
  ELSE
    RAISE NOTICE '✅ Created % profile(s)', orphaned_count;
  END IF;
END $$;

-- Step 3: Verify all users now have profiles
SELECT 
  '=== AFTER FIX ===' as section,
  au.email,
  u.id as profile_id,
  u.organization_id,
  o.name as org_name,
  '✅ COMPLETE' as status
FROM auth.users au
JOIN users u ON au.id = u.id
JOIN organizations o ON u.organization_id = o.id
ORDER BY au.created_at DESC;

-- Step 4: Verify OAuth trigger for future signups
SELECT 
  '=== TRIGGER STATUS ===' as section,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
    )
    THEN '✅ OAuth trigger installed - future signups will work'
    ELSE '❌ OAuth trigger MISSING - run INSTALL-OAUTH-TRIGGER-NOW.sql'
  END as status;

