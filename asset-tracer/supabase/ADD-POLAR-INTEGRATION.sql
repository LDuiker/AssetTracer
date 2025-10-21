-- Add Polar.sh integration fields to organizations table
-- This migration adds fields to store Polar.sh customer and subscription IDs

-- Add Polar.sh customer ID
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_customer_id TEXT;

-- Add Polar.sh subscription ID (replaces stripe_subscription_id)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT;

-- Add Polar.sh product ID to track which plan is active
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_product_id TEXT;

-- Add Polar.sh subscription status
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_subscription_status TEXT DEFAULT 'inactive' 
CHECK (polar_subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'inactive'));

-- Add Polar.sh subscription period dates
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_current_period_start TIMESTAMPTZ;
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_current_period_end TIMESTAMPTZ;

-- Add Polar.sh metadata for additional subscription info
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_metadata JSONB DEFAULT '{}';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_polar_customer_id ON organizations(polar_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_polar_subscription_id ON organizations(polar_subscription_id);

-- Add comments for documentation
COMMENT ON COLUMN organizations.polar_customer_id IS 'Polar.sh customer ID for billing';
COMMENT ON COLUMN organizations.polar_subscription_id IS 'Polar.sh subscription ID';
COMMENT ON COLUMN organizations.polar_product_id IS 'Polar.sh product ID for the current plan';
COMMENT ON COLUMN organizations.polar_subscription_status IS 'Current status of Polar.sh subscription';
COMMENT ON COLUMN organizations.polar_current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN organizations.polar_current_period_end IS 'End of current billing period';
COMMENT ON COLUMN organizations.polar_metadata IS 'Additional Polar.sh subscription metadata';

-- Update existing organizations to have default values
UPDATE organizations 
SET 
  polar_subscription_status = 'inactive',
  polar_metadata = '{}'
WHERE polar_subscription_status IS NULL;
