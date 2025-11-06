-- =====================================================
-- COMPREHENSIVE FIX - NO TRANSACTIONS EXIST
-- =====================================================
-- Since there are 0 transactions, we need to create them from scratch
-- Organization ID: 39423636-3463-421b-9009-b899f577997c
-- Dell Laptop Asset ID: e2b90791-fce9-41b1-b3e9-90d0c98b2970
-- =====================================================

-- CHECK 1: What organization_id do paid invoices actually have?
SELECT 
  'CHECK 1 - Paid invoices and their org_ids:' as check_name,
  i.id,
  i.invoice_number,
  i.status,
  i.total,
  i.organization_id,
  q.id as quotation_id,
  q.quotation_number,
  q.organization_id as quotation_org_id
FROM invoices i
LEFT JOIN quotations q ON q.converted_to_invoice_id = i.id
WHERE i.status = 'paid'
ORDER BY i.payment_date DESC NULLS LAST
LIMIT 10;

-- CHECK 2: What organization_id do quotations have?
SELECT 
  'CHECK 2 - Quotations and their org_ids:' as check_name,
  q.id,
  q.quotation_number,
  q.organization_id,
  q.converted_to_invoice_id,
  COUNT(qi.id) as item_count,
  COUNT(CASE WHEN qi.asset_id IS NOT NULL THEN 1 END) as items_with_asset_id
FROM quotations q
LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
GROUP BY q.id, q.quotation_number, q.organization_id, q.converted_to_invoice_id
ORDER BY q.created_at DESC
LIMIT 10;

-- CHECK 3: Find quotation_items for Dell laptop (any organization)
SELECT 
  'CHECK 3 - Quotation items for Dell laptop (any org):' as check_name,
  qi.id,
  qi.quotation_id,
  qi.asset_id,
  qi.total,
  q.quotation_number,
  q.organization_id as quotation_org_id,
  q.converted_to_invoice_id,
  i.id as invoice_id,
  i.invoice_number,
  i.status,
  i.organization_id as invoice_org_id
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- CHECK 4: Check if transactions exist in OTHER organizations
SELECT 
  'CHECK 4 - Transactions in other orgs (for these invoices):' as check_name,
  t.id,
  t.amount,
  t.asset_id,
  t.organization_id,
  t.invoice_id,
  i.invoice_number,
  i.organization_id as invoice_org_id
FROM transactions t
INNER JOIN invoices i ON i.id = t.invoice_id
WHERE t.type = 'income'
  AND i.status = 'paid'
ORDER BY t.transaction_date DESC
LIMIT 20;

-- FIX: Create transactions directly from quotation_items
-- This will work regardless of organization_id mismatches
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
SELECT DISTINCT
  COALESCE(i.organization_id, q.organization_id, '39423636-3463-421b-9009-b899f577997c'::uuid) as organization_id,
  'income' as type,
  'invoice_payment' as category,
  qi.total as amount,
  COALESCE(i.currency, q.currency, 'USD') as currency,
  COALESCE(i.payment_date, i.issue_date, q.issue_date, CURRENT_DATE) as transaction_date,
  'Payment for ' || COALESCE(i.invoice_number, 'quotation ' || q.quotation_number) || ': ' || COALESCE(qi.description, 'Item') as description,
  COALESCE(i.invoice_number, q.quotation_number) as reference_number,
  COALESCE(i.payment_method, 'unspecified') as payment_method,
  qi.asset_id,
  COALESCE(i.client_id, q.client_id),
  i.id as invoice_id,
  'Manually created from quotation item' as notes,
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

-- VERIFY: Check if transactions were created
SELECT 
  'VERIFY - Transactions created:' as check_name,
  COUNT(*) as transaction_count,
  SUM(amount) as total_revenue
FROM transactions
WHERE asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND type = 'income'
  AND organization_id = '39423636-3463-421b-9009-b899f577997c'::uuid;

-- If still 0, try creating with ANY organization_id that matches the asset
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
SELECT DISTINCT
  a.organization_id,  -- Use asset's organization_id
  'income' as type,
  'invoice_payment' as category,
  qi.total as amount,
  COALESCE(i.currency, q.currency, 'USD') as currency,
  COALESCE(i.payment_date, i.issue_date, q.issue_date, CURRENT_DATE) as transaction_date,
  'Payment for ' || COALESCE(i.invoice_number, 'quotation ' || q.quotation_number) || ': ' || COALESCE(qi.description, 'Item') as description,
  COALESCE(i.invoice_number, q.quotation_number) as reference_number,
  COALESCE(i.payment_method, 'unspecified') as payment_method,
  qi.asset_id,
  COALESCE(i.client_id, q.client_id),
  i.id as invoice_id,
  'Created using asset organization_id' as notes,
  COALESCE(i.created_by, q.created_by),
  NOW()
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
INNER JOIN assets a ON a.id = qi.asset_id
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.asset_id = qi.asset_id
      AND t.organization_id = a.organization_id
      AND ABS(t.amount - qi.total) < 0.01
  );

-- FINAL VERIFY
SELECT 
  'FINAL VERIFY - Dell laptop transactions:' as check_name,
  COUNT(*) as transaction_count,
  SUM(amount) as total_revenue,
  STRING_AGG(id::text, ', ') as transaction_ids
FROM transactions
WHERE asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND type = 'income';

