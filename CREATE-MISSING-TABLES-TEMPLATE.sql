-- =====================================================
-- CREATE MISSING TABLES IN PRODUCTION
-- =====================================================
-- TEMPLATE - Will be filled in once you share the staging schema
-- =====================================================

-- =====================================================
-- Table 1: organization_members
-- =====================================================

CREATE TABLE IF NOT EXISTS organization_members (
  -- Columns will be filled in based on staging schema
  -- Example structure (to be confirmed):
  -- id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- role TEXT NOT NULL,
  -- joined_at TIMESTAMP DEFAULT NOW(),
  -- created_at TIMESTAMP DEFAULT NOW(),
  -- updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE organization_members IS 'Members of an organization (to be updated)';

-- Add indexes (to be filled in)
-- CREATE INDEX IF NOT EXISTS idx_organization_members_org 
--   ON organization_members(organization_id);
-- CREATE INDEX IF NOT EXISTS idx_organization_members_user 
--   ON organization_members(user_id);

-- Enable RLS (if needed)
-- ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (to be filled in)
-- CREATE POLICY "policy_name" ON organization_members ...;

-- =====================================================
-- Table 2: subscriptions
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  -- Columns will be filled in based on staging schema
  -- Example structure (to be confirmed):
  -- id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- subscription_tier TEXT NOT NULL,
  -- status TEXT NOT NULL,
  -- stripe_subscription_id TEXT,
  -- stripe_customer_id TEXT,
  -- current_period_start TIMESTAMP,
  -- current_period_end TIMESTAMP,
  -- cancel_at TIMESTAMP,
  -- canceled_at TIMESTAMP,
  -- created_at TIMESTAMP DEFAULT NOW(),
  -- updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE subscriptions IS 'Subscription details for organizations (to be updated)';

-- Add indexes (to be filled in)
-- CREATE INDEX IF NOT EXISTS idx_subscriptions_org 
--   ON subscriptions(organization_id);
-- CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe 
--   ON subscriptions(stripe_subscription_id);

-- Enable RLS (if needed)
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (to be filled in)
-- CREATE POLICY "policy_name" ON subscriptions ...;

-- =====================================================
-- Verification
-- =====================================================

-- Check tables were created
SELECT 
  tablename,
  'Created' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organization_members', 'subscriptions')
ORDER BY tablename;

-- =====================================================
-- NEXT STEPS
-- =====================================================
-- 1. First, run EXPORT-ORGANIZATION-MEMBERS-AND-SUBSCRIPTIONS.sql in STAGING
-- 2. Share the output with me
-- 3. I'll update this template with the exact schema
-- 4. Then you can run this in PRODUCTION
-- =====================================================

