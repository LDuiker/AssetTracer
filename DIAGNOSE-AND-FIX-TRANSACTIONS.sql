-- =====================================================
-- COMPREHENSIVE DIAGNOSTIC AND FIX
-- =====================================================
-- This will find ALL transactions and link them properly

-- Step 1: Find ALL income transactions for this organization
SELECT 
  'Step 1 - All income transactions:' as step,
  t.id,
  t.amount,
  t.asset_id,
  t.organization_id,
  t.invoice_id,
  t.description,
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

-- Step 2: Check if these invoices have quotations
SELECT 
  'Step 2 - Invoices with quotations:' as step,
  i.id as invoice_id,
  i.invoice_number,
  q.id as quotation_id,
  q.quotation_number,
  COUNT(qi.id) as item_count,
  COUNT(CASE WHEN qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid THEN 1 END) as dell_laptop_items
FROM transactions t
INNER JOIN invoices i ON i.id = t.invoice_id
LEFT JOIN quotations q ON q.converted_to_invoice_id = i.id
LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
WHERE t.type = 'income'
  AND (
    t.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
    OR i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
  )
GROUP BY i.id, i.invoice_number, q.id, q.quotation_number;

-- Step 3: Find quotation_items for Dell laptop
SELECT 
  'Step 3 - Quotation items for Dell laptop:' as step,
  qi.id,
  qi.quotation_id,
  qi.asset_id,
  qi.total,
  q.quotation_number,
  q.converted_to_invoice_id,
  i.invoice_number,
  i.status as invoice_status,
  t.id as transaction_id,
  t.amount as transaction_amount,
  CASE 
    WHEN t.id IS NULL THEN '❌ No transaction exists'
    WHEN t.asset_id IS NULL THEN '⚠️ Transaction exists but no asset_id'
    WHEN t.asset_id != qi.asset_id THEN '⚠️ Transaction has different asset_id'
    ELSE '✅ Transaction linked correctly'
  END as status
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id
LEFT JOIN transactions t ON t.invoice_id = i.id 
  AND t.type = 'income' 
  AND ABS(t.amount - qi.total) < 0.01
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
ORDER BY q.created_at DESC;

-- Step 4: Link transactions to assets (run this after reviewing steps 1-3)
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
  AND ABS(qi.total - t.amount) < 0.01;

-- Step 5: Verify the fix
SELECT 
  'Step 5 - After fix:' as step,
  COUNT(*) as transaction_count,
  SUM(t.amount) as total_revenue
FROM transactions t
WHERE t.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND t.type = 'income'
  AND t.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid;

