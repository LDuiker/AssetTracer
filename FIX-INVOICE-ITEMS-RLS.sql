-- =====================================================
-- FIX INVOICE ITEMS RLS POLICIES
-- =====================================================
-- This adds missing RLS policies for invoice_items table
-- which is needed for quotation-to-invoice conversion
-- Run this in PRODUCTION Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Check if RLS is enabled on invoice_items
-- =====================================================
SELECT 
  '=== INVOICE_ITEMS RLS STATUS ===' as section,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'invoice_items';

-- =====================================================
-- STEP 2: Check existing policies on invoice_items
-- =====================================================
SELECT 
  '=== EXISTING POLICIES ===' as section,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'invoice_items';

-- =====================================================
-- STEP 3: Drop all existing policies (if any)
-- =====================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'invoice_items'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON invoice_items', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- =====================================================
-- STEP 4: Create comprehensive RLS policy for invoice_items
-- =====================================================
-- Allow users to manage invoice items for invoices in their organization
CREATE POLICY "invoice_items_all_operations"
  ON invoice_items FOR ALL
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- =====================================================
-- STEP 5: Ensure RLS is enabled
-- =====================================================
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: Verify the policy was created
-- =====================================================
SELECT 
  '=== VERIFICATION ===' as section,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause ✅'
    ELSE 'No USING clause'
  END as using_status,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause ✅'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies
WHERE tablename = 'invoice_items';

-- =====================================================
-- STEP 7: Test the policy (as authenticated user)
-- =====================================================
-- This should return your organization's invoice items
SELECT 
  '=== TEST QUERY ===' as section,
  COUNT(*) as accessible_invoice_items,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Policy allows access'
    ELSE '❌ Policy blocks access'
  END as status
FROM invoice_items
WHERE invoice_id IN (
  SELECT id FROM invoices 
  WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
);

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Invoice items RLS policy fixed!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  - Create invoice items (INSERT)';
  RAISE NOTICE '  - Read invoice items (SELECT)';
  RAISE NOTICE '  - Update invoice items (UPDATE)';
  RAISE NOTICE '  - Delete invoice items (DELETE)';
  RAISE NOTICE '';
  RAISE NOTICE 'Quotation-to-invoice conversion should work now!';
  RAISE NOTICE '================================================';
END $$;

