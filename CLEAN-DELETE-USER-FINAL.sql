-- =====================================================
-- COMPLETELY DELETE A USER FROM THE DATABASE
-- =====================================================
-- This removes all traces of a user from both auth.users and public.users
-- Run this in the Supabase SQL Editor
-- =====================================================

-- Step 1: Show current users
SELECT 
  'auth.users' as table_name,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

SELECT 
  'public.users' as table_name,
  id,
  email,
  name,
  created_at
FROM users
ORDER BY created_at DESC;

-- =====================================================
-- Step 2: DELETE THE SPECIFIC USER
-- =====================================================
-- IMPORTANT: Replace 'mrlduiker@gmail.com' with the actual email to delete

-- First, delete from public.users
DELETE FROM users WHERE email = 'mrlduiker@gmail.com';

-- =====================================================
-- Step 3: DELETE FROM AUTH.USERS (Dashboard Method)
-- =====================================================
-- ⚠️ STOP HERE! You MUST delete from auth.users via the Supabase Dashboard:
--
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Find: mrlduiker@gmail.com
-- 3. Click the "..." menu
-- 4. Select "Delete user"
-- 5. Confirm deletion
--
-- Direct SQL deletion from auth.users is blocked by Supabase for security.
-- =====================================================

-- Step 4: Verify deletion (run this after dashboard deletion)
DO $$
DECLARE
  auth_user_count INTEGER;
  public_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_user_count
  FROM auth.users
  WHERE email = 'mrlduiker@gmail.com';
  
  SELECT COUNT(*) INTO public_user_count
  FROM users
  WHERE email = 'mrlduiker@gmail.com';
  
  IF auth_user_count = 0 AND public_user_count = 0 THEN
    RAISE NOTICE '✅ User completely deleted!';
  ELSE
    RAISE NOTICE '⚠️ User still exists:';
    RAISE NOTICE '  - auth.users: % records', auth_user_count;
    RAISE NOTICE '  - public.users: % records', public_user_count;
  END IF;
END $$;

-- =====================================================
-- Step 5: Show all remaining users
-- =====================================================
SELECT 
  'Final auth.users' as table_name,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

SELECT 
  'Final public.users' as table_name,
  id,
  email,
  name,
  organization_id,
  created_at
FROM users
ORDER BY created_at DESC;

