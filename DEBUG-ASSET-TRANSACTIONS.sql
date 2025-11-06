-- =====================================================
-- DEBUG: Check Asset IDs and Transactions
-- =====================================================
-- Run this to see which assets have transactions and what asset_ids are in transactions

-- Step 1: Find the "Dell laptop" asset ID
SELECT 
  'Dell laptop asset:' as info,
  id as asset_id,
  name,
  organization_id
FROM assets
WHERE name ILIKE '%dell%laptop%' OR name ILIKE '%laptop%'
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Check transactions for that asset
-- Replace 'YOUR-ASSET-ID-HERE' with the asset_id from Step 1
SELECT 
  'Transactions for Dell laptop:' as info,
  t.id,
  t.amount,
  t.type,
  t.asset_id,
  t.description,
  a.name as asset_name,
  i.invoice_number
FROM transactions t
LEFT JOIN assets a ON a.id = t.asset_id
LEFT JOIN invoices i ON i.id = t.invoice_id
WHERE t.type = 'income'
  AND (
    t.asset_id IN (SELECT id FROM assets WHERE name ILIKE '%dell%laptop%' OR name ILIKE '%laptop%')
    OR t.description ILIKE '%dell%laptop%'
  )
ORDER BY t.transaction_date DESC;

-- Step 3: Check ALL transactions with asset_id
SELECT 
  'All transactions with asset_id:' as info,
  COUNT(*) as total_count,
  COUNT(DISTINCT asset_id) as unique_assets,
  SUM(amount) as total_revenue
FROM transactions
WHERE type = 'income'
  AND asset_id IS NOT NULL;

-- Step 4: Check transactions without asset_id (might be linked incorrectly)
SELECT 
  'Transactions without asset_id:' as info,
  t.id,
  t.amount,
  t.description,
  i.invoice_number,
  qi.asset_id as quotation_item_asset_id,
  a.name as asset_name_from_quotation
FROM transactions t
LEFT JOIN invoices i ON i.id = t.invoice_id
LEFT JOIN quotations q ON q.converted_to_invoice_id = i.id
LEFT JOIN quotation_items qi ON qi.quotation_id = q.id AND qi.total = t.amount
LEFT JOIN assets a ON a.id = qi.asset_id
WHERE t.type = 'income'
  AND t.asset_id IS NULL
ORDER BY t.transaction_date DESC
LIMIT 10;

-- Step 5: Check organization_id matches
SELECT 
  'Organization check:' as info,
  a.id as asset_id,
  a.name as asset_name,
  a.organization_id as asset_org_id,
  COUNT(t.id) as transaction_count
FROM assets a
LEFT JOIN transactions t ON t.asset_id = a.id AND t.type = 'income'
WHERE a.name ILIKE '%dell%laptop%' OR a.name ILIKE '%laptop%'
GROUP BY a.id, a.name, a.organization_id;

