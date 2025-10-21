-- =====================================================
-- TEST QUOTATIONS TABLES
-- =====================================================
-- This script verifies the quotations tables were created
-- and inserts sample data for testing
-- =====================================================

-- 1. Verify tables exist
DO $$
BEGIN
  RAISE NOTICE '🔍 Checking if quotations tables exist...';
  
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'quotations') THEN
    RAISE NOTICE '✅ quotations table exists';
  ELSE
    RAISE EXCEPTION '❌ quotations table does NOT exist - run CREATE-QUOTATIONS-TABLES.sql first';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'quotation_items') THEN
    RAISE NOTICE '✅ quotation_items table exists';
  ELSE
    RAISE EXCEPTION '❌ quotation_items table does NOT exist - run CREATE-QUOTATIONS-TABLES.sql first';
  END IF;
END $$;

-- 2. Show table structure
\d quotations;
\d quotation_items;

-- 3. Count existing records
SELECT 
  'quotations' as table_name,
  COUNT(*) as record_count
FROM quotations
UNION ALL
SELECT 
  'quotation_items' as table_name,
  COUNT(*) as record_count
FROM quotation_items;

-- 4. Show RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('quotations', 'quotation_items')
ORDER BY tablename, policyname;

-- =====================================================
-- OPTIONAL: Insert sample quotation for testing
-- =====================================================
-- Uncomment the section below to insert a sample quotation

/*
-- Get your organization_id and client_id
DO $$
DECLARE
  v_org_id UUID;
  v_client_id UUID;
  v_user_id UUID;
  v_quotation_id UUID;
BEGIN
  -- Get the first organization
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  
  -- Get the first client for this organization
  SELECT id INTO v_client_id FROM clients WHERE organization_id = v_org_id LIMIT 1;
  
  -- Get the first user for this organization
  SELECT id INTO v_user_id FROM users WHERE organization_id = v_org_id LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION '❌ No organization found - create one first';
  END IF;
  
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION '❌ No client found - create one first';
  END IF;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ No user found - create one first';
  END IF;
  
  -- Insert sample quotation
  INSERT INTO quotations (
    organization_id,
    client_id,
    quotation_number,
    issue_date,
    valid_until,
    status,
    currency,
    subtotal,
    tax_total,
    total,
    notes,
    terms,
    created_by
  ) VALUES (
    v_org_id,
    v_client_id,
    'QUO-2025-0001',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'draft',
    'USD',
    1000.00,
    150.00,
    1150.00,
    'Sample quotation for testing',
    'Payment due within 30 days',
    v_user_id
  ) RETURNING id INTO v_quotation_id;
  
  -- Insert sample quotation items
  INSERT INTO quotation_items (
    quotation_id,
    description,
    quantity,
    unit_price,
    tax_rate,
    amount,
    tax_amount,
    total
  ) VALUES 
  (
    v_quotation_id,
    'Professional Services - Consulting',
    10.00,
    100.00,
    15.00,
    1000.00,
    150.00,
    1150.00
  );
  
  RAISE NOTICE '✅ Sample quotation created: QUO-2025-0001';
  RAISE NOTICE 'Quotation ID: %', v_quotation_id;
END $$;
*/

RAISE NOTICE '🎉 Quotations tables are ready!';

