-- =====================================================
-- FIX USERS RLS POLICIES FOR TEAM MEMBERS
-- =====================================================
-- This ensures users can see other members of their organization
-- Run this in your PRODUCTION Supabase SQL Editor
-- =====================================================

-- Step 1: Create a SECURITY DEFINER function to get user's organization_id
-- This bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION get_user_organization_id(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM users
  WHERE id = user_id;
  RETURN org_id;
END;
$$;

-- Step 2: Drop existing restrictive policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "Enable read access for users based on organization_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on organization_id" ON users;
DROP POLICY IF EXISTS "Enable insert for users based on organization_id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on organization_id" ON users;
DROP POLICY IF EXISTS "users_org_policy" ON users;
-- Drop the new policies we're about to create (in case they already exist)
DROP POLICY IF EXISTS "users_select_organization_members" ON users;
DROP POLICY IF EXISTS "users_update_organization_members" ON users;
DROP POLICY IF EXISTS "users_insert_allow" ON users;
DROP POLICY IF EXISTS "users_delete_organization_members" ON users;

-- Step 3: Create comprehensive SELECT policy
-- Users can see:
-- 1. Their own record
-- 2. All other users in their organization
-- NOTE: We use a SECURITY DEFINER function to avoid recursive policy issues
CREATE POLICY "users_select_organization_members"
ON users FOR SELECT
TO authenticated
USING (
  -- Can see own record
  id = auth.uid() 
  OR 
  -- Can see other members of same organization
  -- Use SECURITY DEFINER function to bypass RLS and avoid recursion
  organization_id = get_user_organization_id(auth.uid())
);

-- Step 4: Create UPDATE policy
-- Users can update:
-- 1. Their own record
-- 2. Other users in their organization (for owners/admins managing team)
CREATE POLICY "users_update_organization_members"
ON users FOR UPDATE
TO authenticated
USING (
  id = auth.uid() 
  OR 
  -- Use SECURITY DEFINER function to bypass RLS and avoid recursion
  organization_id = get_user_organization_id(auth.uid())
)
WITH CHECK (
  id = auth.uid() 
  OR 
  -- Use SECURITY DEFINER function to bypass RLS and avoid recursion
  organization_id = get_user_organization_id(auth.uid())
);

-- Step 5: Create INSERT policy
-- Allow inserts (needed for OAuth trigger and invitation acceptance)
CREATE POLICY "users_insert_allow"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 6: Create DELETE policy (optional - for removing team members)
-- Only allow deleting users in the same organization
CREATE POLICY "users_delete_organization_members"
ON users FOR DELETE
TO authenticated
USING (
  -- Use SECURITY DEFINER function to bypass RLS and avoid recursion
  organization_id = get_user_organization_id(auth.uid())
);

-- Step 7: Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 8: Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 8: Test query (should return all users in the same organization)
-- Replace 'YOUR_USER_ID' with an actual user ID from your database
-- SELECT 
--   id,
--   email,
--   name,
--   role,
--   organization_id
-- FROM users
-- WHERE organization_id = (
--   SELECT organization_id FROM users WHERE email = 'mrlduiker@gmail.com'
-- );

