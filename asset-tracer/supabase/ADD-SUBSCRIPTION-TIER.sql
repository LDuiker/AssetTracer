-- =====================================================
-- Add Subscription Tier to Organizations
-- =====================================================
-- This adds subscription management to the application
-- =====================================================

-- Step 1: Add subscription_tier column
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business'));

-- Step 2: Add subscription metadata columns
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'past_due')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Step 3: Add comments
COMMENT ON COLUMN organizations.subscription_tier IS 'Current subscription tier: free, pro, or business';
COMMENT ON COLUMN organizations.subscription_start_date IS 'When current subscription started';
COMMENT ON COLUMN organizations.subscription_end_date IS 'When current subscription ends (null for free tier)';
COMMENT ON COLUMN organizations.subscription_status IS 'Status of subscription: active, cancelled, expired, past_due';
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Stripe subscription ID';

-- Step 4: Set all existing organizations to free tier (safe default)
UPDATE organizations
SET subscription_tier = 'free',
    subscription_status = 'active'
WHERE subscription_tier IS NULL;

-- Step 5: Create index for quick subscription lookups
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier 
ON organizations(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status 
ON organizations(subscription_status);

-- Step 6: Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('subscription_tier', 'subscription_status', 'subscription_start_date', 'subscription_end_date', 'stripe_customer_id', 'stripe_subscription_id')
ORDER BY column_name;

-- Step 7: Show current subscriptions
SELECT 
  id,
  name,
  subscription_tier,
  subscription_status,
  subscription_start_date,
  subscription_end_date,
  created_at
FROM organizations
ORDER BY created_at DESC;

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Subscription tier column added successfully!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'All organizations set to FREE tier by default';
  RAISE NOTICE '';
  RAISE NOTICE 'To upgrade an organization to Pro:';
  RAISE NOTICE 'UPDATE organizations';
  RAISE NOTICE 'SET subscription_tier = ''pro'',';
  RAISE NOTICE '    subscription_status = ''active'',';
  RAISE NOTICE '    subscription_start_date = NOW()';
  RAISE NOTICE 'WHERE id = ''[org-id]'';';
  RAISE NOTICE '';
  RAISE NOTICE 'Features will be enabled based on tier!';
  RAISE NOTICE '================================================';
END $$;

