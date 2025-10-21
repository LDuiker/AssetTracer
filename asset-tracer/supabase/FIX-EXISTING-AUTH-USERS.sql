-- =====================================================
-- Fix Existing Authenticated Users Without Profiles
-- =====================================================
-- This script finds auth users without profiles and creates them
-- =====================================================

-- Step 1: See who needs fixing
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  au.raw_user_meta_data->>'full_name' as full_name,
  CASE 
    WHEN u.id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ Has Profile'
  END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
ORDER BY au.created_at DESC;

-- Step 2: Create profiles for users without them
DO $$
DECLARE
  auth_user RECORD;
  new_org_id uuid;
  user_name text;
  org_name text;
  fixed_count int := 0;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Fixing authenticated users without profiles...';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  
  -- Loop through auth users without profiles
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    fixed_count := fixed_count + 1;
    
    RAISE NOTICE 'Processing user: %', auth_user.email;
    
    -- Get user name from metadata
    user_name := COALESCE(
      auth_user.raw_user_meta_data->>'full_name',
      auth_user.raw_user_meta_data->>'name',
      SPLIT_PART(auth_user.email, '@', 1)
    );
    
    -- Create organization name
    org_name := INITCAP(SPLIT_PART(auth_user.email, '@', 1)) || '''s Organization';
    
    RAISE NOTICE '  Creating organization: %', org_name;
    
    -- Create organization
    INSERT INTO organizations (
      name, 
      default_currency,
      timezone,
      date_format,
      created_at,
      updated_at
    )
    VALUES (
      org_name,
      'USD',
      'America/New_York',
      'MM/DD/YYYY',
      NOW(),
      NOW()
    )
    RETURNING id INTO new_org_id;
    
    RAISE NOTICE '  Organization created: %', new_org_id;
    RAISE NOTICE '  Creating user profile...';
    
    -- Create user profile
    INSERT INTO users (
      id, 
      email, 
      name, 
      organization_id,
      created_at,
      updated_at
    )
    VALUES (
      auth_user.id, 
      auth_user.email,
      user_name,
      new_org_id,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '  ✅ Profile created for: %', auth_user.email;
    RAISE NOTICE '';
  END LOOP;
  
  IF fixed_count = 0 THEN
    RAISE NOTICE '✅ No users need fixing - all authenticated users have profiles!';
  ELSE
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Fixed % user(s) successfully!', fixed_count;
    RAISE NOTICE '================================================';
  END IF;
END $$;

-- Step 3: Verify all users now have profiles
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(u.id) as users_with_profiles,
  COUNT(*) - COUNT(u.id) as users_without_profiles
FROM auth.users au
LEFT JOIN users u ON au.id = u.id;

-- Step 4: Show all users with their status
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  u.organization_id,
  o.name as organization_name,
  u.created_at
FROM users u
JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at DESC;

