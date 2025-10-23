-- =====================================================
-- VERIFY AND FIX OAUTH TRIGGER
-- =====================================================
-- Run this in your Supabase SQL Editor (Production Database)
-- This will check if the trigger exists and works properly
-- =====================================================

-- STEP 1: Check if the trigger exists
-- =====================================================
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Expected: 1 row showing the trigger
-- If you see 0 rows, the trigger is NOT installed!

-- =====================================================
-- STEP 2: Check if the function exists
-- =====================================================
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- Expected: 1 row showing the function with DEFINER security
-- If you see 0 rows, the function is NOT created!

-- =====================================================
-- STEP 3: Check recent auth users
-- =====================================================
-- See if your user was created in auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Your email should appear here

-- =====================================================
-- STEP 4: Check if user profile was created
-- =====================================================
-- Check if the trigger created a profile in public.users
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.organization_id,
  u.subscription_tier,
  u.created_at,
  o.name as org_name,
  o.slug as org_slug
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at DESC
LIMIT 5;

-- Your user should appear here with an organization
-- If NOT, the trigger didn't run!

-- =====================================================
-- STEP 5: Check Postgres logs for errors
-- =====================================================
-- Go to: Supabase Dashboard → Logs → Postgres Logs
-- Look for:
-- - "Created new user: ..." (success)
-- - "Error creating user record: ..." (failure)
-- - Any error messages related to handle_new_user

-- =====================================================
-- FIX: If trigger doesn't exist, run this
-- =====================================================
-- Copy and paste the entire OAUTH-USER-AUTO-CREATE-FIXED.sql
-- OR run this quick fix:

-- Drop existing if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Temporarily disable RLS
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;

-- Create the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  user_email := NEW.email;
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'name',
    split_part(user_email, '@', 1)
  );

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM users WHERE id = NEW.id) THEN
    RAISE NOTICE 'User already exists: %', NEW.id;
    RETURN NEW;
  END IF;

  -- Create organization
  INSERT INTO organizations (name, default_currency, timezone, date_format)
  VALUES (
    user_full_name || '''s Organization',
    'USD',
    'UTC',
    'MM/DD/YYYY'
  )
  RETURNING id INTO new_org_id;

  -- Create user
  INSERT INTO users (
    id, email, full_name, role, organization_id,
    avatar_url, subscription_tier, subscription_status,
    created_at, updated_at
  )
  VALUES (
    NEW.id, user_email, user_full_name, 'owner', new_org_id,
    NEW.raw_user_meta_data->>'avatar_url', 'free', 'active',
    NOW(), NOW()
  );

  RAISE NOTICE 'Created new user: % with organization: %', NEW.id, new_org_id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user record for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
DROP POLICY IF EXISTS "Users can view own user data" ON users;
DROP POLICY IF EXISTS "Users can update own user data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

CREATE POLICY "Users can view own user data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own user data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 6: Manual fix for existing user
-- =====================================================
-- If you already have a user in auth.users but no profile:
-- Run this to create the profile manually

DO $$
DECLARE
  new_org_id UUID;
  auth_user_id UUID;
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  -- Get the most recent auth user without a profile
  SELECT 
    au.id, 
    au.email,
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name',
      split_part(au.email, '@', 1)
    )
  INTO auth_user_id, user_email, user_full_name
  FROM auth.users au
  LEFT JOIN users u ON au.id = u.id
  WHERE u.id IS NULL  -- No profile exists
  ORDER BY au.created_at DESC
  LIMIT 1;

  IF auth_user_id IS NULL THEN
    RAISE NOTICE 'No users found without profiles';
    RETURN;
  END IF;

  -- Create organization
  INSERT INTO organizations (name, default_currency, timezone, date_format)
  VALUES (
    user_full_name || '''s Organization',
    'USD',
    'UTC',
    'MM/DD/YYYY'
  )
  RETURNING id INTO new_org_id;

  -- Create user profile
  INSERT INTO users (
    id, email, full_name, role, organization_id,
    subscription_tier, subscription_status,
    created_at, updated_at
  )
  VALUES (
    auth_user_id, user_email, user_full_name, 'owner', new_org_id,
    'free', 'active', NOW(), NOW()
  );

  RAISE NOTICE '✅ Created profile for user: % (%) with org: %', user_email, auth_user_id, new_org_id;
END $$;

-- =====================================================
-- STEP 7: Verify everything is working
-- =====================================================
-- Check trigger exists
SELECT 'Trigger exists' as status, COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
UNION ALL
-- Check function exists
SELECT 'Function exists' as status, COUNT(*) as count
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
UNION ALL
-- Check users with profiles
SELECT 'Users with profiles' as status, COUNT(*) as count
FROM users
UNION ALL
-- Check organizations
SELECT 'Organizations' as status, COUNT(*) as count
FROM organizations;

-- All counts should be > 0

-- =====================================================
-- SUCCESS!
-- =====================================================
-- If all checks pass, try signing in again:
-- 1. Go to your app
-- 2. Sign out (if logged in)
-- 3. Click "Continue with Google"
-- 4. You should land on dashboard ✅
-- =====================================================

