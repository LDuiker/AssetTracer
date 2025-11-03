-- RECREATE TRANSACTIONS: If invoices are paid but no transactions exist
-- This manually creates the missing income transactions

-- Step 1: Check current state
SELECT 'Current transactions:' as info, COUNT(*) as count FROM transactions;
SELECT 'Paid invoices:' as info, COUNT(*) as count FROM invoices WHERE status = 'paid';

-- Step 2: Create transactions for all paid invoices that don't have them
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
  client_id,
  invoice_id,
  notes,
  created_by,
  created_at
)
SELECT 
  i.organization_id,
  'income' as type,
  'sales' as category,
  i.total as amount,
  COALESCE(i.currency, 'USD') as currency,
  COALESCE(i.payment_date, i.issue_date) as transaction_date,
  'Payment for invoice ' || i.invoice_number as description,
  i.invoice_number as reference_number,
  i.payment_method,
  i.client_id,
  i.id as invoice_id,
  'Manually created transaction for paid invoice' as notes,
  i.created_by,
  NOW()
FROM invoices i
WHERE i.status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id
  );

-- Step 3: Verify transactions were created
SELECT 'Transactions after creation:' as info, COUNT(*) as count FROM transactions;

SELECT 'Income transactions:' as info, 
  type, 
  SUM(amount) as total_income,
  COUNT(*) as transaction_count
FROM transactions 
WHERE type = 'income'
GROUP BY type;

SELECT 'All transactions by type:' as info;
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
GROUP BY type;

-- Step 4: Test financial summary
SELECT 'Financial Summary:' as info;
WITH org AS (SELECT id FROM organizations LIMIT 1)
SELECT 
  current_month_revenue,
  current_month_expenses,
  current_month_profit,
  ytd_revenue,
  ytd_expenses,
  ytd_profit
FROM get_financial_summary((SELECT id FROM org));

SELECT '✅ Transactions recreated! Refresh your dashboard!' as result;

