-- =====================================================
-- FIX NEW USER - Create Profile for Current User
-- =====================================================
-- Run this FIRST to fix the user you just signed up with
-- =====================================================

-- Step 1: Check who just signed up (should be your new email)
SELECT 
  'Latest auth user:' as status,
  id,
  email,
  created_at,
  raw_user_meta_data->>'full_name' as google_name,
  raw_user_meta_data->>'name' as alt_name
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- Step 2: Check if they already have a profile
SELECT 
  'Existing profiles:' as status,
  u.id,
  u.email,
  u.name,
  u.organization_id,
  o.name as org_name
FROM users u
LEFT JOIN organizations o ON o.id = u.organization_id
ORDER BY u.created_at DESC;

-- =====================================================
-- Step 3: CREATE PROFILE FOR THE LATEST USER
-- =====================================================
-- This will create both the organization and user profile
-- =====================================================

DO $$
DECLARE
  new_org_id UUID;
  auth_user_id UUID;
  user_email TEXT;
  user_name TEXT;
  existing_user_count INTEGER;
BEGIN
  -- Get the latest auth user
  SELECT id, email,
    COALESCE(
      raw_user_meta_data->>'full_name',
      raw_user_meta_data->>'name',
      split_part(email, '@', 1)
    )
  INTO auth_user_id, user_email, user_name
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if user already has a profile
  SELECT COUNT(*) INTO existing_user_count
  FROM users
  WHERE id = auth_user_id;

  IF existing_user_count > 0 THEN
    RAISE NOTICE '⚠️ User already has a profile: %', user_email;
    RETURN;
  END IF;

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

  RAISE NOTICE '✅ Profile created for: % (%)', user_email, auth_user_id;
  RAISE NOTICE '✅ Organization created: % (%)', user_name || '''s Organization', new_org_id;
  RAISE NOTICE '';
  RAISE NOTICE '🚀 NOW refresh your dashboard - it will work!';
END $$;

-- Step 4: Verify the profile was created
SELECT 
  '✅ Verification:' as status,
  u.id,
  u.email,
  u.name,
  u.organization_id,
  o.name as org_name
FROM users u
JOIN organizations o ON o.id = u.organization_id
ORDER BY u.created_at DESC
LIMIT 1;

