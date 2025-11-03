-- FIX: Recreate missing expense transactions
-- When expenses were created, transaction creation failed due to missing columns

-- Step 1: Check current state
SELECT 'Current state:' as info;
SELECT 'Expenses:' as type, COUNT(*) as count FROM expenses
UNION ALL
SELECT 'Expense transactions:' as type, COUNT(*) as count FROM transactions WHERE type = 'expense';

-- Step 2: Create missing expense transactions
INSERT INTO transactions (
  organization_id,
  type,
  category,
  amount,
  currency,
  transaction_date,
  description,
  reference_number,
  payment_method,
  asset_id,
  notes,
  created_by,
  created_at
)
SELECT 
  e.organization_id,
  'expense' as type,
  e.category,
  e.amount,
  COALESCE(e.currency, 'USD') as currency,
  e.expense_date as transaction_date,
  e.description,
  e.reference_number,
  e.payment_method,
  e.asset_id,
  COALESCE(e.notes, 'Auto-created transaction from expense') as notes,
  e.created_by,
  e.created_at
FROM expenses e
WHERE NOT EXISTS (
  -- Check if transaction already exists for this expense
  SELECT 1 FROM transactions t
  WHERE t.description = e.description
    AND t.amount = e.amount
    AND t.type = 'expense'
    AND ABS(EXTRACT(EPOCH FROM (t.created_at - e.created_at))) < 60  -- Within 60 seconds
);

-- Step 3: Verify
SELECT 'After recreation:' as info;
SELECT 'Expenses:' as type, COUNT(*) as count FROM expenses
UNION ALL
SELECT 'Expense transactions:' as type, COUNT(*) as count FROM transactions WHERE type = 'expense';

-- Step 4: Show transaction totals
SELECT 'Transaction totals:' as info;
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
GROUP BY type;

-- Step 5: Calculate net profit
SELECT 'Net Profit Calculation:' as info;
SELECT 
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_profit
FROM transactions;

SELECT '✅ Expense transactions recreated!' as result;
SELECT '🔄 Refresh your dashboard to see updated net profit!' as next_step;

