-- SIMPLE MONTHLY PROFIT CHECK
-- Run this in Supabase SQL Editor

-- First, check if you have transaction data
SELECT 'Step 1: Transaction Data' as check_step;
SELECT 
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
  COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as net_profit
FROM transactions
WHERE organization_id = (SELECT id FROM organizations LIMIT 1);

-- Check monthly breakdown
SELECT 'Step 2: Monthly Breakdown' as check_step;
SELECT 
  TO_CHAR(transaction_date, 'YYYY-MM') as month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as revenue,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as net_profit
FROM transactions
WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
  AND transaction_date IS NOT NULL
GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
ORDER BY month DESC;

-- Calculate averages
SELECT 'Step 3: Averages' as check_step;
WITH monthly AS (
  SELECT 
    TO_CHAR(transaction_date, 'YYYY-MM') as month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as revenue,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as net_profit
  FROM transactions
  WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
    AND transaction_date IS NOT NULL
  GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
)
SELECT 
  COUNT(*) as months_with_data,
  ROUND(AVG(revenue)::numeric, 2) as avg_monthly_revenue,
  ROUND(AVG(expenses)::numeric, 2) as avg_monthly_expenses,
  ROUND(AVG(net_profit)::numeric, 2) as avg_monthly_profit
FROM monthly;

-- Find best and worst months
SELECT 'Step 4: Best & Worst Months' as check_step;
WITH monthly AS (
  SELECT 
    TO_CHAR(transaction_date, 'YYYY-MM') as month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as net_profit
  FROM transactions
  WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
    AND transaction_date IS NOT NULL
  GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
)
SELECT 
  'Best Month' as type,
  month,
  net_profit
FROM monthly
ORDER BY net_profit DESC
LIMIT 1;

WITH monthly AS (
  SELECT 
    TO_CHAR(transaction_date, 'YYYY-MM') as month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as net_profit
  FROM transactions
  WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
    AND transaction_date IS NOT NULL
  GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
)
SELECT 
  'Worst Month' as type,
  month,
  net_profit
FROM monthly
ORDER BY net_profit ASC
LIMIT 1;

