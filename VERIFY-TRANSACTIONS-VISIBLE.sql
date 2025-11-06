-- =====================================================
-- VERIFY TRANSACTIONS ARE VISIBLE TO API
-- =====================================================

-- CHECK 1: Verify Dell laptop asset organization_id matches transactions
SELECT 
  'CHECK 1 - Asset organization:' as check_name,
  a.id as asset_id,
  a.name as asset_name,
  a.organization_id as asset_org_id
FROM assets a
WHERE a.id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- CHECK 2: Verify transactions organization_id matches asset
SELECT 
  'CHECK 2 - Transaction organization match:' as check_name,
  t.id as transaction_id,
  t.asset_id,
  t.organization_id as transaction_org_id,
  t.amount,
  t.type,
  a.organization_id as asset_org_id,
  CASE 
    WHEN t.organization_id = a.organization_id THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END as match_status
FROM transactions t
INNER JOIN assets a ON a.id = t.asset_id
WHERE t.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND t.type = 'income';

-- CHECK 3: What organization_id does the API see? (Check user's organization)
-- Replace YOUR-USER-ID with your actual user ID from auth.users
-- Or run this to see all users and their organizations:
SELECT 
  'CHECK 3 - User organizations:' as check_name,
  u.id as user_id,
  u.email,
  u.organization_id,
  o.name as organization_name
FROM users u
LEFT JOIN organizations o ON o.id = u.organization_id
ORDER BY u.created_at DESC
LIMIT 5;

-- CHECK 4: Final verification - transactions that API should return
SELECT 
  'CHECK 4 - Transactions API should return:' as check_name,
  COUNT(*) as transaction_count,
  SUM(amount) as total_revenue,
  organization_id
FROM transactions
WHERE asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND type = 'income'
GROUP BY organization_id;

