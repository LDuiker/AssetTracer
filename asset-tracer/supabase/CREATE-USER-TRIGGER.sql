-- =====================================================
-- Auto-Create User Profile and Organization on Signup
-- =====================================================
-- This trigger automatically creates a user profile and 
-- organization when a new user signs up via OAuth
-- =====================================================

-- Step 1: Create the function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id uuid;
  user_email text;
  org_name text;
BEGIN
  -- Get user's email from metadata
  user_email := NEW.email;
  
  -- Create organization name from email (e.g., "john@example.com" -> "John's Organization")
  IF user_email IS NOT NULL THEN
    org_name := INITCAP(SPLIT_PART(user_email, '@', 1)) || '''s Organization';
  ELSE
    org_name := 'My Organization';
  END IF;

  -- Create a new organization for this user
  INSERT INTO public.organizations (name, default_currency, timezone, date_format)
  VALUES (
    org_name,
    'USD',
    'America/New_York',
    'MM/DD/YYYY'
  )
  RETURNING id INTO new_org_id;

  -- Create user profile linked to the organization
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
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    new_org_id,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- =====================================================
-- Test Query (Optional)
-- =====================================================
-- To test if the trigger works, sign up with a new account
-- and then run this query to see if the user and org were created:
/*
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  u.organization_id,
  o.name as organization_name,
  o.default_currency,
  u.created_at
FROM users u
JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at DESC
LIMIT 5;
*/

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ User signup trigger created successfully!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'New users will automatically get:';
  RAISE NOTICE '  1. A user profile in the users table';
  RAISE NOTICE '  2. A new organization';
  RAISE NOTICE '  3. Linked to their organization';
  RAISE NOTICE '';
  RAISE NOTICE 'Test by signing up with a new Google account!';
  RAISE NOTICE '================================================';
END $$;

