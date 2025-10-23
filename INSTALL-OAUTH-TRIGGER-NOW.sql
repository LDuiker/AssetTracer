-- =====================================================
-- INSTALL OAUTH TRIGGER - For Future Sign-Ups
-- =====================================================
-- Run this AFTER fixing your current user
-- This ensures ALL future OAuth sign-ups get profiles automatically
-- =====================================================

-- Step 1: Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create the trigger function
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

  -- Create user (only base columns - role/subscription added by migrations)
  INSERT INTO users (
    id, email, name, organization_id, phone
  )
  VALUES (
    NEW.id, user_email, user_full_name, new_org_id,
    NEW.raw_user_meta_data->>'phone'
  );

  RAISE NOTICE 'Created new user: % with organization: %', NEW.id, new_org_id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user record for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify installation
SELECT 
  '✅ Trigger installed' as status,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 5: Verify function exists
SELECT 
  '✅ Function created' as status,
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'handle_new_user';

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ OAuth trigger installed successfully!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'ALL future Google sign-ups will now automatically get:';
  RAISE NOTICE '  1. A user profile in public.users';
  RAISE NOTICE '  2. An organization in organizations';
  RAISE NOTICE '  3. Linked together properly';
  RAISE NOTICE '';
  RAISE NOTICE 'No more "Organization not found" errors!';
  RAISE NOTICE '================================================';
END $$;

