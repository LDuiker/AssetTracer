-- =====================================================
-- Add UPDATE Policy for team_invitations
-- =====================================================
-- This allows users to accept invitations (update status to 'accepted')
-- =====================================================

-- Allow users to update invitations sent to their email
-- This is needed for the accept-invite flow
CREATE POLICY "Users can update invitations sent to their email"
  ON team_invitations FOR UPDATE
  USING (
    -- Allow if the invitation email matches the user's email
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    -- Allow if user is in the organization (for admins/owners to update)
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same conditions for the new values
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can update invitations sent to their email" ON team_invitations IS 
  'Allows users to accept invitations sent to their email, or organization members to update invitation status';

