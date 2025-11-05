-- =====================================================
-- BACKFILL ASSET TRANSACTIONS FOR PAID INVOICES
-- =====================================================
-- This script creates transactions with asset_id for existing paid invoices
-- that were created from quotations with asset_id in quotation_items
-- =====================================================

-- Step 1: Check current state
SELECT 'Current transactions:' as info, COUNT(*) as count FROM transactions;
SELECT 'Paid invoices:' as info, COUNT(*) as count FROM invoices WHERE status = 'paid';
SELECT 'Paid invoices without transactions:' as info, 
  COUNT(*) as count 
FROM invoices i
WHERE i.status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id
  );

-- Step 2: Create transactions with asset_id for paid invoices from quotations
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
  'Backfilled transaction for paid invoice from quotation' as notes,
  i.created_by,
  NOW()
FROM invoices i
INNER JOIN quotations q ON q.converted_to_invoice_id = i.id
INNER JOIN quotation_items qi ON qi.quotation_id = q.id
WHERE i.status = 'paid'
  AND qi.asset_id IS NOT NULL  -- Only create transactions for items with asset_id
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id 
      AND t.asset_id = qi.asset_id
      AND t.amount = qi.total
  );

-- Step 3: Create transactions without asset_id for paid invoices that don't have quotation links
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
  'invoice_payment' as category,
  i.total as amount,
  COALESCE(i.currency, 'USD') as currency,
  COALESCE(i.payment_date, i.issue_date) as transaction_date,
  'Payment for invoice ' || i.invoice_number as description,
  i.invoice_number as reference_number,
  COALESCE(i.payment_method, 'unspecified') as payment_method,
  i.client_id,
  i.id as invoice_id,
  'Backfilled transaction for paid invoice' as notes,
  i.created_by,
  NOW()
FROM invoices i
WHERE i.status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM quotations q WHERE q.converted_to_invoice_id = i.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id
  );

-- Step 4: Verify transactions were created
SELECT 'Transactions after backfill:' as info, COUNT(*) as count FROM transactions;
SELECT 'Income transactions with asset_id:' as info, 
  COUNT(*) as count,
  SUM(amount) as total_revenue
FROM transactions 
WHERE type = 'income' 
  AND asset_id IS NOT NULL;

-- Step 5: Check transactions per asset
SELECT 
  a.name as asset_name,
  a.id as asset_id,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_revenue
FROM assets a
LEFT JOIN transactions t ON t.asset_id = a.id AND t.type = 'income'
GROUP BY a.id, a.name
ORDER BY total_revenue DESC NULLS LAST;

-- Step 6: Test specific asset
-- Replace 'YOUR-ASSET-ID-HERE' with an actual asset ID
SELECT 
  'Asset Transactions:' as info,
  t.id,
  t.amount,
  t.description,
  t.transaction_date,
  i.invoice_number
FROM transactions t
LEFT JOIN invoices i ON i.id = t.invoice_id
WHERE t.asset_id = 'YOUR-ASSET-ID-HERE'  -- Replace with actual asset ID
  AND t.type = 'income'
ORDER BY t.transaction_date DESC;

