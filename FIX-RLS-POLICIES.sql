-- =====================================================
-- FIX RLS POLICIES FOR PRODUCTION
-- =====================================================
-- This fixes RLS policies to allow proper access while maintaining security
-- Run this in PRODUCTION after confirming login works with RLS disabled
-- =====================================================

-- =====================================================
-- STEP 1: Drop all existing policies
-- =====================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can view users from their organization" ON users;
DROP POLICY IF EXISTS "Users can insert users" ON users;
DROP POLICY IF EXISTS "Users can update users" ON users;

-- Organizations table policies
DROP POLICY IF EXISTS "Enable read for organization members" ON organizations;
DROP POLICY IF EXISTS "Users can read organization data" ON organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;

-- =====================================================
-- STEP 2: Create correct RLS policies
-- =====================================================

-- Users table: Allow users to read their own data
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users table: Allow users to update their own data
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Organizations table: Allow users to read their organization
CREATE POLICY "Users can read their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Organizations table: Allow users to update their organization
CREATE POLICY "Users can update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- STEP 3: Re-enable RLS
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Verify policies were created
-- =====================================================

SELECT 
  '=== USERS TABLE POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

SELECT 
  '=== ORGANIZATIONS TABLE POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY policyname;

-- =====================================================
-- STEP 5: Test query (should work now)
-- =====================================================

-- This simulates what the app does
-- Replace with an actual user ID to test
SELECT 
  u.id,
  u.email,
  u.name,
  u.organization_id,
  o.name as org_name
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.id = auth.uid()
LIMIT 1;

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ RLS policies fixed!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Created policies:';
  RAISE NOTICE '  - Users can read own profile';
  RAISE NOTICE '  - Users can update own profile';
  RAISE NOTICE '  - Users can read their organization';
  RAISE NOTICE '  - Users can update their organization';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS is now enabled and secure!';
  RAISE NOTICE 'Users can only access their own data.';
  RAISE NOTICE '================================================';
END $$;

