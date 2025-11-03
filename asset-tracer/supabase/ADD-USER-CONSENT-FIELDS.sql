-- =====================================================
-- Add User Consent Fields to users table
-- =====================================================
-- This migration adds fields to track user consent for:
-- - Terms of Service and Privacy Policy acceptance
-- - Marketing communications consent
-- =====================================================

-- Step 1: Add consent columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS terms_accepted_ip TEXT,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMP;

-- Step 2: Add comments for documentation
COMMENT ON COLUMN users.terms_accepted_at IS 'Timestamp when user accepted Terms of Service and Privacy Policy';
COMMENT ON COLUMN users.terms_accepted_ip IS 'IP address from which user accepted terms';
COMMENT ON COLUMN users.marketing_consent IS 'Whether user consented to receive marketing communications';
COMMENT ON COLUMN users.marketing_consent_at IS 'Timestamp when user provided marketing consent';

-- Step 3: Create index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_terms_accepted_at ON users(terms_accepted_at);
CREATE INDEX IF NOT EXISTS idx_users_marketing_consent ON users(marketing_consent);

-- Step 4: Verify the columns were added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN (
    'terms_accepted_at',
    'terms_accepted_ip',
    'marketing_consent',
    'marketing_consent_at'
  )
ORDER BY column_name;

-- Expected output:
-- terms_accepted_at | timestamp without time zone | YES | NULL
-- terms_accepted_ip  | text                        | YES | NULL
-- marketing_consent  | boolean                     | YES | false
-- marketing_consent_at | timestamp without time zone | YES | NULL

