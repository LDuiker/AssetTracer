-- =====================================================
-- AUTO-CREATE USER ON OAUTH SIGN-UP
-- =====================================================
-- This trigger automatically creates a user record in public.users
-- when someone signs up via OAuth (Google, etc.)
-- Run this in your Supabase SQL Editor (Production Database)

-- Drop existing function and trigger if they exist (for updates)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  -- Extract email and name from the new auth user
  user_email := NEW.email;
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(user_email, '@', 1));

  -- Create a new organization for this user
  INSERT INTO organizations (name, slug, settings)
  VALUES (
    user_full_name || '''s Organization',
    lower(regexp_replace(user_full_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(NEW.id::text, 1, 8),
    '{
      "currency": "USD",
      "timezone": "UTC",
      "dateFormat": "MM/DD/YYYY",
      "fiscalYearStart": "01-01"
    }'::jsonb
  )
  RETURNING id INTO new_org_id;

  -- Create the user record
  INSERT INTO users (
    id,
    email,
    full_name,
    role,
    organization_id,
    avatar_url,
    subscription_tier,
    subscription_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    user_email,
    user_full_name,
    'owner',
    new_org_id,
    NEW.raw_user_meta_data->>'avatar_url',
    'free',
    'active',
    NOW(),
    NOW()
  );

  -- Log the new user creation
  RAISE NOTICE 'Created new user: % with organization: %', NEW.id, new_org_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Error creating user record: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run the function when a new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON organizations TO authenticated;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- After running the above, verify the trigger was created:
-- 
-- SELECT 
--   trigger_name, 
--   event_manipulation, 
--   event_object_table, 
--   action_statement 
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'on_auth_user_created';
--
-- You should see one row with the trigger details.
-- =====================================================

-- =====================================================
-- TEST THE TRIGGER (Optional)
-- =====================================================
-- To test, simply sign in with Google OAuth from your app.
-- The trigger will automatically:
-- 1. Create a new organization
-- 2. Create a user record linked to that organization
-- 3. Set the user as 'owner' of the organization
--
-- Check the results with:
-- SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
-- SELECT * FROM organizations ORDER BY created_at DESC LIMIT 5;
-- =====================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user record and organization when someone signs up via OAuth';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Triggers user record creation on OAuth sign-up';

