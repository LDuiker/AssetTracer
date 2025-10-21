-- =====================================================
-- Manual Business Plan Upgrade Script
-- =====================================================
-- Use this to manually upgrade your organization to Business
-- =====================================================

-- Step 1: Find your organization ID
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  o.subscription_tier as current_tier,
  u.email as user_email,
  COUNT(*) OVER (PARTITION BY o.id) as team_size
FROM organizations o
JOIN users u ON u.organization_id = o.id
ORDER BY o.created_at DESC;

-- Step 2: Copy the organization ID from above and replace [YOUR-ORG-ID] below
-- Then run this UPDATE statement to upgrade to Business

-- UPDATE organizations
-- SET subscription_tier = 'business',
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
WHERE subscription_tier = 'business';

-- =====================================================
-- Quick Tier Comparison
-- =====================================================
SELECT 
  o.name,
  o.subscription_tier,
  COUNT(u.id) as current_team_size,
  CASE 
    WHEN o.subscription_tier = 'free' THEN '1 user max'
    WHEN o.subscription_tier = 'pro' THEN '5 users max'
    WHEN o.subscription_tier = 'business' THEN '20 users max'
    WHEN o.subscription_tier = 'enterprise' THEN 'Unlimited users'
    ELSE 'Unknown'
  END as team_limit,
  CASE 
    WHEN o.subscription_tier = 'free' THEN '20 assets'
    WHEN o.subscription_tier = 'pro' THEN '500 assets'
    WHEN o.subscription_tier IN ('business', 'enterprise') THEN 'Unlimited assets'
    ELSE 'Unknown'
  END as asset_limit
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
GROUP BY o.id, o.name, o.subscription_tier
ORDER BY o.name;

-- =====================================================
-- To DOWNGRADE back to Free:
-- =====================================================
-- UPDATE organizations
-- SET subscription_tier = 'free',
--     subscription_status = 'active',
--     subscription_start_date = NULL,
--     subscription_end_date = NULL
-- WHERE id = '[YOUR-ORG-ID]';

-- =====================================================
-- To UPGRADE from Pro to Business:
-- =====================================================
-- UPDATE organizations
-- SET subscription_tier = 'business',
--     subscription_status = 'active',
--     subscription_start_date = NOW()
-- WHERE id = '[YOUR-ORG-ID]'
--   AND subscription_tier = 'pro';

