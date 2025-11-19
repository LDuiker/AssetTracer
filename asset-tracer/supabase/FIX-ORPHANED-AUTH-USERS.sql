-- =====================================================
-- FIX ORPHANED AUTH USERS
-- =====================================================
-- This script finds users who exist in auth.users but not in public.users
-- and recreates their public.users record
-- Run this in your PRODUCTION Supabase SQL Editor
-- =====================================================

DO $$
DECLARE
  orphaned_user RECORD;
  new_org_id UUID;
  user_email TEXT;
  user_full_name TEXT;
  pending_invitation RECORD;
  fixed_count INTEGER := 0;
  skipped_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting fix for orphaned auth users...';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Loop through all orphaned users
  FOR orphaned_user IN
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data,
      au.created_at
    FROM auth.users au
    LEFT JOIN users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    BEGIN
      user_email := orphaned_user.email;
      user_full_name := COALESCE(
        orphaned_user.raw_user_meta_data->>'full_name',
        orphaned_user.raw_user_meta_data->>'name',
        split_part(user_email, '@', 1)
      );

      RAISE NOTICE 'Processing orphaned user: % (ID: %)', user_email, orphaned_user.id;

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
        RAISE NOTICE '  Found pending invitation - adding to organization %', pending_invitation.organization_id;
        
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
          orphaned_user.id,
          user_email,
          user_full_name,
          pending_invitation.organization_id,
          pending_invitation.role,
          orphaned_user.raw_user_meta_data->>'phone'
        );

        -- Mark invitation as accepted
        UPDATE team_invitations
        SET 
          status = 'accepted',
          updated_at = NOW()
        WHERE email = user_email
          AND status = 'pending'
          AND organization_id = pending_invitation.organization_id;

        RAISE NOTICE '  ✅ User added to organization % via invitation', pending_invitation.organization_id;
        fixed_count := fixed_count + 1;

      ELSE
        -- No pending invitation - create new organization
        RAISE NOTICE '  No pending invitation - creating new organization';
        
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
          orphaned_user.id,
          user_email,
          user_full_name,
          new_org_id,
          'owner', -- New users are owners of their own org
          orphaned_user.raw_user_meta_data->>'phone'
        );

        RAISE NOTICE '  ✅ User created with new organization %', new_org_id;
        fixed_count := fixed_count + 1;
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE WARNING '  ❌ Error fixing user %: %', user_email, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fix complete!';
  RAISE NOTICE '  Fixed: %', fixed_count;
  RAISE NOTICE '  Errors: %', error_count;
  RAISE NOTICE '========================================';
END $$;

-- Verify the fix
SELECT 
  '=== VERIFICATION ===' as section,
  COUNT(*) as orphaned_users_remaining
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- Show all fixed users
SELECT 
  '=== FIXED USERS ===' as section,
  u.email,
  u.name,
  u.role,
  o.name as organization_name
FROM users u
LEFT JOIN organizations o ON o.id = u.organization_id
WHERE u.id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN users u2 ON au.id = u2.id
  WHERE u2.id IS NOT NULL
)
ORDER BY u.created_at DESC
LIMIT 10;

