-- =====================================================
-- FIND AND FIX EXISTING TRANSACTIONS
-- =====================================================
-- Since you saw "Dell laptop,2,1050.00" earlier, transactions exist somewhere
-- Let's find them and link them properly

-- Step 1: Find ALL transactions that might be for Dell laptop
-- (by checking invoice descriptions, amounts, etc.)
SELECT 
  'Step 1 - All income transactions in your org:' as step,
  t.id,
  t.amount,
  t.asset_id,
  t.organization_id,
  t.description,
  t.invoice_id,
  i.invoice_number,
  i.status as invoice_status
FROM transactions t
LEFT JOIN invoices i ON i.id = t.invoice_id
WHERE t.type = 'income'
  AND (
    t.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
    OR i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
  )
ORDER BY t.transaction_date DESC;

-- Step 2: Find transactions with amount matching Dell laptop quotation items
SELECT 
  'Step 2 - Transactions matching Dell laptop amounts:' as step,
  t.id,
  t.amount,
  t.asset_id,
  t.organization_id,
  t.description,
  qi.total as quotation_item_total,
  qi.asset_id as quotation_item_asset_id,
  q.quotation_number,
  i.invoice_number
FROM transactions t
INNER JOIN invoices i ON i.id = t.invoice_id
LEFT JOIN quotations q ON q.converted_to_invoice_id = i.id
LEFT JOIN quotation_items qi ON qi.quotation_id = q.id AND ABS(qi.total - t.amount) < 0.01
WHERE t.type = 'income'
  AND (
    t.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
    OR i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
  )
  AND qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
ORDER BY t.transaction_date DESC;

-- Step 3: Update transactions to link them to Dell laptop
UPDATE transactions t
SET asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid,
    organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
FROM invoices i
INNER JOIN quotations q ON q.converted_to_invoice_id = i.id
INNER JOIN quotation_items qi ON qi.quotation_id = q.id
WHERE t.invoice_id = i.id
  AND t.type = 'income'
  AND qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND ABS(qi.total - t.amount) < 0.01
  AND (
    t.asset_id IS NULL 
    OR t.asset_id != 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
    OR t.organization_id != '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
  );

-- Step 4: If still no transactions, create them manually
-- First check what quotation_items exist
SELECT 
  'Step 4a - Quotation items for Dell laptop:' as step,
  qi.id,
  qi.quotation_id,
  qi.asset_id,
  qi.total,
  q.quotation_number,
  q.converted_to_invoice_id,
  i.id as invoice_id,
  i.invoice_number,
  i.status,
  i.organization_id
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- Step 4b: Create transactions for each quotation_item
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
  client_id,
  invoice_id,
  notes,
  created_by,
  created_at
)
SELECT 
  COALESCE(i.organization_id, '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid),
  'income' as type,
  'invoice_payment' as category,
  qi.total as amount,
  COALESCE(i.currency, q.currency, 'USD') as currency,
  COALESCE(i.payment_date, i.issue_date, q.issue_date, CURRENT_DATE) as transaction_date,
  'Payment for invoice ' || COALESCE(i.invoice_number, q.quotation_number) || ': ' || COALESCE(qi.description, 'Item') as description,
  COALESCE(i.invoice_number, q.quotation_number) as reference_number,
  COALESCE(i.payment_method, 'unspecified') as payment_method,
  qi.asset_id,
  COALESCE(i.client_id, q.client_id),
  i.id as invoice_id,
  'Created from quotation item' as notes,
  COALESCE(i.created_by, q.created_by),
  NOW()
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.asset_id = qi.asset_id
      AND ABS(t.amount - qi.total) < 0.01
      AND (
        (t.invoice_id = i.id AND i.id IS NOT NULL)
        OR (t.reference_number = q.quotation_number AND i.id IS NULL)
      )
  );

-- Step 5: Final verification
SELECT 
  'Step 5 - Final check:' as step,
  COUNT(*) as transaction_count,
  SUM(amount) as total_revenue
FROM transactions
WHERE asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND type = 'income'
  AND organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid;

