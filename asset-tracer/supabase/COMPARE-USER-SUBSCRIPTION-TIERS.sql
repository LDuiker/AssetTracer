-- Compare subscription tiers and organization data between two users
-- One user has correct limiting, one doesn't

-- User 1: larona@stageworksafrica.com (CORRECT LIMITING)
-- User 2: mrlduiker@gmail.com (INCORRECT - button still active)

-- Step 1: Get user IDs and organization IDs
SELECT 
  'User Info' as section,
  u.id as user_id,
  u.email,
  pu.organization_id,
  o.id as org_id_from_users,
  o.subscription_tier,
  o.name as org_name
FROM auth.users u
LEFT JOIN public.users pu ON u.id = pu.id
LEFT JOIN public.organizations o ON pu.organization_id = o.id
WHERE u.email IN ('larona@stageworksafrica.com', 'mrlduiker@gmail.com')
ORDER BY u.email;

-- Step 2: Check organization subscription tiers directly
SELECT 
  'Organization Subscription Tiers' as section,
  o.id as org_id,
  o.name as org_name,
  o.subscription_tier,
  COUNT(DISTINCT u.id) as user_count
FROM public.organizations o
LEFT JOIN public.users u ON u.organization_id = o.id
WHERE u.email IN ('larona@stageworksafrica.com', 'mrlduiker@gmail.com')
GROUP BY o.id, o.name, o.subscription_tier
ORDER BY o.subscription_tier;

-- Step 3: Count quotations this month for each user (UTC)
SELECT 
  'Quotation Counts (This Month UTC)' as section,
  u.email,
  pu.organization_id,
  o.subscription_tier,
  COUNT(q.id) as quotations_this_month,
  ARRAY_AGG(q.id ORDER BY q.created_at DESC) as quotation_ids,
  ARRAY_AGG(q.created_at::text ORDER BY q.created_at DESC) as created_dates
FROM auth.users u
JOIN public.users pu ON u.id = pu.id
JOIN public.organizations o ON pu.organization_id = o.id
LEFT JOIN public.quotations q ON q.organization_id = o.id
  AND q.created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
WHERE u.email IN ('larona@stageworksafrica.com', 'mrlduiker@gmail.com')
GROUP BY u.email, pu.organization_id, o.subscription_tier
ORDER BY u.email;

-- Step 4: Count invoices this month for each user (UTC)
SELECT 
  'Invoice Counts (This Month UTC)' as section,
  u.email,
  pu.organization_id,
  o.subscription_tier,
  COUNT(i.id) as invoices_this_month,
  ARRAY_AGG(i.id ORDER BY i.created_at DESC) as invoice_ids,
  ARRAY_AGG(i.created_at::text ORDER BY i.created_at DESC) as created_dates
FROM auth.users u
JOIN public.users pu ON u.id = pu.id
JOIN public.organizations o ON pu.organization_id = o.id
LEFT JOIN public.invoices i ON i.organization_id = o.id
  AND i.created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
WHERE u.email IN ('larona@stageworksafrica.com', 'mrlduiker@gmail.com')
GROUP BY u.email, pu.organization_id, o.subscription_tier
ORDER BY u.email;

-- Step 5: Check if there are any NULL subscription_tiers
SELECT 
  'NULL Subscription Tiers Check' as section,
  o.id as org_id,
  o.name as org_name,
  o.subscription_tier,
  CASE 
    WHEN o.subscription_tier IS NULL THEN '⚠️ NULL - Will default to free'
    WHEN o.subscription_tier = '' THEN '⚠️ EMPTY STRING - Will default to free'
    ELSE '✅ Has value'
  END as status
FROM public.organizations o
WHERE o.id IN (
  SELECT DISTINCT u.organization_id 
  FROM public.users u
  JOIN auth.users au ON u.id = au.id
  WHERE au.email IN ('larona@stageworksafrica.com', 'mrlduiker@gmail.com')
);

-- Step 6: Verify the exact first day of month in UTC
SELECT 
  'UTC Date Calculation' as section,
  NOW() as current_time,
  NOW() AT TIME ZONE 'UTC' as current_time_utc,
  DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' as first_day_of_month_utc,
  DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'::text as first_day_iso_string;

