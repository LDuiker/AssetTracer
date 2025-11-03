-- CHECK: Why asset costs and revenue show 0

SELECT '========================================' as separator;
SELECT '🔍 ASSET FINANCIAL LINKS DIAGNOSTIC' as title;
SELECT '========================================' as separator;

-- Check 1: Do assets have purchase costs?
SELECT '1️⃣ ASSETS WITH PURCHASE COSTS:' as check;
SELECT 
  id,
  name,
  purchase_cost,
  current_value,
  (purchase_cost - COALESCE(current_value, 0)) as depreciation
FROM assets;

-- Check 2: Are transactions linked to assets?
SELECT '2️⃣ TRANSACTIONS LINKED TO ASSETS:' as check;
SELECT 
  COUNT(*) as total_transactions,
  COUNT(asset_id) as transactions_with_asset_id,
  COUNT(*) - COUNT(asset_id) as transactions_without_asset_id
FROM transactions;

-- Check 3: Show transactions and their asset links
SELECT '3️⃣ TRANSACTION DETAILS:' as check;
SELECT 
  t.type,
  t.amount,
  t.description,
  t.asset_id,
  a.name as asset_name,
  CASE 
    WHEN t.asset_id IS NULL THEN '❌ NO ASSET LINK'
    ELSE '✅ LINKED TO ASSET'
  END as link_status
FROM transactions t
LEFT JOIN assets a ON t.asset_id = a.id
ORDER BY t.created_at DESC;

-- Check 4: Test the get_asset_financials function
SELECT '4️⃣ ASSET FINANCIALS FUNCTION:' as check;
SELECT 
  asset_id,
  asset_name,
  purchase_cost,
  total_spend,
  total_revenue,
  profit_loss,
  roi_percentage
FROM get_asset_financials((SELECT id FROM organizations LIMIT 1))
ORDER BY total_revenue DESC;

-- Check 5: Which invoices/expenses are missing asset links?
SELECT '5️⃣ INVOICES WITHOUT ASSET LINKS:' as check;
SELECT 
  i.invoice_number,
  i.total,
  t.id as transaction_id,
  t.asset_id,
  CASE 
    WHEN t.asset_id IS NULL THEN '❌ NO ASSET'
    ELSE '✅ HAS ASSET'
  END as status
FROM invoices i
LEFT JOIN transactions t ON t.invoice_id = i.id
WHERE i.status = 'paid';

SELECT '========================================' as separator;
SELECT '📊 DIAGNOSIS:' as title;
SELECT '========================================' as separator;
SELECT 'If purchase_cost is NULL → Need to update asset costs' as note1;
SELECT 'If transactions have no asset_id → Need to link transactions to assets' as note2;
SELECT 'If asset financials show 0 → Both issues need fixing' as note3;

