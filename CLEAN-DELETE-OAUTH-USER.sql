-- =====================================================
-- CLEAN DELETE OAUTH USER
-- =====================================================
-- This script completely removes a user from both auth.users
-- and public.users tables, allowing them to sign up again fresh.
--
-- Run this in your Supabase SQL Editor (Production Database)
-- Replace 'your-email@gmail.com' with the actual email address
-- =====================================================

-- STEP 1: Find the user
-- Run this first to see what exists
SELECT 
  'auth.users' as table_name,
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'your-email@gmail.com'

UNION ALL

SELECT 
  'public.users' as table_name,
  id,
  email,
  created_at
FROM users 
WHERE email = 'your-email@gmail.com';

-- =====================================================
-- STEP 2: Delete from public.users first (if exists)
-- =====================================================
DELETE FROM users 
WHERE email = 'your-email@gmail.com';

-- Expected: 
-- If user profile exists: "DELETE 1"
-- If no profile: "DELETE 0"

-- =====================================================
-- STEP 3: Delete from auth.users
-- =====================================================
DELETE FROM auth.users 
WHERE email = 'your-email@gmail.com';

-- Expected: "DELETE 1"

-- =====================================================
-- STEP 4: Verify deletion
-- =====================================================
-- Run this to confirm everything is deleted
SELECT 
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users 
WHERE email = 'your-email@gmail.com'

UNION ALL

SELECT 
  'public.users' as table_name,
  COUNT(*) as count
FROM users 
WHERE email = 'your-email@gmail.com'

UNION ALL

SELECT 
  'organizations' as table_name,
  COUNT(*) as count
FROM organizations 
WHERE id IN (
  SELECT organization_id 
  FROM users 
  WHERE email = 'your-email@gmail.com'
);

-- Expected: All counts should be 0

-- =====================================================
-- ALTERNATIVE: Complete Delete with Organization
-- =====================================================
-- If you want to also delete the organization (orphaned):

-- First, find the organization
SELECT 
  o.id,
  o.name,
  o.slug,
  (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as user_count
FROM organizations o
WHERE o.id IN (
  SELECT organization_id 
  FROM users 
  WHERE email = 'your-email@gmail.com'
);

-- If user_count = 0 or 1 (only this user), you can delete it:
DELETE FROM organizations
WHERE id IN (
  SELECT organization_id 
  FROM users 
  WHERE email = 'your-email@gmail.com'
)
AND (
  SELECT COUNT(*) 
  FROM users 
  WHERE organization_id = organizations.id
) <= 1;

-- Then delete the user records as above

-- =====================================================
-- COMPLETE CLEANUP (ALL IN ONE)
-- =====================================================
-- Run this block to do everything at once:

DO $$
DECLARE
  user_org_id UUID;
  user_auth_id UUID;
  target_email TEXT := 'your-email@gmail.com'; -- CHANGE THIS!
BEGIN
  -- Get user's organization ID
  SELECT organization_id, id INTO user_org_id, user_auth_id
  FROM users
  WHERE email = target_email
  LIMIT 1;

  -- Delete from public.users
  DELETE FROM users WHERE email = target_email;
  RAISE NOTICE 'Deleted user profile for: %', target_email;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE email = target_email;
  RAISE NOTICE 'Deleted auth user for: %', target_email;

  -- Delete organization if it was found and has no other users
  IF user_org_id IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM users WHERE organization_id = user_org_id) = 0 THEN
      DELETE FROM organizations WHERE id = user_org_id;
      RAISE NOTICE 'Deleted orphaned organization: %', user_org_id;
    ELSE
      RAISE NOTICE 'Organization has other users, not deleting';
    END IF;
  END IF;

  RAISE NOTICE '✅ Cleanup complete! User can now sign up fresh.';
END $$;

-- =====================================================
-- AFTER DELETION
-- =====================================================
-- Now you can sign in with Google OAuth again:
-- 1. Go to your app
-- 2. Click "Continue with Google"
-- 3. The trigger will create a fresh user profile
-- 4. You'll be redirected to dashboard
-- =====================================================

-- =====================================================
-- TROUBLESHOOTING: If you get permission errors
-- =====================================================
-- If you get "must be owner of relation" errors:
-- 1. Make sure you're running as the database owner
-- 2. Or use the Supabase admin interface instead
-- 3. Or grant yourself temporary permissions:

-- Grant permissions (run as superuser/owner):
GRANT ALL ON auth.users TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON organizations TO authenticated;

-- Then try the delete again
-- After deletion, you can revoke if needed:
REVOKE ALL ON auth.users FROM authenticated;

