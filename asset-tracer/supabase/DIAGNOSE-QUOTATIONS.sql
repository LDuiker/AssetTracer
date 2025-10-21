-- =====================================================
-- DIAGNOSE QUOTATIONS ISSUES
-- =====================================================
-- This script helps diagnose quotations-related errors
-- =====================================================

-- 1. Check if tables exist
DO $$
BEGIN
  RAISE NOTICE '===== CHECKING TABLES =====';
  
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'quotations') THEN
    RAISE NOTICE '✅ quotations table exists';
  ELSE
    RAISE EXCEPTION '❌ quotations table does NOT exist';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'quotation_items') THEN
    RAISE NOTICE '✅ quotation_items table exists';
  ELSE
    RAISE EXCEPTION '❌ quotation_items table does NOT exist';
  END IF;
END $$;

-- 2. Check RLS is enabled
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('quotations', 'quotation_items');

-- 3. List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE tablename IN ('quotations', 'quotation_items')
ORDER BY tablename, policyname;

-- 4. Check current user and organization
SELECT 
  'Current User Info' as check_type,
  auth.uid() as user_id,
  u.email,
  u.organization_id,
  o.name as organization_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.id = auth.uid();

-- 5. Count quotations for current user's organization
SELECT 
  'Quotation Count' as check_type,
  COUNT(*) as total_quotations
FROM quotations
WHERE organization_id IN (
  SELECT organization_id FROM users WHERE id = auth.uid()
);

-- 6. Try to select quotations (simulating what the API does)
SELECT 
  'Sample Quotations' as check_type,
  q.id,
  q.quotation_number,
  q.status,
  q.total,
  q.organization_id,
  c.name as client_name
FROM quotations q
LEFT JOIN clients c ON q.client_id = c.id
WHERE q.organization_id IN (
  SELECT organization_id FROM users WHERE id = auth.uid()
)
LIMIT 5;

-- 7. Check for orphaned quotations (quotations without valid clients)
SELECT 
  'Orphaned Quotations Check' as check_type,
  q.id,
  q.quotation_number,
  q.client_id,
  CASE 
    WHEN c.id IS NULL THEN '❌ Client does not exist'
    ELSE '✅ Client exists'
  END as client_status
FROM quotations q
LEFT JOIN clients c ON q.client_id = c.id
WHERE q.organization_id IN (
  SELECT organization_id FROM users WHERE id = auth.uid()
);

-- 8. Test if we can insert (check INSERT policy)
DO $$
DECLARE
  v_org_id UUID;
  v_test_quotation_id UUID;
BEGIN
  RAISE NOTICE '===== TESTING INSERT PERMISSIONS =====';
  
  -- Get current user's organization
  SELECT organization_id INTO v_org_id 
  FROM users 
  WHERE id = auth.uid();
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION '❌ No organization found for current user';
  END IF;
  
  RAISE NOTICE '✅ Organization ID: %', v_org_id;
  RAISE NOTICE 'Note: Insert test not executed to avoid creating test data';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;

-- 9. Check if clients table has data
SELECT 
  'Clients Check' as check_type,
  COUNT(*) as total_clients,
  COUNT(CASE WHEN organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()) THEN 1 END) as clients_in_my_org
FROM clients;

-- 10. Final summary
DO $$
DECLARE
  v_quotations_count INTEGER;
  v_clients_count INTEGER;
  v_org_id UUID;
BEGIN
  RAISE NOTICE '===== SUMMARY =====';
  
  -- Get org ID
  SELECT organization_id INTO v_org_id FROM users WHERE id = auth.uid();
  
  -- Count quotations
  SELECT COUNT(*) INTO v_quotations_count 
  FROM quotations 
  WHERE organization_id = v_org_id;
  
  -- Count clients
  SELECT COUNT(*) INTO v_clients_count 
  FROM clients 
  WHERE organization_id = v_org_id;
  
  RAISE NOTICE 'Organization ID: %', v_org_id;
  RAISE NOTICE 'Total Quotations: %', v_quotations_count;
  RAISE NOTICE 'Total Clients: %', v_clients_count;
  
  IF v_quotations_count = 0 THEN
    RAISE NOTICE '💡 No quotations found - this is normal for a new setup';
    RAISE NOTICE '💡 Try creating a quotation from the UI';
  END IF;
  
  IF v_clients_count = 0 THEN
    RAISE NOTICE '⚠️  No clients found - you need to create clients first';
    RAISE NOTICE '💡 Go to /clients page and create a client before creating quotations';
  END IF;
  
END $$;

RAISE NOTICE '🎉 Diagnostic complete!';

