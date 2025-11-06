-- =====================================================
-- ROOT CAUSE ANALYSIS - FIND THE BREAK IN THE CHAIN
-- =====================================================
-- This will show us EXACTLY where the problem is

-- STEP 1: Check if asset exists and what org_id it has
SELECT 
  'STEP 1 - Asset check:' as step,
  id,
  name,
  organization_id,
  CASE 
    WHEN organization_id = '39423636-3463-421b-9009-b899f577997c'::uuid THEN '✅ Org matches'
    ELSE '❌ Org mismatch: ' || organization_id::text
  END as org_status
FROM assets
WHERE id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- STEP 2: Check if quotation_items have asset_id
SELECT 
  'STEP 2 - Quotation items with asset_id:' as step,
  COUNT(*) as total_items,
  COUNT(CASE WHEN asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid THEN 1 END) as dell_laptop_items,
  COUNT(CASE WHEN asset_id IS NULL THEN 1 END) as items_without_asset_id
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
WHERE q.organization_id = '39423636-3463-421b-9009-b899f577997c'::uuid;

-- STEP 3: Show ALL quotation_items (to see if asset_id is NULL)
SELECT 
  'STEP 3 - All quotation items (check asset_id):' as step,
  qi.id,
  qi.quotation_id,
  qi.asset_id,
  qi.total,
  qi.description,
  q.quotation_number,
  q.organization_id,
  CASE 
    WHEN qi.asset_id IS NULL THEN '❌ NO ASSET_ID - THIS IS THE PROBLEM!'
    WHEN qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid THEN '✅ Has Dell laptop asset_id'
    ELSE '⚠️ Has different asset_id: ' || qi.asset_id::text
  END as status
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
WHERE q.organization_id = '39423636-3463-421b-9009-b899f577997c'::uuid
ORDER BY q.created_at DESC
LIMIT 20;

-- STEP 4: Check if quotations are linked to invoices
SELECT 
  'STEP 4 - Quotations linked to invoices:' as step,
  q.id as quotation_id,
  q.quotation_number,
  q.converted_to_invoice_id,
  i.id as invoice_id,
  i.invoice_number,
  i.status,
  i.organization_id,
  COUNT(qi.id) as item_count,
  COUNT(CASE WHEN qi.asset_id IS NOT NULL THEN 1 END) as items_with_asset_id
FROM quotations q
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id
LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
WHERE q.organization_id = '39423636-3463-421b-9009-b899f577997c'::uuid
GROUP BY q.id, q.quotation_number, q.converted_to_invoice_id, i.id, i.invoice_number, i.status, i.organization_id
ORDER BY q.created_at DESC
LIMIT 10;

-- STEP 5: Check if transactions exist at all
SELECT 
  'STEP 5 - All transactions in your org:' as step,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN type = 'income' THEN 1 END) as income_transactions,
  COUNT(CASE WHEN asset_id IS NOT NULL THEN 1 END) as transactions_with_asset_id,
  COUNT(CASE WHEN asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid THEN 1 END) as dell_laptop_transactions
FROM transactions
WHERE organization_id = '39423636-3463-421b-9009-b899f577997c'::uuid;

-- STEP 6: Show transactions that SHOULD be linked to Dell laptop
-- (by matching invoice amounts to quotation_item totals)
SELECT 
  'STEP 6 - Transactions that should link to Dell laptop:' as step,
  t.id,
  t.amount,
  t.asset_id,
  t.organization_id,
  t.invoice_id,
  i.invoice_number,
  qi.total as quotation_item_total,
  qi.asset_id as quotation_item_asset_id,
  CASE 
    WHEN qi.asset_id IS NULL THEN '❌ Quotation item has NO asset_id'
    WHEN qi.asset_id != 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid THEN '⚠️ Quotation item has different asset_id'
    WHEN t.asset_id IS NULL THEN '⚠️ Transaction exists but no asset_id'
    WHEN t.asset_id != 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid THEN '⚠️ Transaction has different asset_id'
    ELSE '✅ Should be linked'
  END as status
FROM transactions t
INNER JOIN invoices i ON i.id = t.invoice_id
LEFT JOIN quotations q ON q.converted_to_invoice_id = i.id
LEFT JOIN quotation_items qi ON qi.quotation_id = q.id AND ABS(qi.total - t.amount) < 0.01
WHERE t.type = 'income'
  AND t.organization_id = '39423636-3463-421b-9009-b899f577997c'::uuid
ORDER BY t.transaction_date DESC
LIMIT 20;
