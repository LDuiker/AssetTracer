-- =====================================================
-- Add Team Management to Asset Tracer
-- =====================================================
-- This adds team member roles and invitation system
-- =====================================================

-- Step 1: Add role column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

-- Step 2: Update existing users to 'owner' (they created the org)
UPDATE users
SET role = 'owner'
WHERE role IS NULL OR role = 'member';

-- Step 3: Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- Step 4: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_organization ON team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- Step 5: Add comments
COMMENT ON COLUMN users.role IS 'User role in the organization: owner (created org), admin, member, viewer';
COMMENT ON TABLE team_invitations IS 'Pending invitations to join an organization';
COMMENT ON COLUMN team_invitations.status IS 'Invitation status: pending, accepted, declined, expired';
COMMENT ON COLUMN team_invitations.token IS 'Unique token for accepting invitation';
COMMENT ON COLUMN team_invitations.expires_at IS 'When the invitation expires (typically 7 days)';

-- Step 6: Enable RLS on team_invitations
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for team_invitations
-- Users can view invitations for their organization
CREATE POLICY "Users can view invitations for their organization"
  ON team_invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Only owners and admins can create invitations
CREATE POLICY "Owners and admins can create invitations"
  ON team_invitations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Only owners and admins can delete invitations
CREATE POLICY "Owners and admins can delete invitations"
  ON team_invitations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Step 8: Create function to count team members
CREATE OR REPLACE FUNCTION count_team_members(org_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM users
  WHERE organization_id = org_id;
$$ LANGUAGE SQL STABLE;

-- Step 9: Create function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
  UPDATE team_invitations
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
$$ LANGUAGE SQL;

-- Step 10: Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'role'
ORDER BY column_name;

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'team_invitations'
ORDER BY ordinal_position;

-- Step 11: Show current users with roles
SELECT 
  u.id,
  u.email,
  u.role,
  o.name as organization_name,
  u.created_at
FROM users u
JOIN organizations o ON o.id = u.organization_id
ORDER BY o.created_at DESC, u.created_at ASC;

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Team management tables created successfully!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '  - role column to users table';
  RAISE NOTICE '  - team_invitations table';
  RAISE NOTICE '  - RLS policies for team security';
  RAISE NOTICE '  - Helper functions for team management';
  RAISE NOTICE '';
  RAISE NOTICE 'All existing users have been set to OWNER role.';
  RAISE NOTICE '';
  RAISE NOTICE 'Roles:';
  RAISE NOTICE '  - owner: Full control (cannot be removed)';
  RAISE NOTICE '  - admin: Can manage team and settings';
  RAISE NOTICE '  - member: Can create/edit most resources';
  RAISE NOTICE '  - viewer: Read-only access';
  RAISE NOTICE '================================================';
END $$;

