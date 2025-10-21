-- =====================================================
-- Auto-Create User Profile and Organization on Signup (V2)
-- =====================================================
-- This version includes better error handling and permissions
-- =====================================================

-- Step 1: Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Create the function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  new_org_id uuid;
  user_email text;
  user_name text;
  org_name text;
BEGIN
  RAISE NOTICE 'Trigger fired for new user: %', NEW.id;
  
  -- Get user details
  user_email := NEW.email;
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Create organization name
  IF user_email IS NOT NULL THEN
    org_name := INITCAP(SPLIT_PART(user_email, '@', 1)) || '''s Organization';
  ELSE
    org_name := 'My Organization';
  END IF;

  RAISE NOTICE 'Creating organization: %', org_name;

  -- Create organization
  INSERT INTO public.organizations (
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

  RAISE NOTICE 'Organization created with ID: %', new_org_id;
  RAISE NOTICE 'Creating user profile for: %', user_email;

  -- Create user profile
  INSERT INTO public.users (
    id,
    email,
    name,
    organization_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    user_email,
    user_name,
    new_org_id,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'User profile created successfully for: %', user_email;
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  -- Still return NEW to not block the auth process
  RETURN NEW;
END;
$$;

-- Step 3: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify creation
DO $$
DECLARE
  trigger_count int;
  function_count int;
BEGIN
  -- Check trigger
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created';
  
  -- Check function
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname = 'handle_new_user';
  
  IF trigger_count > 0 AND function_count > 0 THEN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ SUCCESS! User signup trigger is active!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Trigger: % found', trigger_count;
    RAISE NOTICE 'Function: % found', function_count;
    RAISE NOTICE '';
    RAISE NOTICE 'New users will automatically get:';
    RAISE NOTICE '  1. A user profile in the users table';
    RAISE NOTICE '  2. A new organization';
    RAISE NOTICE '  3. Linked to their organization';
    RAISE NOTICE '';
    RAISE NOTICE 'Test by signing up with a new account!';
    RAISE NOTICE '================================================';
  ELSE
    RAISE WARNING '⚠️  Trigger or function not found!';
    RAISE WARNING 'Trigger count: %', trigger_count;
    RAISE WARNING 'Function count: %', function_count;
  END IF;
END $$;

-- Step 6: Show trigger details
SELECT 
  trigger_name,
  event_manipulation as event,
  event_object_table as "table",
  action_timing as timing,
  action_statement as action
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

