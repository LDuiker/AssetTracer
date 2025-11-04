-- =====================================================
-- Verify Quotation Count Query - Match Backend Logic
-- =====================================================
-- This query exactly matches what the backend API does
-- =====================================================

-- Get the organization ID for mrlduiker@gmail.com
WITH user_org AS (
  SELECT organization_id
  FROM users
  WHERE email = 'mrlduiker@gmail.com'
),
-- Calculate first day of month in UTC (matching backend logic)
month_start AS (
  SELECT 
    DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')::timestamp AS first_day_utc
)
-- Count quotations using the exact same logic as backend
SELECT 
  COUNT(*) as backend_count,
  (SELECT first_day_utc FROM month_start) as month_start_utc,
  NOW() AT TIME ZONE 'UTC' as current_time_utc,
  (SELECT organization_id FROM user_org) as organization_id
FROM quotations
WHERE organization_id = (SELECT organization_id FROM user_org)
AND created_at >= (SELECT first_day_utc FROM month_start);

-- Also show all quotations that should be counted
WITH user_org AS (
  SELECT organization_id
  FROM users
  WHERE email = 'mrlduiker@gmail.com'
),
month_start AS (
  SELECT 
    DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')::timestamp AS first_day_utc
)
SELECT 
  q.id,
  q.created_at,
  q.created_at AT TIME ZONE 'UTC' as created_at_utc,
  (SELECT first_day_utc FROM month_start) as month_start_utc,
  CASE 
    WHEN q.created_at >= (SELECT first_day_utc FROM month_start) THEN 'COUNTED'
    ELSE 'NOT COUNTED'
  END as count_status
FROM quotations q
WHERE q.organization_id = (SELECT organization_id FROM user_org)
AND q.created_at >= (SELECT first_day_utc FROM month_start) - INTERVAL '1 day'
ORDER BY q.created_at;

