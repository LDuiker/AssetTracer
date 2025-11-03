-- =====================================================
-- CHECK USER ROLES - STAGING
-- =====================================================
-- Run this to check current state of user roles
-- =====================================================

-- Check 1: Does the role column exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    ) 
    THEN '✅ users.role column exists'
    ELSE '❌ users.role column MISSING'
  END as role_column_status;

-- Check 2: Show all users and their roles
SELECT 
  u.id,
  u.email,
  u.name,
  COALESCE(u.role, '(no role set)') as role,
  o.name as organization_name,
  u.created_at,
  (SELECT COUNT(*) FROM users WHERE organization_id = u.organization_id) as team_size
FROM users u
LEFT JOIN organizations o ON o.id = u.organization_id
ORDER BY u.created_at DESC;

-- Check 3: Count users by role
SELECT 
  COALESCE(role, '(null)') as role,
  COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY user_count DESC;

-- Check 4: Does organization_members table exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'organization_members'
    ) 
    THEN '✅ organization_members table exists'
    ELSE 'ℹ️  organization_members table does not exist (this is OK)'
  END as org_members_table_status;

-- Check 5: Show organization_members if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organization_members'
  ) THEN
    RAISE NOTICE 'Organization members table found!';
  ELSE
    RAISE NOTICE 'Organization members table not found (role tracked in users.role only)';
  END IF;
END $$;

-- Check 6: Show OAuth trigger status
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
    ) 
    THEN '✅ OAuth trigger exists'
    ELSE '❌ OAuth trigger MISSING'
  END as trigger_status;

-- Check 7: Show the current trigger function (if it exists)
SELECT 
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  CASE 
    WHEN p.prosrc LIKE '%role%' THEN '✅ Function mentions "role"'
    ELSE '⚠️  Function does NOT mention "role"'
  END as handles_role,
  CASE 
    WHEN p.prosrc LIKE '%''owner''%' THEN '✅ Function sets role to "owner"'
    ELSE '❌ Function does NOT set role to "owner"'
  END as sets_owner_role
FROM pg_proc p
WHERE p.proname = 'handle_new_user';

-- Check 8: Users who should probably be owners
-- (They are the only member of their organization)
SELECT 
  '⚠️  Users who should probably be OWNER:' as warning,
  u.email,
  u.name,
  COALESCE(u.role, '(no role)') as current_role,
  o.name as organization_name,
  (SELECT COUNT(*) FROM users WHERE organization_id = u.organization_id) as team_size
FROM users u
LEFT JOIN organizations o ON o.id = u.organization_id
WHERE (u.role IS NULL OR u.role = 'member')
  AND NOT EXISTS (
    SELECT 1 FROM users u2 
    WHERE u2.organization_id = u.organization_id 
    AND u2.id != u.id
  )
ORDER BY u.created_at DESC;

-- =====================================================
-- Summary
-- =====================================================
DO $$
DECLARE
  role_column_exists BOOLEAN;
  trigger_exists BOOLEAN;
  users_with_no_role INTEGER;
  total_users INTEGER;
BEGIN
  -- Check role column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) INTO role_column_exists;
  
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) INTO trigger_exists;
  
  -- Count users without proper roles
  SELECT COUNT(*) INTO total_users FROM users;
  SELECT COUNT(*) INTO users_with_no_role 
  FROM users 
  WHERE role IS NULL OR role = 'member';
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'USER ROLE SYSTEM STATUS';
  RAISE NOTICE '================================================';
  
  IF role_column_exists THEN
    RAISE NOTICE '✅ Role column exists';
  ELSE
    RAISE NOTICE '❌ Role column MISSING - needs to be added';
  END IF;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ OAuth trigger exists';
  ELSE
    RAISE NOTICE '❌ OAuth trigger MISSING - needs to be installed';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Users: % total', total_users;
  
  IF users_with_no_role > 0 THEN
    RAISE NOTICE '⚠️  % users need role update (currently member or null)', users_with_no_role;
  ELSE
    RAISE NOTICE '✅ All users have proper roles assigned';
  END IF;
  
  RAISE NOTICE '================================================';
  
  IF NOT role_column_exists OR NOT trigger_exists OR users_with_no_role > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 ACTION REQUIRED: Run FIX-USER-ROLE-STAGING.sql';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ Everything looks good!';
    RAISE NOTICE '';
  END IF;
END $$;

