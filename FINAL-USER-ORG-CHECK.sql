-- =====================================================
-- FINAL CHECK - USER ORGANIZATION_ID
-- =====================================================

-- Check if your user's organization_id matches the asset/transactions
SELECT 
  'User Organization Check:' as check_name,
  u.id as user_id,
  u.email,
  u.organization_id as user_org_id,
  '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid as asset_transaction_org_id,
  CASE 
    WHEN u.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid 
    THEN '✅ MATCH - API will work!'
    ELSE '❌ MISMATCH - API will return empty array'
  END as api_status
FROM users u
ORDER BY u.created_at DESC
LIMIT 5;

