-- =====================================================
-- Fix Invited User's Organization
-- =====================================================
-- This script finds the invitation and moves the user
-- to the correct organization
-- =====================================================
-- Replace 'larona@stageworksafrica.com' with the actual invited email
-- =====================================================

DO $$
DECLARE
  invited_email TEXT := 'larona@stageworksafrica.com';
  invitation_org_id UUID;
  invitation_role TEXT;
  invitation_id UUID;
  user_id UUID;
  current_org_id UUID;
BEGIN
  -- Find the pending invitation
  SELECT 
    id,
    organization_id,
    role
  INTO 
    invitation_id,
    invitation_org_id,
    invitation_role
  FROM team_invitations
  WHERE email = invited_email
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if invitation was found
  IF invitation_id IS NULL THEN
    RAISE NOTICE '❌ No pending invitation found for %', invited_email;
    RAISE NOTICE 'Checking for accepted invitations...';
    
    -- Try to find accepted invitation
    SELECT 
      id,
      organization_id,
      role
    INTO 
      invitation_id,
      invitation_org_id,
      invitation_role
    FROM team_invitations
    WHERE email = invited_email
      AND status = 'accepted'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF invitation_id IS NULL THEN
      RAISE EXCEPTION 'No invitation found (pending or accepted) for %', invited_email;
    ELSE
      RAISE NOTICE 'Found accepted invitation: %', invitation_id;
    END IF;
  ELSE
    RAISE NOTICE '✅ Found pending invitation: %', invitation_id;
    RAISE NOTICE '   Organization ID: %', invitation_org_id;
    RAISE NOTICE '   Role: %', invitation_role;
  END IF;

  -- Find the user by email
  SELECT 
    id,
    organization_id
  INTO 
    user_id,
    current_org_id
  FROM users
  WHERE email = invited_email
  LIMIT 1;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', invited_email;
  END IF;

  RAISE NOTICE '✅ Found user: %', user_id;
  RAISE NOTICE '   Current organization: %', current_org_id;
  RAISE NOTICE '   Target organization: %', invitation_org_id;

  -- Check if already in the correct organization
  IF current_org_id = invitation_org_id THEN
    RAISE NOTICE '✅ User is already in the correct organization!';
    
    -- Just mark invitation as accepted if it's still pending
    IF EXISTS (SELECT 1 FROM team_invitations WHERE id = invitation_id AND status = 'pending') THEN
      UPDATE team_invitations
      SET 
        status = 'accepted',
        updated_at = NOW()
      WHERE id = invitation_id;
      
      RAISE NOTICE '✅ Marked invitation as accepted';
    END IF;
    
    RETURN;
  END IF;

  -- Update user to the correct organization
  UPDATE users
  SET 
    organization_id = invitation_org_id,
    role = invitation_role,
    updated_at = NOW()
  WHERE id = user_id;

  RAISE NOTICE '✅ Updated user to organization % with role %', invitation_org_id, invitation_role;

  -- Mark invitation as accepted if still pending
  IF EXISTS (SELECT 1 FROM team_invitations WHERE id = invitation_id AND status = 'pending') THEN
    UPDATE team_invitations
    SET 
      status = 'accepted',
      updated_at = NOW()
    WHERE id = invitation_id;
    
    RAISE NOTICE '✅ Marked invitation as accepted';
  END IF;

  -- Optional: Delete the old organization if it's empty (only this user)
  -- Uncomment if you want to clean up orphaned organizations
  /*
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE organization_id = current_org_id 
      AND id != user_id
  ) THEN
    DELETE FROM organizations WHERE id = current_org_id;
    RAISE NOTICE '✅ Deleted empty organization: %', current_org_id;
  END IF;
  */

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SUCCESS!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User % has been moved to organization %', invited_email, invitation_org_id;
  RAISE NOTICE 'They should now see the correct dashboard when they log in.';
  RAISE NOTICE '========================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error: %', SQLERRM;
END $$;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this after the fix to verify:
SELECT 
  u.email,
  u.name,
  u.role,
  o.name as organization_name,
  o.subscription_tier,
  ti.status as invitation_status
FROM users u
JOIN organizations o ON o.id = u.organization_id
LEFT JOIN team_invitations ti ON ti.email = u.email
WHERE u.email = 'larona@stageworksafrica.com';

