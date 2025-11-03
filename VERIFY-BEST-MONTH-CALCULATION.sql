-- =====================================================
-- Verify Best Performing Month Calculation
-- =====================================================
-- Run this script in Supabase SQL Editor to verify
-- that the "Best Performing Month" calculation is accurate
-- =====================================================

-- STEP 1: Get your organization ID
-- (Replace this with your actual org ID)
-- You can find it by running: SELECT id FROM organizations WHERE name LIKE '%your company%';

-- STEP 2: Check Monthly P&L Data
-- This shows all months with revenue, expenses, and net profit
SELECT 
    month,
    total_revenue,
    total_expenses,
    net_profit,
    revenue_count,
    expense_count
FROM get_monthly_pl(
    (SELECT organization_id FROM users LIMIT 1),  -- Gets first user's org
    '2024-01-01',  -- Start date
    '2024-12-31'   -- End date
)
ORDER BY net_profit DESC;  -- Sorted by net profit (best to worst)

-- STEP 3: Verify the calculation manually
-- This should match the top result from Step 2
WITH monthly_data AS (
    SELECT 
        TO_CHAR(transaction_date, 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        (SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)) as net_profit
    FROM transactions
    WHERE organization_id = (SELECT organization_id FROM users LIMIT 1)
        AND transaction_date >= '2024-01-01'
        AND transaction_date <= '2024-12-31'
    GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
)
SELECT 
    month,
    total_revenue,
    total_expenses,
    net_profit,
    RANK() OVER (ORDER BY net_profit DESC) as rank
FROM monthly_data
ORDER BY net_profit DESC;

-- STEP 4: Show transactions for the best month
-- This helps verify the individual transactions are correct
WITH best_month_data AS (
    SELECT 
        TO_CHAR(transaction_date, 'YYYY-MM') as month,
        (SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)) as net_profit
    FROM transactions
    WHERE organization_id = (SELECT organization_id FROM users LIMIT 1)
        AND transaction_date >= '2024-01-01'
        AND transaction_date <= '2024-12-31'
    GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
    ORDER BY net_profit DESC
    LIMIT 1
)
SELECT 
    t.transaction_date,
    t.type,
    t.category,
    t.amount,
    t.description,
    COALESCE(e.name, 'N/A') as expense_name,
    COALESCE(i.invoice_number, 'N/A') as invoice_number
FROM transactions t
LEFT JOIN expenses e ON t.expense_id = e.id
LEFT JOIN invoices i ON t.invoice_id = i.id
WHERE t.organization_id = (SELECT organization_id FROM users LIMIT 1)
    AND TO_CHAR(t.transaction_date, 'YYYY-MM') = (SELECT month FROM best_month_data)
ORDER BY t.transaction_date, t.type DESC;

-- STEP 5: Summary Check
-- This gives you a quick overview to verify everything matches
SELECT 
    'Best Month Check' as check_type,
    (SELECT month FROM get_monthly_pl(
        (SELECT organization_id FROM users LIMIT 1),
        '2024-01-01',
        '2024-12-31'
    ) ORDER BY net_profit DESC LIMIT 1) as best_month,
    (SELECT net_profit FROM get_monthly_pl(
        (SELECT organization_id FROM users LIMIT 1),
        '2024-01-01',
        '2024-12-31'
    ) ORDER BY net_profit DESC LIMIT 1) as best_month_profit,
    (SELECT total_revenue FROM get_monthly_pl(
        (SELECT organization_id FROM users LIMIT 1),
        '2024-01-01',
        '2024-12-31'
    ) ORDER BY net_profit DESC LIMIT 1) as best_month_revenue,
    (SELECT total_expenses FROM get_monthly_pl(
        (SELECT organization_id FROM users LIMIT 1),
        '2024-01-01',
        '2024-12-31'
    ) ORDER BY net_profit DESC LIMIT 1) as best_month_expenses;

-- =====================================================
-- What to look for:
-- =====================================================
-- 1. Step 2 and Step 3 should show the SAME month at the top
-- 2. Net Profit = Total Revenue - Total Expenses (verify manually)
-- 3. Step 4 shows all transactions - add them up manually to verify
-- 4. Step 5 should match the month shown in your dashboard
-- =====================================================

-- =====================================================
-- Common Issues:
-- =====================================================
-- 1. If net_profit is 0 for all months:
--    - No transactions have been recorded
--    - Transactions exist but transaction_date is NULL
--
-- 2. If revenue/expenses don't match expected:
--    - Check if invoices are marked as "paid" (creates transaction)
--    - Check if expenses have corresponding transactions
--    - Run: SELECT * FROM transactions WHERE organization_id = 'your-org-id';
--
-- 3. If best month is wrong:
--    - Verify the date range (2024-01-01 to 2024-12-31)
--    - Check if you're looking at staging vs production data
-- =====================================================

