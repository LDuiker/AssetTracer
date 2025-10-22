-- =====================================================
-- STEP 1: Check Current State
-- =====================================================
-- Run this first to see what's in your database

SELECT 
  id,
  name,
  subscription_tier,
  subscription_status,
  polar_customer_id,
  polar_subscription_status,
  polar_current_period_end
FROM organizations
ORDER BY created_at DESC
LIMIT 1;

-- =====================================================
-- STEP 2: Force Update to Business Plan
-- =====================================================
-- Copy the 'id' from Step 1 result and use it here
-- Replace 'YOUR-ORG-ID-HERE' with the actual ID

UPDATE organizations 
SET 
  subscription_tier = 'business',
  subscription_status = 'active',
  polar_customer_id = '93853d15-fda5-4468-a2ec-c11831cc8822',
  polar_subscription_status = 'active',
  polar_current_period_start = NOW(),
  polar_current_period_end = NOW() + INTERVAL '1 month',
  polar_product_id = 'bbb245ef-6915-4c75-b59f-f14d61abb414',
  updated_at = NOW()
WHERE id = 'YOUR-ORG-ID-HERE';  -- Replace with actual ID from Step 1

-- =====================================================
-- ALTERNATIVE: Update by polar_customer_id
-- =====================================================
-- If you already have the polar_customer_id set, use this:

UPDATE organizations 
SET 
  subscription_tier = 'business',
  subscription_status = 'active',
  polar_subscription_status = 'active',
  polar_current_period_start = NOW(),
  polar_current_period_end = NOW() + INTERVAL '1 month',
  polar_product_id = 'bbb245ef-6915-4c75-b59f-f14d61abb414',
  updated_at = NOW()
WHERE polar_customer_id = '93853d15-fda5-4468-a2ec-c11831cc8822';

-- =====================================================
-- STEP 3: Verify the Update
-- =====================================================
-- Run this to confirm the change worked

SELECT 
  id,
  name,
  subscription_tier,
  subscription_status,
  polar_customer_id,
  polar_subscription_status,
  polar_current_period_start,
  polar_current_period_end
FROM organizations
WHERE polar_customer_id = '93853d15-fda5-4468-a2ec-c11831cc8822'
   OR id = (SELECT id FROM organizations ORDER BY created_at DESC LIMIT 1);

-- Expected result:
-- subscription_tier = 'business'
-- subscription_status = 'active'
-- polar_customer_id = '93853d15-fda5-4468-a2ec-c11831cc8822'
-- polar_subscription_status = 'active'
-- polar_current_period_end = (some date ~1 month from now)

