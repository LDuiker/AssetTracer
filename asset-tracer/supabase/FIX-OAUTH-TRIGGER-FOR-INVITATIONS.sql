-- =====================================================
-- Fix OAuth Trigger to Handle Team Invitations
-- =====================================================
-- This updates the trigger to check for pending invitations
-- If a user signs up with an email that has a pending invitation,
-- they should be added to the invitor's organization instead of
-- creating a new organization
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create updated function that checks for invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  user_full_name TEXT;
  pending_invitation RECORD;
BEGIN
  -- Extract email and name from the new auth user
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

  -- Check if there's a pending invitation for this email
  SELECT 
    organization_id,
    role
  INTO pending_invitation
  FROM team_invitations
  WHERE email = user_email
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If there's a pending invitation, use that organization
  IF pending_invitation IS NOT NULL THEN
    RAISE NOTICE 'Found pending invitation for % - adding to organization %', user_email, pending_invitation.organization_id;
    
    -- Create user record with the invitation's organization and role
    INSERT INTO users (
      id,
      email,
      name,
      organization_id,
      role,
      phone
    )
    VALUES (
      NEW.id,
      user_email,
      user_full_name,
      pending_invitation.organization_id,
      pending_invitation.role,
      NEW.raw_user_meta_data->>'phone'
    );

    -- Mark invitation as accepted (use admin privileges)
    UPDATE team_invitations
    SET 
      status = 'accepted',
      updated_at = NOW()
    WHERE email = user_email
      AND status = 'pending'
      AND organization_id = pending_invitation.organization_id;

    RAISE NOTICE 'User % added to organization % via invitation', NEW.id, pending_invitation.organization_id;
    RETURN NEW;
  END IF;

  -- No pending invitation - create new organization as usual
  RAISE NOTICE 'No pending invitation for % - creating new organization', user_email;
  
  INSERT INTO organizations (name, default_currency, timezone, date_format)
  VALUES (
    user_full_name || '''s Organization',
    'USD',
    'UTC',
    'MM/DD/YYYY'
  )
  RETURNING id INTO new_org_id;

  -- Create user record with new organization
  INSERT INTO users (
    id,
    email,
    name,
    organization_id,
    role,
    phone
  )
  VALUES (
    NEW.id,
    user_email,
    user_full_name,
    new_org_id,
    'owner', -- New users are owners of their own org
    NEW.raw_user_meta_data->>'phone'
  );

  RAISE NOTICE 'Created new user: % with new organization: %', NEW.id, new_org_id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Error creating user record for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ OAuth trigger updated successfully!';
  RAISE NOTICE 'New behavior:';
  RAISE NOTICE '  - Checks for pending invitations first';
  RAISE NOTICE '  - If invitation exists: adds user to invitor''s organization';
  RAISE NOTICE '  - If no invitation: creates new organization as before';
END $$;

