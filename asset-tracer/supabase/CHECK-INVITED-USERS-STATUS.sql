-- =====================================================
-- CHECK INVITED USERS STATUS
-- =====================================================
-- Run this to see the current state of invited users
-- and fix them if they're in the wrong organization
-- =====================================================

-- Step 1: Check all users and their organizations
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.organization_id,
  o.name as organization_name,
  u.created_at,
  CASE 
    WHEN u.email IN ('larona@stageworksafrica.com', 'mavenzone341@gmail.com') 
    THEN '🔍 INVITED USER'
    ELSE ''
  END as status
FROM users u
LEFT JOIN organizations o ON o.id = u.organization_id
WHERE u.email IN ('larona@stageworksafrica.com', 'mavenzone341@gmail.com', 'mrlduiker@gmail.com')
ORDER BY u.email;

-- Step 2: Check team invitations for these users
SELECT 
  ti.id,
  ti.email,
  ti.role as invited_role,
  ti.status,
  ti.created_at,
  ti.expires_at,
  o.name as organization_name,
  inviter.email as invited_by_email
FROM team_invitations ti
LEFT JOIN organizations o ON o.id = ti.organization_id
LEFT JOIN users inviter ON inviter.id = ti.invited_by
WHERE ti.email IN ('larona@stageworksafrica.com', 'mavenzone341@gmail.com')
ORDER BY ti.created_at DESC;

-- Step 3: Get the owner's organization ID
SELECT 
  u.id as owner_id,
  u.email as owner_email,
  u.organization_id as owner_org_id,
  o.name as owner_org_name
FROM users u
LEFT JOIN organizations o ON o.id = u.organization_id
WHERE u.email = 'mrlduiker@gmail.com'
LIMIT 1;

-- Step 4: Check if invited users are in the correct organization
-- (This will show NULL if they're not in the owner's org)
SELECT 
  u.email,
  u.organization_id,
  owner_org.organization_id as owner_org_id,
  CASE 
    WHEN u.organization_id = owner_org.organization_id 
    THEN '✅ CORRECT'
    ELSE '❌ WRONG ORG'
  END as status
FROM users u
CROSS JOIN (
  SELECT organization_id 
  FROM users 
  WHERE email = 'mrlduiker@gmail.com' 
  LIMIT 1
) owner_org
WHERE u.email IN ('larona@stageworksafrica.com', 'mavenzone341@gmail.com');

