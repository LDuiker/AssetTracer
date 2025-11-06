-- =====================================================
-- LINK TRANSACTIONS TO ASSETS
-- =====================================================
-- This script finds transactions that should be linked to assets
-- and updates them with the correct asset_id

-- Step 1: Find transactions that should be linked to "Dell laptop"
-- Replace 'e2b90791-fce9-41b1-b3e9-90d0c98b2970' with your actual asset ID
-- Replace '38f5f27c-743c-45bd-bdd2-2714b6990df0' with your organization ID

WITH target_asset AS (
  SELECT 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid as asset_id,
         '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid as organization_id
)
SELECT 
  'Transactions to link:' as info,
  t.id as transaction_id,
  t.amount,
  t.organization_id as current_transaction_org_id,
  i.invoice_number,
  q.quotation_number,
  qi.asset_id as quotation_item_asset_id,
  qi.total as quotation_item_total,
  CASE 
    WHEN qi.asset_id = (SELECT asset_id FROM target_asset) THEN '✅ Match'
    WHEN qi.asset_id IS NOT NULL THEN '⚠️ Different asset'
    ELSE '❌ No asset_id in quotation'
  END as match_status
FROM transactions t
INNER JOIN invoices i ON i.id = t.invoice_id
LEFT JOIN quotations q ON q.converted_to_invoice_id = i.id
LEFT JOIN quotation_items qi ON qi.quotation_id = q.id AND ABS(qi.total - t.amount) < 0.01
WHERE t.type = 'income'
  AND (
    t.organization_id = (SELECT organization_id FROM target_asset)
    OR i.organization_id = (SELECT organization_id FROM target_asset)
  )
ORDER BY t.transaction_date DESC
LIMIT 20;

-- Step 2: Update transactions to link them to the asset via quotation_items
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
  AND ABS(qi.total - t.amount) < 0.01  -- Match by amount (within 1 cent)
  AND (t.asset_id IS NULL OR t.organization_id != COALESCE(a.organization_id, i.organization_id));

-- Step 3: Also fix organization_id for transactions that already have asset_id but wrong org
UPDATE transactions t
SET organization_id = a.organization_id
FROM assets a
WHERE t.asset_id = a.id
  AND t.organization_id != a.organization_id
  AND t.asset_id IS NOT NULL;

-- Step 4: Verify the fix for "Dell laptop"
SELECT 
  'After fix - Dell laptop transactions:' as info,
  COUNT(*) as transaction_count,
  SUM(t.amount) as total_revenue
FROM transactions t
WHERE t.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND t.type = 'income'
  AND t.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid;

-- Step 5: Show all transactions for this asset
SELECT 
  'All transactions for Dell laptop:' as info,
  t.id,
  t.amount,
  t.organization_id,
  t.description,
  i.invoice_number,
  q.quotation_number
FROM transactions t
LEFT JOIN invoices i ON i.id = t.invoice_id
LEFT JOIN quotations q ON q.converted_to_invoice_id = i.id
WHERE t.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND t.type = 'income'
ORDER BY t.transaction_date DESC;

