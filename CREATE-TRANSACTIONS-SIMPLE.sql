-- =====================================================
-- SIMPLE FIX: Create transactions directly
-- =====================================================

-- Step 1: Show what we're working with
SELECT 
  'Paid invoices:' as info,
  i.id,
  i.invoice_number,
  i.status,
  i.total,
  i.organization_id,
  q.id as quotation_id,
  COUNT(qi.id) as quotation_item_count
FROM invoices i
LEFT JOIN quotations q ON q.converted_to_invoice_id = i.id
LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
WHERE i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
  AND i.status = 'paid'
GROUP BY i.id, i.invoice_number, i.status, i.total, i.organization_id, q.id
ORDER BY i.payment_date DESC NULLS LAST
LIMIT 10;

-- Step 2: Show quotation_items for Dell laptop
SELECT 
  'Quotation items for Dell laptop:' as info,
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
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
ORDER BY q.created_at DESC;

-- Step 3: Check if transactions already exist for these invoices
SELECT 
  'Existing transactions:' as info,
  t.id,
  t.amount,
  t.asset_id,
  t.organization_id,
  t.invoice_id,
  i.invoice_number
FROM transactions t
INNER JOIN invoices i ON i.id = t.invoice_id
WHERE i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
  AND t.type = 'income'
ORDER BY t.transaction_date DESC;

-- Step 4: CREATE transactions for quotation_items with Dell laptop asset_id
-- This creates one transaction per quotation_item
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
SELECT DISTINCT ON (i.id, qi.id)
  i.organization_id,
  'income' as type,
  'invoice_payment' as category,
  qi.total as amount,
  COALESCE(i.currency, 'USD') as currency,
  COALESCE(i.payment_date, i.issue_date, CURRENT_DATE) as transaction_date,
  'Payment for invoice ' || i.invoice_number || ': ' || COALESCE(qi.description, 'Item') as description,
  i.invoice_number as reference_number,
  COALESCE(i.payment_method, 'unspecified') as payment_method,
  qi.asset_id,
  i.client_id,
  i.id as invoice_id,
  'Created from paid invoice via quotation item' as notes,
  i.created_by,
  NOW()
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
INNER JOIN invoices i ON i.id = q.converted_to_invoice_id
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
  AND i.status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id 
      AND t.asset_id = qi.asset_id
      AND ABS(t.amount - qi.total) < 0.01
  )
ON CONFLICT DO NOTHING;

-- Step 5: Verify transactions were created
SELECT 
  'Final check - Dell laptop transactions:' as info,
  COUNT(*) as transaction_count,
  SUM(t.amount) as total_revenue,
  STRING_AGG(t.id::text, ', ') as transaction_ids
FROM transactions t
WHERE t.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND t.type = 'income'
  AND t.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid;

-- Step 6: Show the created transactions
SELECT 
  'Created transactions details:' as info,
  t.id,
  t.amount,
  t.asset_id,
  t.organization_id,
  t.description,
  i.invoice_number,
  a.name as asset_name
FROM transactions t
LEFT JOIN invoices i ON i.id = t.invoice_id
LEFT JOIN assets a ON a.id = t.asset_id
WHERE t.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND t.type = 'income'
  AND t.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
ORDER BY t.transaction_date DESC;

