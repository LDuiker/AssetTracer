-- =====================================================
-- QUICK CHECK - VERIFY ALL IDs MATCH
-- =====================================================

-- Check if asset organization_id matches transaction organization_id
SELECT 
  'Asset vs Transactions:' as check_name,
  a.id as asset_id,
  a.name as asset_name,
  a.organization_id as asset_org_id,
  (SELECT COUNT(*) FROM transactions t WHERE t.asset_id = a.id AND t.type = 'income') as transaction_count,
  (SELECT organization_id FROM transactions t WHERE t.asset_id = a.id AND t.type = 'income' LIMIT 1) as transaction_org_id,
  CASE 
    WHEN a.organization_id = (SELECT organization_id FROM transactions t WHERE t.asset_id = a.id AND t.type = 'income' LIMIT 1) 
    THEN '✅ MATCH - API will return transactions'
    ELSE '❌ MISMATCH - API will return empty array'
  END as status
FROM assets a
WHERE a.id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- If MISMATCH, fix it:
-- UPDATE assets SET organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid 
-- WHERE id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

