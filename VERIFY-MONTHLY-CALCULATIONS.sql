-- VERIFY: Monthly profit calculations are accurate

SELECT '========================================' as separator;
SELECT '📊 MONTHLY PROFIT CALCULATIONS CHECK' as title;
SELECT '========================================' as separator;

-- Get all monthly P&L data
WITH monthly_data AS (
  SELECT * FROM get_monthly_pl(
    (SELECT id FROM organizations LIMIT 1),
    '2025-01-01'::date,
    '2025-12-31'::date
  )
)
SELECT 
  '1️⃣ MONTHLY P&L DATA:' as section,
  month,
  total_revenue as revenue,
  total_expenses as expenses,
  net_profit,
  -- Verify calculation
  (total_revenue - total_expenses) as calculated_profit,
  CASE 
    WHEN net_profit = (total_revenue - total_expenses) 
    THEN '✅ Correct'
    ELSE '❌ WRONG!'
  END as verification
FROM monthly_data
ORDER BY month;

-- Calculate summary statistics
WITH monthly_data AS (
  SELECT * FROM get_monthly_pl(
    (SELECT id FROM organizations LIMIT 1),
    '2025-01-01'::date,
    '2025-12-31'::date
  )
)
SELECT '2️⃣ SUMMARY CALCULATIONS:' as section;

WITH monthly_data AS (
  SELECT * FROM get_monthly_pl(
    (SELECT id FROM organizations LIMIT 1),
    '2025-01-01'::date,
    '2025-12-31'::date
  )
)
SELECT 
  'Total Revenue' as metric,
  SUM(total_revenue) as value
FROM monthly_data
UNION ALL
SELECT 
  'Total Expenses' as metric,
  SUM(total_expenses) as value
FROM monthly_data
UNION ALL
SELECT 
  'Net Profit' as metric,
  SUM(net_profit) as value
FROM monthly_data
UNION ALL
SELECT 
  'Month Count' as metric,
  COUNT(*)::numeric as value
FROM monthly_data
UNION ALL
SELECT 
  'Avg Monthly Revenue' as metric,
  AVG(total_revenue) as value
FROM monthly_data
UNION ALL
SELECT 
  'Avg Monthly Expenses' as metric,
  AVG(total_expenses) as value
FROM monthly_data
UNION ALL
SELECT 
  'Avg Monthly Profit' as metric,
  AVG(net_profit) as value
FROM monthly_data;

-- Find best and worst months
WITH monthly_data AS (
  SELECT * FROM get_monthly_pl(
    (SELECT id FROM organizations LIMIT 1),
    '2025-01-01'::date,
    '2025-12-31'::date
  )
)
SELECT '3️⃣ BEST & WORST MONTHS:' as section;

WITH monthly_data AS (
  SELECT * FROM get_monthly_pl(
    (SELECT id FROM organizations LIMIT 1),
    '2025-01-01'::date,
    '2025-12-31'::date
  )
),
ranked AS (
  SELECT 
    month,
    net_profit,
    ROW_NUMBER() OVER (ORDER BY net_profit DESC) as rank_desc,
    ROW_NUMBER() OVER (ORDER BY net_profit ASC) as rank_asc
  FROM monthly_data
)
SELECT 
  CASE 
    WHEN rank_desc = 1 THEN '🏆 BEST MONTH'
    WHEN rank_asc = 1 THEN '📉 WORST MONTH'
  END as type,
  month,
  net_profit
FROM ranked
WHERE rank_desc = 1 OR rank_asc = 1
ORDER BY net_profit DESC;

-- Verify against transactions table directly
SELECT '4️⃣ VERIFY AGAINST TRANSACTIONS:' as section;

SELECT 
  TO_CHAR(transaction_date, 'YYYY-MM') as month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as net_profit
FROM transactions
WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
  AND transaction_date >= '2025-01-01'
  AND transaction_date <= '2025-12-31'
GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
ORDER BY month;

SELECT '========================================' as separator;
SELECT '✅ Compare the results above!' as result;
SELECT 'Section 1 & 4 should match exactly' as note;
SELECT '========================================' as separator;

