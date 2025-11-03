-- FIX: Sync transaction dates
-- If transactions were created BEFORE adding transaction_date column,
-- the old 'date' column has data but 'transaction_date' is NULL

-- Update all existing transactions to sync date → transaction_date
UPDATE transactions 
SET transaction_date = date 
WHERE transaction_date IS NULL AND date IS NOT NULL;

-- Verify the sync
SELECT 
  'Before sync:' as status,
  COUNT(*) as total_transactions,
  COUNT(date) as has_date,
  COUNT(transaction_date) as has_transaction_date
FROM transactions;

-- Show results
SELECT 
  'After sync - Income transactions:' as type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM transactions
WHERE type = 'income' AND transaction_date IS NOT NULL;

SELECT 
  'After sync - Expense transactions:' as type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM transactions
WHERE type = 'expense' AND transaction_date IS NOT NULL;

-- Test financial summary again
SELECT 'Testing financial summary:' as info;
SELECT 
  current_month_revenue,
  current_month_expenses,
  current_month_profit,
  ytd_revenue,
  ytd_expenses,
  ytd_profit
FROM get_financial_summary(
  (SELECT id FROM organizations LIMIT 1)
);

SELECT '✅ Transaction dates synced! Refresh your dashboard now!' as result;

