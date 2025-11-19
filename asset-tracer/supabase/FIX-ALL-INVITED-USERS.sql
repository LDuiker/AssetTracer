-- =====================================================
-- Fix ALL Invited Users Who Are In Wrong Organizations
-- =====================================================
-- This script finds all users who have pending/accepted invitations
-- but are in the wrong organization, and moves them to the correct one
-- =====================================================

DO $$
DECLARE
  user_record RECORD;
  invitation_record RECORD;
  fixed_count INTEGER := 0;
  skipped_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting fix for all invited users...';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Loop through all users who have invitations
  FOR user_record IN
    SELECT DISTINCT
      u.id as user_id,
      u.email,
      u.organization_id as current_org_id,
      u.role as current_role
    FROM users u
    INNER JOIN team_invitations ti ON ti.email = u.email
    WHERE ti.status IN ('pending', 'accepted')
  LOOP
    BEGIN
      -- Find the most recent invitation for this user
      SELECT 
        id,
        organization_id,
        role,
        status
      INTO invitation_record
      FROM team_invitations
      WHERE email = user_record.email
        AND status IN ('pending', 'accepted')
      ORDER BY created_at DESC
      LIMIT 1;

      -- Check if user is already in the correct organization
      IF user_record.current_org_id = invitation_record.organization_id THEN
        RAISE NOTICE '✅ % - Already in correct organization', user_record.email;
        skipped_count := skipped_count + 1;
        
        -- Mark invitation as accepted if still pending
        IF invitation_record.status = 'pending' THEN
          UPDATE team_invitations
          SET 
            status = 'accepted',
            updated_at = NOW()
          WHERE id = invitation_record.id;
          RAISE NOTICE '   → Marked invitation as accepted';
        END IF;
        
        CONTINUE;
      END IF;

      -- Update user to the correct organization
      UPDATE users
      SET 
        organization_id = invitation_record.organization_id,
        role = invitation_record.role,
        updated_at = NOW()
      WHERE id = user_record.user_id;

      -- Mark invitation as accepted if still pending
      IF invitation_record.status = 'pending' THEN
        UPDATE team_invitations
        SET 
          status = 'accepted',
          updated_at = NOW()
        WHERE id = invitation_record.id;
      END IF;

      RAISE NOTICE '✅ Fixed: %', user_record.email;
      RAISE NOTICE '   Moved from org % to org %', user_record.current_org_id, invitation_record.organization_id;
      RAISE NOTICE '   Role: %', invitation_record.role;
      
      fixed_count := fixed_count + 1;

    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '❌ Error fixing %: %', user_record.email, SQLERRM;
        error_count := error_count + 1;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixed: % users', fixed_count;
  RAISE NOTICE 'Skipped (already correct): % users', skipped_count;
  RAISE NOTICE 'Errors: % users', error_count;
  RAISE NOTICE '========================================';

END $$;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to see all users with their invitations:
SELECT 
  u.email,
  u.name,
  u.role as user_role,
  o.name as organization_name,
  o.subscription_tier,
  ti.status as invitation_status,
  ti.role as invitation_role,
  CASE 
    WHEN u.organization_id = ti.organization_id THEN '✅ Correct'
    ELSE '❌ Wrong Organization'
  END as status
FROM users u
JOIN organizations o ON o.id = u.organization_id
LEFT JOIN team_invitations ti ON ti.email = u.email 
  AND ti.status IN ('pending', 'accepted')
WHERE ti.id IS NOT NULL
ORDER BY u.email;

