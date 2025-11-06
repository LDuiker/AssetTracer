-- =====================================================
-- FIND AND LINK TRANSACTIONS - COMPREHENSIVE APPROACH
-- =====================================================

-- Step 1: Find ALL income transactions for this organization
SELECT 
  'All income transactions:' as info,
  t.id,
  t.amount,
  t.asset_id,
  t.organization_id,
  t.invoice_id,
  t.description,
  i.invoice_number,
  i.organization_id as invoice_org_id
FROM transactions t
LEFT JOIN invoices i ON i.id = t.invoice_id
WHERE t.type = 'income'
  AND (
    t.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
    OR i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
  )
ORDER BY t.transaction_date DESC
LIMIT 20;

-- Step 2: Check if quotations exist for these invoices
SELECT 
  'Invoices with quotations:' as info,
  i.id as invoice_id,
  i.invoice_number,
  q.id as quotation_id,
  q.quotation_number,
  COUNT(qi.id) as quotation_item_count,
  COUNT(CASE WHEN qi.asset_id IS NOT NULL THEN 1 END) as items_with_asset_id
FROM transactions t
INNER JOIN invoices i ON i.id = t.invoice_id
LEFT JOIN quotations q ON q.converted_to_invoice_id = i.id
LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
WHERE t.type = 'income'
  AND (
    t.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
    OR i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
  )
GROUP BY i.id, i.invoice_number, q.id, q.quotation_number
LIMIT 10;

-- Step 3: Check quotation_items for "Dell laptop" asset
SELECT 
  'Quotation items for Dell laptop:' as info,
  qi.id,
  qi.quotation_id,
  qi.asset_id,
  qi.total,
  q.quotation_number,
  q.converted_to_invoice_id,
  i.invoice_number,
  t.id as transaction_id,
  t.amount as transaction_amount
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id
LEFT JOIN transactions t ON t.invoice_id = i.id AND t.type = 'income' AND ABS(t.amount - qi.total) < 0.01
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
ORDER BY q.created_at DESC;

-- Step 4: If transactions exist but aren't linked, link them manually
-- This will link transactions to assets based on quotation_items
UPDATE transactions t
SET asset_id = qi.asset_id,
    organization_id = COALESCE(a.organization_id, i.organization_id, t.organization_id)
FROM invoices i
INNER JOIN quotations q ON q.converted_to_invoice_id = i.id
INNER JOIN quotation_items qi ON qi.quotation_id = q.id
LEFT JOIN assets a ON a.id = qi.asset_id
WHERE t.invoice_id = i.id
  AND t.type = 'income'
  AND qi.asset_id IS NOT NULL
  AND ABS(qi.total - t.amount) < 0.01
  AND (t.asset_id IS NULL OR t.asset_id != qi.asset_id);

-- Step 5: Verify after update
SELECT 
  'After update - Dell laptop transactions:' as info,
  COUNT(*) as transaction_count,
  SUM(t.amount) as total_revenue
FROM transactions t
WHERE t.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND t.type = 'income'
  AND t.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid;

-- Step 6: Show the linked transactions
SELECT 
  'Linked transactions:' as info,
  t.id,
  t.amount,
  t.asset_id,
  a.name as asset_name,
  t.organization_id,
  t.description,
  i.invoice_number
FROM transactions t
LEFT JOIN assets a ON a.id = t.asset_id
LEFT JOIN invoices i ON i.id = t.invoice_id
WHERE t.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND t.type = 'income'
ORDER BY t.transaction_date DESC;

