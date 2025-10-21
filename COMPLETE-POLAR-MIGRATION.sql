-- =====================================================
-- COMPLETE Polar Integration Migration
-- =====================================================
-- This adds ALL subscription fields to the organizations table
-- Run this ONCE in Supabase SQL Editor
-- =====================================================

-- Step 1: Add basic subscription tier fields
-- =====================================================

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' 
CHECK (subscription_tier IN ('free', 'pro', 'business'));

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'
CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'past_due'));

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Step 2: Add Polar.sh integration fields
-- =====================================================

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_customer_id TEXT;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_product_id TEXT;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_subscription_status TEXT DEFAULT 'inactive' 
CHECK (polar_subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'inactive'));

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_current_period_start TIMESTAMPTZ;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_current_period_end TIMESTAMPTZ;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_metadata JSONB DEFAULT '{}';

-- Step 3: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier 
ON organizations(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status 
ON organizations(subscription_status);

CREATE INDEX IF NOT EXISTS idx_organizations_polar_customer_id 
ON organizations(polar_customer_id);

CREATE INDEX IF NOT EXISTS idx_organizations_polar_subscription_id 
ON organizations(polar_subscription_id);

-- Step 4: Add helpful comments
-- =====================================================

COMMENT ON COLUMN organizations.subscription_tier IS 'Current subscription tier: free, pro, or business';
COMMENT ON COLUMN organizations.subscription_status IS 'Overall subscription status';
COMMENT ON COLUMN organizations.subscription_start_date IS 'When current subscription started';
COMMENT ON COLUMN organizations.subscription_end_date IS 'When current subscription ends (null for free tier)';

COMMENT ON COLUMN organizations.polar_customer_id IS 'Polar.sh customer ID for billing';
COMMENT ON COLUMN organizations.polar_subscription_id IS 'Polar.sh subscription ID';
COMMENT ON COLUMN organizations.polar_product_id IS 'Polar.sh product ID for the current plan';
COMMENT ON COLUMN organizations.polar_subscription_status IS 'Current status of Polar.sh subscription';
COMMENT ON COLUMN organizations.polar_current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN organizations.polar_current_period_end IS 'End of current billing period';
COMMENT ON COLUMN organizations.polar_metadata IS 'Additional Polar.sh subscription metadata';

-- Step 5: Initialize existing organizations
-- =====================================================

UPDATE organizations 
SET 
  subscription_tier = COALESCE(subscription_tier, 'free'),
  subscription_status = COALESCE(subscription_status, 'active'),
  polar_subscription_status = COALESCE(polar_subscription_status, 'inactive'),
  polar_metadata = COALESCE(polar_metadata, '{}')
WHERE subscription_tier IS NULL 
   OR polar_subscription_status IS NULL;

-- =====================================================
-- Verification Query
-- =====================================================

-- Run this to verify all columns were added:
SELECT 
  column_name, 
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizations' 
  AND column_name LIKE ANY(ARRAY['subscription%', 'polar%'])
ORDER BY column_name;

-- =====================================================
-- Success Message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Polar Integration Migration Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Added Columns:';
    RAISE NOTICE '   - subscription_tier';
    RAISE NOTICE '   - subscription_status';
    RAISE NOTICE '   - subscription_start_date';
    RAISE NOTICE '   - subscription_end_date';
    RAISE NOTICE '   - polar_customer_id';
    RAISE NOTICE '   - polar_subscription_id';
    RAISE NOTICE '   - polar_product_id';
    RAISE NOTICE '   - polar_subscription_status';
    RAISE NOTICE '   - polar_current_period_start';
    RAISE NOTICE '   - polar_current_period_end';
    RAISE NOTICE '   - polar_metadata';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Your database is ready for subscriptions!';
    RAISE NOTICE '';
END $$;

