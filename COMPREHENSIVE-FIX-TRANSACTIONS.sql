-- =====================================================
-- COMPREHENSIVE FIX FOR TRANSACTIONS AND ASSET_ID
-- =====================================================
-- This script fixes multiple issues:
-- 1. Updates organization_id to match asset's organization_id
-- 2. Links transactions to assets via quotation_items if asset_id is NULL
-- 3. Verifies all transactions have correct organization_id

-- Step 1: Check current state
SELECT 
  'Current state:' as info,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN asset_id IS NOT NULL THEN 1 END) as transactions_with_asset_id,
  COUNT(CASE WHEN asset_id IS NULL THEN 1 END) as transactions_without_asset_id,
  COUNT(DISTINCT organization_id) as unique_org_ids
FROM transactions
WHERE type = 'income';

-- Step 2: Check organization_id mismatches
SELECT 
  'Organization mismatches:' as info,
  COUNT(*) as mismatched_count
FROM transactions t
INNER JOIN assets a ON a.id = t.asset_id
WHERE t.type = 'income'
  AND t.asset_id IS NOT NULL
  AND t.organization_id != a.organization_id;

-- Step 3: Fix organization_id mismatches
UPDATE transactions t
SET organization_id = a.organization_id
FROM assets a
WHERE t.asset_id = a.id
  AND t.organization_id != a.organization_id
  AND t.asset_id IS NOT NULL;

-- Step 4: Link transactions to assets via quotation_items (if asset_id is NULL)
UPDATE transactions t
SET asset_id = qi.asset_id,
    organization_id = COALESCE(a.organization_id, t.organization_id)
FROM invoices i
INNER JOIN quotations q ON q.converted_to_invoice_id = i.id
INNER JOIN quotation_items qi ON qi.quotation_id = q.id
LEFT JOIN assets a ON a.id = qi.asset_id
WHERE t.invoice_id = i.id
  AND t.type = 'income'
  AND t.asset_id IS NULL
  AND qi.asset_id IS NOT NULL
  AND ABS(qi.total - t.amount) < 0.01;  -- Match by amount (within 1 cent tolerance)

-- Step 5: If still no asset_id, try matching by invoice total
UPDATE transactions t
SET organization_id = i.organization_id
FROM invoices i
WHERE t.invoice_id = i.id
  AND t.type = 'income'
  AND t.organization_id != i.organization_id;

-- Step 6: Verify the fixes
SELECT 
  'After fixes:' as info,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN asset_id IS NOT NULL THEN 1 END) as transactions_with_asset_id,
  COUNT(CASE WHEN asset_id IS NULL THEN 1 END) as transactions_without_asset_id,
  COUNT(DISTINCT organization_id) as unique_org_ids
FROM transactions
WHERE type = 'income';

-- Step 7: Check transactions per asset
SELECT 
  'Transactions per asset:' as info,
  a.name as asset_name,
  a.id as asset_id,
  a.organization_id as asset_org_id,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_revenue,
  STRING_AGG(DISTINCT t.organization_id::text, ', ') as transaction_org_ids
FROM assets a
LEFT JOIN transactions t ON t.asset_id = a.id AND t.type = 'income'
WHERE a.name ILIKE '%dell%laptop%' OR a.name ILIKE '%laptop%'
GROUP BY a.id, a.name, a.organization_id;

-- Step 8: Show all income transactions with their details
SELECT 
  'All income transactions:' as info,
  t.id,
  t.amount,
  t.asset_id,
  t.organization_id as transaction_org_id,
  a.name as asset_name,
  a.organization_id as asset_org_id,
  i.invoice_number,
  CASE 
    WHEN t.asset_id IS NULL THEN '❌ No asset_id'
    WHEN t.organization_id != a.organization_id THEN '⚠️ Org mismatch'
    ELSE '✅ OK'
  END as status
FROM transactions t
LEFT JOIN assets a ON a.id = t.asset_id
LEFT JOIN invoices i ON i.id = t.invoice_id
WHERE t.type = 'income'
ORDER BY t.transaction_date DESC
LIMIT 20;

