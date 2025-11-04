-- =====================================================
-- Check User Quotation Limit Issue
-- =====================================================
-- Investigate why mrlduiker@gmail.com can create 6 quotations
-- instead of being limited to 5 on free tier
-- =====================================================

-- Step 1: Find the user
SELECT 
  id,
  email,
  name,
  organization_id,
  created_at
FROM users
WHERE email = 'mrlduiker@gmail.com';

-- Step 2: Check the user's organization subscription tier
SELECT 
  o.id,
  o.name,
  o.subscription_tier,
  o.subscription_status,
  o.created_at,
  COUNT(DISTINCT u.id) as user_count
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
WHERE o.id = (
  SELECT organization_id 
  FROM users 
  WHERE email = 'mrlduiker@gmail.com'
)
GROUP BY o.id, o.name, o.subscription_tier, o.subscription_status, o.created_at;

-- Step 3: Count quotations created this month for this organization
-- Using UTC to match the backend logic
WITH current_month_start AS (
  SELECT DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')::timestamp AS first_day_utc
)
SELECT 
  COUNT(*) as quotation_count,
  MIN(created_at) as earliest_quotation,
  MAX(created_at) as latest_quotation,
  ARRAY_AGG(id ORDER BY created_at) as quotation_ids,
  ARRAY_AGG(created_at::text ORDER BY created_at) as created_dates
FROM quotations
WHERE organization_id = (
  SELECT organization_id 
  FROM users 
  WHERE email = 'mrlduiker@gmail.com'
)
AND created_at >= (SELECT first_day_utc FROM current_month_start);

-- Step 4: List all quotations created this month with details
WITH current_month_start AS (
  SELECT DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')::timestamp AS first_day_utc
)
SELECT 
  q.id,
  q.subject,
  q.status,
  q.created_at,
  q.created_at AT TIME ZONE 'UTC' as created_at_utc,
  EXTRACT(EPOCH FROM (q.created_at - (SELECT first_day_utc FROM current_month_start))) / 86400 as days_since_month_start
FROM quotations q
WHERE q.organization_id = (
  SELECT organization_id 
  FROM users 
  WHERE email = 'mrlduiker@gmail.com'
)
AND q.created_at >= (SELECT first_day_utc FROM current_month_start)
ORDER BY q.created_at ASC;

-- Step 5: Check if any quotations were created before the month start calculation
-- This could happen if there's a timezone mismatch
WITH current_month_start_utc AS (
  SELECT DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')::timestamp AS first_day
),
current_month_start_local AS (
  SELECT DATE_TRUNC('month', NOW())::timestamp AS first_day_local
)
SELECT 
  q.id,
  q.created_at,
  q.created_at AT TIME ZONE 'UTC' as created_at_utc,
  (SELECT first_day FROM current_month_start_utc) as month_start_utc,
  (SELECT first_day_local FROM current_month_start_local) as month_start_local,
  CASE 
    WHEN q.created_at >= (SELECT first_day FROM current_month_start_utc) THEN 'Included by UTC'
    ELSE 'Excluded by UTC'
  END as utc_status,
  CASE 
    WHEN q.created_at >= (SELECT first_day_local FROM current_month_start_local) THEN 'Included by Local'
    ELSE 'Excluded by Local'
  END as local_status
FROM quotations q
WHERE q.organization_id = (
  SELECT organization_id 
  FROM users 
  WHERE email = 'mrlduiker@gmail.com'
)
AND q.created_at >= (SELECT first_day FROM current_month_start_utc) - INTERVAL '2 days'
ORDER BY q.created_at ASC;

-- Step 6: Verify the backend count query logic
-- This simulates what the backend API does
SELECT 
  COUNT(*) as count_from_select,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')::timestamp) as count_with_gte
FROM quotations
WHERE organization_id = (
  SELECT organization_id 
  FROM users 
  WHERE email = 'mrlduiker@gmail.com'
);

-- Step 7: Check if there are any duplicate quotations or data issues
SELECT 
  id,
  subject,
  status,
  created_at,
  COUNT(*) OVER (PARTITION BY id) as duplicate_count
FROM quotations
WHERE organization_id = (
  SELECT organization_id 
  FROM users 
  WHERE email = 'mrlduiker@gmail.com'
)
AND created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')::timestamp
ORDER BY created_at;

