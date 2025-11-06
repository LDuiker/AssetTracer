-- =====================================================
-- COMPLETE VERIFICATION - CHECK ALL THREE IDs
-- =====================================================

-- Check 1: Asset organization_id
SELECT 
  'Asset Organization ID:' as check_name,
  a.id as asset_id,
  a.name as asset_name,
  a.organization_id
FROM assets a
WHERE a.id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- Check 2: Transaction organization_id (we know this is 38f5f27c-743c-45bd-bdd2-2714b6990df0)
SELECT 
  'Transaction Organization ID:' as check_name,
  organization_id,
  COUNT(*) as transaction_count
FROM transactions
WHERE asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND type = 'income'
GROUP BY organization_id;

-- Check 3: User organization_id (whoever is logged in)
SELECT 
  'User Organization IDs:' as check_name,
  u.id as user_id,
  u.email,
  u.organization_id,
  o.name as organization_name
FROM users u
LEFT JOIN organizations o ON o.id = u.organization_id
ORDER BY u.created_at DESC
LIMIT 5;

-- Check 4: Do they all match?
SELECT 
  'MATCH CHECK:' as check_name,
  a.organization_id as asset_org_id,
  t.organization_id as transaction_org_id,
  CASE 
    WHEN a.organization_id = t.organization_id THEN '✅ Asset matches Transactions'
    ELSE '❌ Asset DOES NOT match Transactions - FIX NEEDED'
  END as match_status
FROM assets a
CROSS JOIN (
  SELECT DISTINCT organization_id 
  FROM transactions 
  WHERE asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid 
    AND type = 'income'
) t
WHERE a.id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- If Check 4 shows MISMATCH, run this fix:
-- UPDATE assets 
-- SET organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid 
-- WHERE id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

