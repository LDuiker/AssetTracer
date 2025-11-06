-- =====================================================
-- SIMPLE CHECK: Do transactions exist at all?
-- =====================================================

-- Check 1: Do ANY transactions exist for this organization?
SELECT 
  'Check 1 - Total transactions for org:' as check_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
  COUNT(CASE WHEN asset_id IS NOT NULL THEN 1 END) as with_asset_id
FROM transactions
WHERE organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid;

-- Check 2: Do transactions exist but with different organization_id?
SELECT 
  'Check 2 - Transactions with any org (for invoices in your org):' as check_name,
  t.id,
  t.amount,
  t.organization_id as transaction_org_id,
  t.asset_id,
  i.invoice_number,
  i.organization_id as invoice_org_id,
  i.status
FROM transactions t
INNER JOIN invoices i ON i.id = t.invoice_id
WHERE t.type = 'income'
  AND i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
ORDER BY t.transaction_date DESC
LIMIT 10;

-- Check 3: Do paid invoices exist without transactions?
SELECT 
  'Check 3 - Paid invoices without transactions:' as check_name,
  i.id,
  i.invoice_number,
  i.status,
  i.total,
  i.payment_date,
  q.id as quotation_id,
  q.quotation_number
FROM invoices i
LEFT JOIN transactions t ON t.invoice_id = i.id AND t.type = 'income'
LEFT JOIN quotations q ON q.converted_to_invoice_id = i.id
WHERE i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
  AND i.status = 'paid'
  AND t.id IS NULL
ORDER BY i.payment_date DESC
LIMIT 10;

-- Check 4: Do quotation_items exist for Dell laptop?
SELECT 
  'Check 4 - Quotation items for Dell laptop:' as check_name,
  qi.id,
  qi.quotation_id,
  qi.asset_id,
  qi.total,
  q.quotation_number,
  q.converted_to_invoice_id,
  i.invoice_number,
  i.status as invoice_status
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
ORDER BY q.created_at DESC;

-- Check 5: If transactions don't exist, CREATE them from paid invoices
-- This will create transactions for paid invoices that don't have them
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
  i.organization_id,
  'income' as type,
  'invoice_payment' as category,
  qi.total as amount,
  COALESCE(i.currency, 'USD') as currency,
  COALESCE(i.payment_date, i.issue_date) as transaction_date,
  'Payment for invoice ' || i.invoice_number || ': ' || qi.description as description,
  i.invoice_number as reference_number,
  COALESCE(i.payment_method, 'unspecified') as payment_method,
  qi.asset_id,  -- Link to asset from quotation_items
  i.client_id,
  i.id as invoice_id,
  'Created from paid invoice via quotation' as notes,
  i.created_by,
  NOW()
FROM invoices i
INNER JOIN quotations q ON q.converted_to_invoice_id = i.id
INNER JOIN quotation_items qi ON qi.quotation_id = q.id
WHERE i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
  AND i.status = 'paid'
  AND qi.asset_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id 
      AND t.type = 'income'
      AND ABS(t.amount - qi.total) < 0.01
  );

-- Check 6: Verify transactions were created
SELECT 
  'Check 6 - After creating transactions:' as check_name,
  COUNT(*) as transaction_count,
  SUM(t.amount) as total_revenue
FROM transactions t
WHERE t.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND t.type = 'income'
  AND t.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid;

