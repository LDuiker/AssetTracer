-- QUICK FIX: Manually Update Your Subscription Tier
-- Run this in Supabase SQL Editor to update your tier to Business

-- Update your organization to Business tier
UPDATE organizations 
SET 
  subscription_tier = 'business',
  subscription_status = 'active',
  polar_subscription_id = 'sub_manual_test',
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '1 month'
WHERE polar_customer_id = '93853d15-fda5-4468-a2ec-c11831cc8822';

-- Verify the update
SELECT 
  id,
  name,
  subscription_tier,
  subscription_status,
  polar_customer_id,
  subscription_start_date,
  subscription_end_date
FROM organizations 
WHERE polar_customer_id = '93853d15-fda5-4468-a2ec-c11831cc8822';

