-- =====================================================
-- TEST RLS AS YOUR SPECIFIC USER
-- =====================================================
-- This tests if RLS is working for your user
-- =====================================================

-- Step 1: Check what auth.uid() returns (should be your user ID)
SELECT 
  '1️⃣ Current auth.uid()' as step,
  auth.uid() as current_user_id;

-- Step 2: Check if that user exists in users table
SELECT 
  '2️⃣ User in database' as step,
  id,
  email,
  organization_id
FROM users
WHERE id = auth.uid();

-- Step 3: Try to select organizations AS authenticated user
SELECT 
  '3️⃣ Organizations query (with RLS)' as step,
  o.id,
  o.name,
  'This should return your org' as note
FROM organizations o
WHERE o.id IN (
  SELECT organization_id FROM users WHERE id = auth.uid()
);

-- Step 4: Temporarily bypass RLS to see if org exists
SELECT 
  '4️⃣ Check org exists (bypass RLS)' as step,
  id,
  name,
  created_at
FROM organizations
WHERE id = 'f6338a9d-4ddf-4676-8892-5c8542785bd6';

-- Step 5: Check RLS policies
SELECT 
  '5️⃣ Current RLS Policies' as step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'organizations')
ORDER BY tablename, policyname;

-- Diagnosis
DO $$
DECLARE
  v_auth_uid UUID;
  v_user_exists BOOLEAN;
  v_org_id UUID;
  v_org_exists BOOLEAN;
BEGIN
  -- Get current auth.uid()
  v_auth_uid := auth.uid();
  
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE id = v_auth_uid) INTO v_user_exists;
  
  -- Get org_id
  SELECT organization_id INTO v_org_id FROM users WHERE id = v_auth_uid;
  
  -- Check if org exists
  SELECT EXISTS(SELECT 1 FROM organizations WHERE id = v_org_id) INTO v_org_exists;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔍 RLS DIAGNOSIS';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Current auth.uid(): %', v_auth_uid;
  
  IF v_auth_uid IS NULL THEN
    RAISE NOTICE '❌ PROBLEM: auth.uid() is NULL!';
    RAISE NOTICE '   You are not authenticated in this SQL session.';
    RAISE NOTICE '   This is normal - you can''t test RLS directly in SQL editor.';
    RAISE NOTICE '';
    RAISE NOTICE '   The real test is in the browser.';
  ELSIF NOT v_user_exists THEN
    RAISE NOTICE '❌ PROBLEM: User with ID % does not exist!', v_auth_uid;
  ELSIF v_org_id IS NULL THEN
    RAISE NOTICE '❌ PROBLEM: User exists but organization_id is NULL!';
  ELSIF NOT v_org_exists THEN
    RAISE NOTICE '❌ PROBLEM: Organization % does not exist!', v_org_id;
  ELSE
    RAISE NOTICE '✅ User exists with ID: %', v_auth_uid;
    RAISE NOTICE '✅ Has organization_id: %', v_org_id;
    RAISE NOTICE '✅ Organization exists';
    RAISE NOTICE '';
    RAISE NOTICE '   RLS should be working. If you still get error:';
    RAISE NOTICE '   - Clear ALL browser cookies';
    RAISE NOTICE '   - Sign out and sign in fresh';
    RAISE NOTICE '   - Check browser console for actual error';
  END IF;
  
  RAISE NOTICE '================================================';
END $$;

