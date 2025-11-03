-- Check actual transaction data to see what's happening

SELECT '========================================' as separator;
SELECT '🔍 CHECKING TRANSACTION DATA' as title;
SELECT '========================================' as separator;

-- Check 1: Show all transactions with details
SELECT 'ALL TRANSACTIONS:' as info;
SELECT 
  id,
  type,
  category,
  amount,
  date as old_date_column,
  transaction_date as new_date_column,
  currency,
  description,
  asset_id,
  invoice_id,
  created_at
FROM transactions
ORDER BY created_at DESC;

-- Check 2: What columns actually have data?
SELECT 'COLUMN DATA STATUS:' as info;
SELECT 
  COUNT(*) as total_transactions,
  COUNT(date) as has_date_column,
  COUNT(transaction_date) as has_transaction_date_column,
  COUNT(asset_id) as has_asset_id,
  COUNT(currency) as has_currency
FROM transactions;

-- Check 3: Sum by type using OLD column name (date)
SELECT 'USING OLD COLUMN (date):' as info;
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
WHERE date IS NOT NULL
GROUP BY type;

-- Check 4: Sum by type using NEW column name (transaction_date)
SELECT 'USING NEW COLUMN (transaction_date):' as info;
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
WHERE transaction_date IS NOT NULL
GROUP BY type;

-- Check 5: Test the financial summary function directly
SELECT 'TESTING get_financial_summary FUNCTION:' as info;
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

SELECT '========================================' as separator;
SELECT '📊 If profit is still 0, the functions may be using the wrong date column!' as note;
SELECT '========================================' as separator;

