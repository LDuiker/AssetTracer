-- DEEP DIVE: Check every step of the financial calculation

SELECT '========================================' as separator;
SELECT '🔍 DEEP DIVE FINANCIAL DIAGNOSTIC' as title;
SELECT '========================================' as separator;

-- Step 1: Get your organization ID
SELECT '1️⃣ YOUR ORGANIZATION:' as step;
SELECT id as organization_id, name FROM organizations LIMIT 1;

-- Step 2: Raw transaction data with ALL details
SELECT '2️⃣ ALL YOUR TRANSACTIONS (RAW):' as step;
SELECT 
  type,
  amount,
  date as old_date,
  transaction_date as new_date,
  description,
  category,
  asset_id,
  invoice_id,
  organization_id,
  created_at
FROM transactions
ORDER BY created_at DESC;

-- Step 3: Simple aggregation by type
SELECT '3️⃣ SIMPLE SUM BY TYPE:' as step;
SELECT 
  type,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date
FROM transactions
WHERE transaction_date IS NOT NULL
GROUP BY type;

-- Step 4: Check current month range
SELECT '4️⃣ CURRENT MONTH RANGE:' as step;
SELECT 
  DATE_TRUNC('month', CURRENT_DATE)::date as month_start,
  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date as month_end,
  CURRENT_DATE as today;

-- Step 5: Transactions in current month
SELECT '5️⃣ TRANSACTIONS IN CURRENT MONTH:' as step;
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
WHERE transaction_date >= DATE_TRUNC('month', CURRENT_DATE)::date
  AND transaction_date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
GROUP BY type;

-- Step 6: Transactions for THIS YEAR (Year-to-Date)
SELECT '6️⃣ YEAR-TO-DATE TRANSACTIONS:' as step;
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
WHERE transaction_date >= DATE_TRUNC('year', CURRENT_DATE)::date
GROUP BY type;

-- Step 7: Call get_financial_summary with explicit org ID
SELECT '7️⃣ TESTING get_financial_summary() FUNCTION:' as step;
WITH org AS (SELECT id FROM organizations LIMIT 1)
SELECT 
  current_month_revenue,
  current_month_expenses,
  current_month_profit,
  ytd_revenue,
  ytd_expenses,
  ytd_profit,
  total_assets_value,
  currency
FROM get_financial_summary((SELECT id FROM org));

-- Step 8: Test get_asset_financials function
SELECT '8️⃣ TESTING get_asset_financials() FUNCTION:' as step;
WITH org AS (SELECT id FROM organizations LIMIT 1)
SELECT 
  asset_id,
  asset_name,
  total_spend,
  total_revenue,
  profit_loss,
  roi_percentage
FROM get_asset_financials((SELECT id FROM org))
ORDER BY total_revenue DESC
LIMIT 10;

-- Step 9: Check if transactions have correct organization_id
SELECT '9️⃣ ORGANIZATION ID MATCH CHECK:' as step;
SELECT 
  t.organization_id as transaction_org_id,
  o.id as organization_id,
  o.name as organization_name,
  CASE 
    WHEN t.organization_id = o.id THEN '✅ MATCH'
    ELSE '❌ MISMATCH!'
  END as status,
  COUNT(*) as transaction_count
FROM transactions t
CROSS JOIN organizations o
GROUP BY t.organization_id, o.id, o.name;

-- Step 10: Show what the API endpoint would return
SELECT '🔟 WHAT API RETURNS (get_monthly_pl):' as step;
WITH org AS (SELECT id FROM organizations LIMIT 1)
SELECT 
  month,
  total_revenue,
  total_expenses,
  net_profit,
  revenue_count,
  expense_count
FROM get_monthly_pl(
  (SELECT id FROM org),
  DATE_TRUNC('year', CURRENT_DATE)::date,
  CURRENT_DATE
)
ORDER BY month DESC
LIMIT 3;

SELECT '========================================' as separator;
SELECT '📊 KEY QUESTIONS:' as title;
SELECT '========================================' as separator;
SELECT 'A) Does "SIMPLE SUM BY TYPE" show your income?' as q1;
SELECT 'B) Does "CURRENT MONTH" show your transactions?' as q2;
SELECT 'C) Does "get_financial_summary" return zeros?' as q3;
SELECT 'D) Is there an ORGANIZATION ID MISMATCH?' as q4;
SELECT '========================================' as separator;

