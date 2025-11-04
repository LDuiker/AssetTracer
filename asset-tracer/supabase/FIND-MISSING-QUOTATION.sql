-- Find the missing quotation for mrlduiker@gmail.com
-- The log shows only 4 quotations are being counted, but user has 5 total

-- Step 1: Get all quotations for this user's organization
SELECT 
  'All Quotations' as section,
  q.id as quotation_id,
  q.quotation_number,
  q.created_at,
  q.created_at AT TIME ZONE 'UTC' as created_at_utc,
  DATE_TRUNC('month', q.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' as month_truncated,
  DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' as current_month_start,
  CASE 
    WHEN q.created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' THEN '✅ Included in filter'
    ELSE '❌ EXCLUDED from filter'
  END as filter_status
FROM public.quotations q
JOIN public.users u ON q.organization_id = u.organization_id
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'mrlduiker@gmail.com'
ORDER BY q.created_at;

-- Step 2: Check if any quotations have NULL created_at
SELECT 
  'Quotations with NULL created_at' as section,
  q.id as quotation_id,
  q.quotation_number,
  q.created_at
FROM public.quotations q
JOIN public.users u ON q.organization_id = u.organization_id
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'mrlduiker@gmail.com'
  AND q.created_at IS NULL;

-- Step 3: Count quotations this month using the exact same logic as the backend
SELECT 
  'Monthly Count (Backend Logic)' as section,
  COUNT(*) as count_this_month,
  ARRAY_AGG(q.id ORDER BY q.created_at) as quotation_ids,
  ARRAY_AGG(q.created_at::text ORDER BY q.created_at) as created_dates
FROM public.quotations q
JOIN public.users u ON q.organization_id = u.organization_id
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'mrlduiker@gmail.com'
  AND q.created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';

-- Step 4: Find quotations created before the first day of the month (in any timezone)
SELECT 
  'Quotations Before Month Start' as section,
  q.id as quotation_id,
  q.quotation_number,
  q.created_at,
  q.created_at AT TIME ZONE 'UTC' as created_at_utc,
  DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' as month_start_utc,
  CASE 
    WHEN q.created_at < DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' THEN '❌ Before month start'
    ELSE '✅ After month start'
  END as status
FROM public.quotations q
JOIN public.users u ON q.organization_id = u.organization_id
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'mrlduiker@gmail.com'
  AND q.created_at < DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
ORDER BY q.created_at;

-- Step 5: Check all quotations with their exact timestamps
SELECT 
  'All Quotations with Timestamps' as section,
  q.id as quotation_id,
  q.quotation_number,
  q.created_at::text as created_at_raw,
  q.created_at AT TIME ZONE 'UTC'::text as created_at_utc,
  EXTRACT(EPOCH FROM (q.created_at AT TIME ZONE 'UTC')) as epoch_seconds,
  EXTRACT(EPOCH FROM (DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')) as month_start_epoch
FROM public.quotations q
JOIN public.users u ON q.organization_id = u.organization_id
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'mrlduiker@gmail.com'
ORDER BY q.created_at;

