-- =====================================================
-- Manual Pro Plan Upgrade Script
-- =====================================================
-- Use this to manually upgrade your organization to Pro
-- =====================================================

-- Step 1: Find your organization ID
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  o.subscription_tier as current_tier,
  u.email as user_email
FROM organizations o
JOIN users u ON u.organization_id = o.id
ORDER BY o.created_at DESC;

-- Step 2: Copy the organization ID from above and replace [YOUR-ORG-ID] below
-- Then run this UPDATE statement to upgrade to Pro

-- UPDATE organizations
-- SET subscription_tier = 'pro',
--     subscription_status = 'active',
--     subscription_start_date = NOW(),
--     subscription_end_date = NULL
-- WHERE id = '[YOUR-ORG-ID]';

-- Step 3: Verify the upgrade
SELECT 
  id,
  name,
  subscription_tier,
  subscription_status,
  subscription_start_date,
  subscription_end_date
FROM organizations
WHERE subscription_tier = 'pro';

-- =====================================================
-- To DOWNGRADE back to Free:
-- =====================================================
-- UPDATE organizations
-- SET subscription_tier = 'free',
--     subscription_status = 'active',
--     subscription_start_date = NULL,
--     subscription_end_date = NULL
-- WHERE id = '[YOUR-ORG-ID]';

