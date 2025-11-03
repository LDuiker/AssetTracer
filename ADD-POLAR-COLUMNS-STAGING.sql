-- =====================================================
-- Add Missing Polar Subscription Columns to Staging
-- =====================================================
-- Run this in Staging Supabase SQL Editor
-- =====================================================

-- Add Polar-related columns to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_product_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_subscription_status TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_current_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_current_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_metadata JSONB DEFAULT '{}'::jsonb;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_polar_customer_id ON organizations(polar_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_polar_subscription_id ON organizations(polar_subscription_id);

-- Verify columns were added
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
    AND column_name LIKE 'polar%'
ORDER BY column_name;

-- Now you can set the tier
UPDATE organizations
SET 
    subscription_tier = 'pro',
    subscription_status = 'active',
    updated_at = NOW()
WHERE id = (
    SELECT organization_id 
    FROM users 
    WHERE email = 'mrlduiker@gmail.com'
    LIMIT 1
);

-- Verify the update
SELECT 
    name,
    subscription_tier,
    subscription_status,
    polar_customer_id,
    updated_at
FROM organizations
WHERE id = (
    SELECT organization_id 
    FROM users 
    WHERE email = 'mrlduiker@gmail.com'
    LIMIT 1
);

-- =====================================================
-- Success message
-- =====================================================
-- If you see:
-- - subscription_tier = 'pro'
-- - subscription_status = 'active'
-- Then refresh your staging dashboard!
-- =====================================================

