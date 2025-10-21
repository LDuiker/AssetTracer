-- =====================================================
-- Verify Dashboard Analytics Data
-- =====================================================
-- Run this to check if your analytics are calculating correctly
-- and identify any data issues
-- =====================================================

-- =====================================================
-- 1. Check Transactions Table (Source of Truth)
-- =====================================================

SELECT '=== TRANSACTIONS OVERVIEW ===' as section;

SELECT 
  type,
  category,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  currency
FROM transactions
GROUP BY type, category, currency
ORDER BY type, category;

-- =====================================================
-- 2. Check Paid Invoices vs Transactions
-- =====================================================

SELECT '=== PAID INVOICES ===' as section;

-- Show all paid invoices and whether they have transactions
SELECT 
  i.invoice_number,
  i.payment_date,
  i.total as invoice_total,
  i.currency,
  c.name as client_name,
  COALESCE(t.transaction_count, 0) as transaction_count,
  COALESCE(t.total_transaction_amount, 0) as transaction_amount,
  CASE 
    WHEN t.transaction_count IS NULL THEN '❌ NO TRANSACTION'
    WHEN t.total_transaction_amount != i.total THEN '⚠️ AMOUNT MISMATCH'
    ELSE '✅ OK'
  END as status
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN (
  SELECT 
    invoice_id,
    COUNT(*) as transaction_count,
    SUM(amount) as total_transaction_amount
  FROM transactions
  WHERE type = 'income'
  GROUP BY invoice_id
) t ON i.id = t.invoice_id
WHERE i.status = 'paid'
ORDER BY i.payment_date DESC;

-- =====================================================
-- 3. Check Asset Revenue Tracking
-- =====================================================

SELECT '=== ASSET REVENUE TRACKING ===' as section;

-- Show assets with their revenue from transactions
SELECT 
  a.name as asset_name,
  a.purchase_cost,
  COALESCE(expenses.total_expenses, 0) as total_expenses,
  COALESCE(a.purchase_cost, 0) + COALESCE(expenses.total_expenses, 0) as total_spend,
  COALESCE(revenue.total_revenue, 0) as total_revenue,
  COALESCE(revenue.total_revenue, 0) - (COALESCE(a.purchase_cost, 0) + COALESCE(expenses.total_expenses, 0)) as profit_loss,
  CASE 
    WHEN (COALESCE(a.purchase_cost, 0) + COALESCE(expenses.total_expenses, 0)) > 0 
    THEN ROUND(
      ((COALESCE(revenue.total_revenue, 0) - (COALESCE(a.purchase_cost, 0) + COALESCE(expenses.total_expenses, 0))) 
      / (COALESCE(a.purchase_cost, 0) + COALESCE(expenses.total_expenses, 0)) * 100)::numeric, 
      2
    )
    ELSE 0
  END as roi_percentage,
  COALESCE(revenue.transaction_count, 0) as revenue_transactions,
  CASE 
    WHEN revenue.total_revenue IS NULL OR revenue.total_revenue = 0 THEN '⚠️ NO REVENUE'
    ELSE '✅ HAS REVENUE'
  END as status
FROM assets a
LEFT JOIN (
  SELECT asset_id, SUM(amount) as total_expenses
  FROM transactions
  WHERE type = 'expense' AND asset_id IS NOT NULL
  GROUP BY asset_id
) expenses ON a.id = expenses.asset_id
LEFT JOIN (
  SELECT asset_id, SUM(amount) as total_revenue, COUNT(*) as transaction_count
  FROM transactions
  WHERE type = 'income' AND asset_id IS NOT NULL
  GROUP BY asset_id
) revenue ON a.id = revenue.asset_id
ORDER BY profit_loss DESC;

-- =====================================================
-- 4. Check Monthly Revenue vs Expenses
-- =====================================================

SELECT '=== MONTHLY BREAKDOWN ===' as section;

WITH monthly_data AS (
  SELECT 
    TO_CHAR(transaction_date, 'YYYY-MM') as month,
    DATE_TRUNC('month', transaction_date)::date as month_start,
    type,
    SUM(amount) as total
  FROM transactions
  GROUP BY TO_CHAR(transaction_date, 'YYYY-MM'), DATE_TRUNC('month', transaction_date), type
)
SELECT 
  month,
  month_start,
  COALESCE(income.total, 0) as revenue,
  COALESCE(expense.total, 0) as expenses,
  COALESCE(income.total, 0) - COALESCE(expense.total, 0) as net_profit
FROM (
  SELECT DISTINCT month, month_start FROM monthly_data
) months
LEFT JOIN (
  SELECT month, total FROM monthly_data WHERE type = 'income'
) income USING (month)
LEFT JOIN (
  SELECT month, total FROM monthly_data WHERE type = 'expense'
) expense USING (month)
ORDER BY month DESC;

-- =====================================================
-- 5. Check for Data Issues
-- =====================================================

SELECT '=== DATA ISSUES REPORT ===' as section;

-- Issue 1: Paid invoices without transactions
SELECT 
  COUNT(*) as paid_invoices_without_transactions,
  COALESCE(SUM(total), 0) as missing_revenue
FROM invoices i
WHERE i.status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id AND t.type = 'income'
  );

-- Issue 2: Quotation items with asset_id (these should create asset-linked revenue)
SELECT 
  COUNT(DISTINCT qi.quotation_id) as quotations_with_assets,
  COUNT(qi.id) as items_with_assets,
  SUM(qi.total) as potential_asset_revenue
FROM quotation_items qi
WHERE qi.asset_id IS NOT NULL;

-- Issue 3: Invoices converted from quotations
SELECT 
  COUNT(*) as invoices_from_quotations,
  COUNT(CASE WHEN i.status = 'paid' THEN 1 END) as paid_invoices_from_quotations,
  SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) as total_paid_from_quotations
FROM invoices i
JOIN quotations q ON q.converted_to_invoice_id = i.id;

-- =====================================================
-- 6. Test Dashboard Functions
-- =====================================================

SELECT '=== TESTING DASHBOARD FUNCTIONS ===' as section;

-- Test get_asset_financials
SELECT 
  asset_name,
  total_revenue,
  total_spend,
  profit_loss,
  roi_percentage
FROM get_asset_financials(
  (SELECT organization_id FROM users LIMIT 1)
)
ORDER BY profit_loss DESC
LIMIT 5;

-- Test get_financial_summary
SELECT * FROM get_financial_summary(
  (SELECT organization_id FROM users LIMIT 1)
);

-- =====================================================
-- 7. Specific Check: Parrot Projector
-- =====================================================

SELECT '=== PARROT PROJECTOR ANALYSIS ===' as section;

-- Find the Parrot Projector asset
SELECT 
  a.id as asset_id,
  a.name,
  a.purchase_cost,
  -- Revenue from transactions
  (SELECT COALESCE(SUM(amount), 0) 
   FROM transactions 
   WHERE asset_id = a.id AND type = 'income') as revenue_from_transactions,
  -- Expenses from transactions
  (SELECT COALESCE(SUM(amount), 0) 
   FROM transactions 
   WHERE asset_id = a.id AND type = 'expense') as expenses_from_transactions,
  -- Related quotations
  (SELECT COUNT(*) 
   FROM quotation_items qi 
   WHERE qi.asset_id = a.id) as quotation_items_count,
  -- Related invoices (via quotations)
  (SELECT COUNT(DISTINCT i.id)
   FROM quotation_items qi
   JOIN quotations q ON qi.quotation_id = q.id
   JOIN invoices i ON q.converted_to_invoice_id = i.id
   WHERE qi.asset_id = a.id AND i.status = 'paid') as paid_invoices_count
FROM assets a
WHERE LOWER(a.name) LIKE '%parrot%'
   OR LOWER(a.name) LIKE '%projector%';

-- =====================================================
-- 8. Summary Report
-- =====================================================

SELECT '=== SUMMARY REPORT ===' as section;

WITH summary AS (
  SELECT 
    COUNT(*) as total_assets,
    (SELECT COUNT(*) FROM transactions WHERE type = 'income') as income_transactions,
    (SELECT COUNT(*) FROM transactions WHERE type = 'expense') as expense_transactions,
    (SELECT COUNT(*) FROM invoices WHERE status = 'paid') as paid_invoices,
    (SELECT COUNT(*) FROM invoices WHERE status = 'paid' 
     AND EXISTS (SELECT 1 FROM transactions WHERE invoice_id = invoices.id)) as paid_invoices_with_transactions,
    (SELECT SUM(amount) FROM transactions WHERE type = 'income') as total_revenue,
    (SELECT SUM(amount) FROM transactions WHERE type = 'expense') as total_expenses
  FROM assets
)
SELECT 
  total_assets,
  income_transactions,
  expense_transactions,
  paid_invoices,
  paid_invoices_with_transactions,
  (paid_invoices - paid_invoices_with_transactions) as paid_invoices_missing_transactions,
  ROUND(total_revenue::numeric, 2) as total_revenue,
  ROUND(total_expenses::numeric, 2) as total_expenses,
  ROUND((total_revenue - total_expenses)::numeric, 2) as net_profit,
  CASE 
    WHEN paid_invoices = paid_invoices_with_transactions THEN '✅ ALL GOOD'
    ELSE '⚠️ MISSING TRANSACTIONS'
  END as data_quality_status
FROM summary;

-- =====================================================
-- Instructions
-- =====================================================

/*
HOW TO READ RESULTS:

1. TRANSACTIONS OVERVIEW
   - Shows all transaction types and totals
   - Verify income and expense transactions exist

2. PAID INVOICES
   - Each paid invoice should have status ✅ OK
   - ❌ NO TRANSACTION means revenue is missing
   - ⚠️ AMOUNT MISMATCH means partial payment recorded

3. ASSET REVENUE TRACKING
   - Shows revenue per asset
   - ⚠️ NO REVENUE means asset has no income transactions
   - Check if these assets are linked to paid invoices

4. MONTHLY BREAKDOWN
   - Verify monthly totals match your expectations
   - Check if recent months include paid invoices

5. DATA ISSUES REPORT
   - Shows count of paid invoices without transactions
   - Shows missing revenue amount
   - If > 0, run the backfill script

6. PARROT PROJECTOR ANALYSIS
   - Specific check for the asset you mentioned
   - Shows if it has revenue transactions
   - Shows related invoices

7. SUMMARY REPORT
   - Overall health check
   - ✅ ALL GOOD = everything is tracked correctly
   - ⚠️ MISSING TRANSACTIONS = run backfill script

NEXT STEPS:
- If you see missing transactions, run BACKFILL-INVOICE-TRANSACTIONS.sql
- If data looks correct, dashboard analytics are accurate!
*/

