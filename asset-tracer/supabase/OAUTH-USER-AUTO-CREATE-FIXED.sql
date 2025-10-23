-- =====================================================
-- AUTO-CREATE USER ON OAUTH SIGN-UP (FIXED VERSION)
-- =====================================================
-- This trigger automatically creates a user record in public.users
-- when someone signs up via OAuth (Google, etc.)
-- Run this in your Supabase SQL Editor (Production Database)

-- First, temporarily disable RLS for setup
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Function to handle new user creation
-- Using SECURITY DEFINER to run with creator's privileges (bypasses RLS)
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
  -- Extract email and name from the new auth user
  user_email := NEW.email;
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(user_email, '@', 1)
  );

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM users WHERE id = NEW.id) THEN
    RAISE NOTICE 'User already exists: %', NEW.id;
    RETURN NEW;
  END IF;

  -- Create a new organization for this user
  INSERT INTO organizations (name, default_currency, timezone, date_format)
  VALUES (
    user_full_name || '''s Organization',
    'USD',
    'UTC',
    'MM/DD/YYYY'
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
    RAISE WARNING 'Error creating user record for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run the function when a new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Re-enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Ensure RLS policies exist for users table
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own user data" ON users;
  DROP POLICY IF EXISTS "Users can update own user data" ON users;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
  DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
  DROP POLICY IF EXISTS "Users can update own organization" ON organizations;

  -- Create RLS policies for users
  CREATE POLICY "Users can view own user data" 
    ON users FOR SELECT 
    USING (auth.uid() = id);

  CREATE POLICY "Users can update own user data" 
    ON users FOR UPDATE 
    USING (auth.uid() = id);

  CREATE POLICY "Enable insert for authenticated users" 
    ON users FOR INSERT 
    WITH CHECK (auth.uid() = id);

  -- Create RLS policies for organizations
  CREATE POLICY "Users can view own organization" 
    ON organizations FOR SELECT 
    USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

  CREATE POLICY "Users can update own organization" 
    ON organizations FOR UPDATE 
    USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'owner'));

EXCEPTION
  WHEN duplicate_object THEN 
    NULL; -- Policies already exist, that's fine
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Verify the trigger was created:
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- You should see one row with trigger details

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ OAuth trigger installed successfully!';
  RAISE NOTICE 'New users will automatically get:';
  RAISE NOTICE '  - User profile in public.users';
  RAISE NOTICE '  - New organization';
  RAISE NOTICE '  - Owner role';
  RAISE NOTICE '  - Free subscription tier';
END $$;

