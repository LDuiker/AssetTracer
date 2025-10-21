-- =====================================================
-- Team Members - Quick Reference SQL
-- =====================================================
-- Useful queries for managing teams during development
-- =====================================================

-- ============= VIEW OPERATIONS =============

-- 1. View all team members in all organizations
SELECT 
  o.name as organization_name,
  u.email,
  u.name,
  u.role,
  u.created_at
FROM users u
JOIN organizations o ON o.id = u.organization_id
ORDER BY o.name, u.role, u.created_at;

-- 2. View team members for a specific organization
SELECT 
  u.email,
  u.name,
  u.role,
  u.created_at,
  DATE_PART('day', NOW() - u.created_at) as days_as_member
FROM users u
WHERE u.organization_id = '[your-org-id]'
ORDER BY u.created_at;

-- 3. Count team members per organization
SELECT 
  o.name as organization_name,
  o.subscription_tier,
  COUNT(u.id) as team_size,
  CASE 
    WHEN o.subscription_tier = 'free' THEN 1
    WHEN o.subscription_tier = 'pro' THEN 5
    ELSE 999
  END as member_limit
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
GROUP BY o.id, o.name, o.subscription_tier
ORDER BY team_size DESC;

-- 4. View all pending invitations
SELECT 
  o.name as organization_name,
  ti.email as invited_email,
  ti.role as invited_role,
  ti.status,
  ti.expires_at,
  ti.created_at,
  inviter.email as invited_by,
  DATE_PART('day', ti.expires_at - NOW()) as days_until_expiry
FROM team_invitations ti
JOIN organizations o ON o.id = ti.organization_id
JOIN users inviter ON inviter.id = ti.invited_by
WHERE ti.status = 'pending'
ORDER BY ti.created_at DESC;

-- 5. View expired invitations
SELECT 
  o.name as organization_name,
  ti.email,
  ti.role,
  ti.expires_at,
  ti.created_at
FROM team_invitations ti
JOIN organizations o ON o.id = ti.organization_id
WHERE ti.expires_at < NOW()
  AND ti.status = 'pending'
ORDER BY ti.expires_at DESC;

-- ============= UPDATE OPERATIONS =============

-- 6. Promote a member to admin
-- UPDATE users
-- SET role = 'admin'
-- WHERE email = 'member@example.com'
--   AND organization_id = '[your-org-id]';

-- 7. Demote an admin to member
-- UPDATE users
-- SET role = 'member'
-- WHERE email = 'admin@example.com'
--   AND organization_id = '[your-org-id]';

-- 8. Make someone a viewer
-- UPDATE users
-- SET role = 'viewer'
-- WHERE email = 'user@example.com'
--   AND organization_id = '[your-org-id]';

-- ============= CLEANUP OPERATIONS =============

-- 9. Expire all old pending invitations
SELECT expire_old_invitations();

-- 10. Delete a specific pending invitation
-- DELETE FROM team_invitations
-- WHERE email = 'invited@example.com'
--   AND organization_id = '[your-org-id]'
--   AND status = 'pending';

-- 11. Delete all expired invitations
-- DELETE FROM team_invitations
-- WHERE expires_at < NOW();

-- 12. Remove a team member (except owner)
-- DELETE FROM users
-- WHERE email = 'member@example.com'
--   AND organization_id = '[your-org-id]'
--   AND role != 'owner';

-- ============= TESTING / DEVELOPMENT =============

-- 13. Add a test team member manually
-- INSERT INTO users (id, email, organization_id, role, name)
-- VALUES (
--   '[auth-user-id]',  -- Must exist in auth.users first
--   'testmember@example.com',
--   '[your-org-id]',
--   'member',
--   'Test Member'
-- );

-- 14. Create a test invitation
-- INSERT INTO team_invitations (
--   organization_id,
--   email,
--   role,
--   invited_by,
--   token,
--   expires_at,
--   status
-- ) VALUES (
--   '[your-org-id]',
--   'newinvite@example.com',
--   'member',
--   '[your-user-id]',
--   encode(gen_random_bytes(32), 'hex'),
--   NOW() + INTERVAL '7 days',
--   'pending'
-- );

-- 15. Find your organization and user IDs
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  u.id as your_user_id,
  u.email as your_email,
  u.role as your_role
FROM users u
JOIN organizations o ON o.id = u.organization_id
WHERE u.email = 'your-email@example.com';

-- ============= ANALYTICS =============

-- 16. Team composition by role
SELECT 
  o.name as organization_name,
  u.role,
  COUNT(*) as count
FROM users u
JOIN organizations o ON o.id = u.organization_id
GROUP BY o.name, u.role
ORDER BY o.name, u.role;

-- 17. Invitation statistics
SELECT 
  o.name as organization_name,
  ti.status,
  COUNT(*) as count
FROM team_invitations ti
JOIN organizations o ON o.id = ti.organization_id
GROUP BY o.name, ti.status
ORDER BY o.name, ti.status;

-- 18. Organizations approaching team limits
SELECT 
  o.name as organization_name,
  o.subscription_tier,
  COUNT(u.id) as current_members,
  CASE 
    WHEN o.subscription_tier = 'free' THEN 1
    WHEN o.subscription_tier = 'pro' THEN 5
    ELSE 999
  END as member_limit,
  CASE 
    WHEN o.subscription_tier = 'free' AND COUNT(u.id) >= 1 THEN 'AT LIMIT'
    WHEN o.subscription_tier = 'pro' AND COUNT(u.id) >= 4 THEN 'NEAR LIMIT'
    ELSE 'OK'
  END as status
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
GROUP BY o.id, o.name, o.subscription_tier
HAVING COUNT(u.id) >= CASE 
    WHEN o.subscription_tier = 'free' THEN 1
    WHEN o.subscription_tier = 'pro' THEN 4
    ELSE 900
  END
ORDER BY current_members DESC;

-- ============= HELPER FUNCTIONS =============

-- 19. Count team members for an organization
SELECT count_team_members('[your-org-id]');

-- 20. Verify RLS policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'team_invitations'
ORDER BY policyname;

-- =====================================================
-- TIPS
-- =====================================================
-- Replace '[your-org-id]' with actual organization ID
-- Replace '[your-user-id]' with actual user ID
-- Replace '[auth-user-id]' with ID from auth.users table
-- Always backup before DELETE operations
-- Test in development before running in production
-- =====================================================

