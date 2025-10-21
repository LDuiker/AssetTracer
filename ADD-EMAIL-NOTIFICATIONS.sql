-- =====================================================
-- Add Email Notifications Preference
-- =====================================================
-- This adds email notification preferences to organizations table
-- Run this ONCE in Supabase SQL Editor
-- =====================================================

-- Add email notifications toggle column
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_organizations_email_notifications 
ON organizations(email_notifications_enabled);

-- Add helpful comment
COMMENT ON COLUMN organizations.email_notifications_enabled IS 'Enable/disable all email notifications for the organization';

-- Initialize existing organizations (enable by default for Business plan)
UPDATE organizations 
SET email_notifications_enabled = CASE 
  WHEN subscription_tier = 'business' THEN true
  ELSE false
END
WHERE email_notifications_enabled IS NULL;

-- =====================================================
-- Verification Query
-- =====================================================

SELECT 
  id,
  name,
  subscription_tier,
  email_notifications_enabled
FROM organizations
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- Success Message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Email Notifications Column Added!';
    RAISE NOTICE '';
    RAISE NOTICE '📧 Features:';
    RAISE NOTICE '   - email_notifications_enabled column added';
    RAISE NOTICE '   - Enabled by default for Business plan';
    RAISE NOTICE '   - Business-only feature';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Ready for email notification preferences!';
    RAISE NOTICE '';
END $$;

