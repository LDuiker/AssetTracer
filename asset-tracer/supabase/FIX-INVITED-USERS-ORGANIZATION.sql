-- =====================================================
-- FIX INVITED USERS ORGANIZATION
-- =====================================================
-- This script moves invited users to the correct organization
-- Run this AFTER checking with CHECK-INVITED-USERS-STATUS.sql
-- =====================================================

DO $$
DECLARE
  owner_org_id UUID;
  owner_user_id UUID;
  invited_user RECORD;
  invitation_record RECORD;
BEGIN
  -- Get the owner's organization ID
  SELECT organization_id, id
  INTO owner_org_id, owner_user_id
  FROM users
  WHERE email = 'mrlduiker@gmail.com'
  LIMIT 1;

  IF owner_org_id IS NULL THEN
    RAISE EXCEPTION 'Owner user not found';
  END IF;

  RAISE NOTICE 'Owner organization ID: %', owner_org_id;

  -- Process each invited user
  FOR invited_user IN 
    SELECT id, email, name, organization_id, role
    FROM users
    WHERE email IN ('larona@stageworksafrica.com', 'mavenzone341@gmail.com')
  LOOP
    RAISE NOTICE 'Processing user: % (ID: %)', invited_user.email, invited_user.id;
    
    -- Find the most recent invitation for this user
    SELECT *
    INTO invitation_record
    FROM team_invitations
    WHERE email = invited_user.email
      AND organization_id = owner_org_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF invitation_record IS NULL THEN
      RAISE NOTICE '⚠️ No invitation found for % in owner''s organization', invited_user.email;
      CONTINUE;
    END IF;

    -- Check if user is already in the correct organization
    IF invited_user.organization_id = owner_org_id THEN
      RAISE NOTICE '✅ User % is already in the correct organization', invited_user.email;
      
      -- Mark invitation as accepted if it's still pending
      IF invitation_record.status = 'pending' THEN
        UPDATE team_invitations
        SET status = 'accepted', updated_at = NOW()
        WHERE id = invitation_record.id;
        RAISE NOTICE '✅ Marked invitation as accepted for %', invited_user.email;
      END IF;
      
      CONTINUE;
    END IF;

    -- Move user to the correct organization
    UPDATE users
    SET 
      organization_id = owner_org_id,
      role = invitation_record.role,
      updated_at = NOW()
    WHERE id = invited_user.id;

    RAISE NOTICE '✅ Moved user % to organization % with role %', 
      invited_user.email, owner_org_id, invitation_record.role;

    -- Mark invitation as accepted
    UPDATE team_invitations
    SET status = 'accepted', updated_at = NOW()
    WHERE id = invitation_record.id;

    RAISE NOTICE '✅ Marked invitation as accepted for %', invited_user.email;

  END LOOP;

  RAISE NOTICE '✅ Fix complete!';
END $$;

-- Verify the fix
SELECT 
  u.email,
  u.role,
  u.organization_id,
  o.name as organization_name,
  CASE 
    WHEN u.organization_id = (SELECT organization_id FROM users WHERE email = 'mrlduiker@gmail.com' LIMIT 1)
    THEN '✅ CORRECT'
    ELSE '❌ STILL WRONG'
  END as status
FROM users u
LEFT JOIN organizations o ON o.id = u.organization_id
WHERE u.email IN ('larona@stageworksafrica.com', 'mavenzone341@gmail.com', 'mrlduiker@gmail.com')
ORDER BY u.email;

