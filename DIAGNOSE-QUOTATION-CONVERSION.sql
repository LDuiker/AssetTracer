-- =====================================================
-- DIAGNOSE QUOTATION TO INVOICE CONVERSION ISSUE
-- =====================================================
-- This script checks why quotation conversion is failing
-- Run this in PRODUCTION Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Check if quotations table exists
-- =====================================================
SELECT 
  '=== QUOTATIONS TABLE CHECK ===' as section,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'quotations')
    THEN '✅ Quotations table exists'
    ELSE '❌ Quotations table MISSING'
  END as status;

-- =====================================================
-- STEP 2: Check quotations table columns
-- =====================================================
SELECT 
  '=== QUOTATIONS TABLE COLUMNS ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'quotations'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 3: Check if converted_to_invoice_id column exists
-- =====================================================
SELECT 
  '=== CONVERTED_TO_INVOICE_ID COLUMN ===' as section,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'quotations' 
      AND column_name = 'converted_to_invoice_id'
    )
    THEN '✅ converted_to_invoice_id column exists'
    ELSE '❌ converted_to_invoice_id column MISSING - RUN ADD-CONVERTED-TO-INVOICE-COLUMN.sql'
  END as status;

-- =====================================================
-- STEP 4: Check if quotation_items table exists
-- =====================================================
SELECT 
  '=== QUOTATION_ITEMS TABLE CHECK ===' as section,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'quotation_items')
    THEN '✅ Quotation items table exists'
    ELSE '❌ Quotation items table MISSING'
  END as status;

-- =====================================================
-- STEP 5: Check if invoices table exists
-- =====================================================
SELECT 
  '=== INVOICES TABLE CHECK ===' as section,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices')
    THEN '✅ Invoices table exists'
    ELSE '❌ Invoices table MISSING'
  END as status;

-- =====================================================
-- STEP 6: Check if invoice_items table exists
-- =====================================================
SELECT 
  '=== INVOICE_ITEMS TABLE CHECK ===' as section,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items')
    THEN '✅ Invoice items table exists'
    ELSE '❌ Invoice items table MISSING'
  END as status;

-- =====================================================
-- STEP 7: Check existing quotations
-- =====================================================
SELECT 
  '=== EXISTING QUOTATIONS ===' as section,
  COUNT(*) as total_quotations,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_quotations,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_quotations,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_quotations,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_quotations,
  COUNT(CASE WHEN status = 'invoiced' THEN 1 END) as invoiced_quotations
FROM quotations;

-- =====================================================
-- STEP 8: Check if there are accepted quotations ready to convert
-- =====================================================
SELECT 
  '=== ACCEPTED QUOTATIONS (READY TO CONVERT) ===' as section,
  id,
  quotation_number,
  status,
  client_id,
  total,
  issue_date,
  valid_until
FROM quotations
WHERE status = 'accepted'
ORDER BY issue_date DESC
LIMIT 5;

-- =====================================================
-- STEP 9: Check organization subscription tier (for quota)
-- =====================================================
SELECT 
  '=== ORGANIZATION SUBSCRIPTION TIER ===' as section,
  id,
  name,
  COALESCE(subscription_tier, 'free') as subscription_tier,
  COALESCE(subscription_status, 'none') as subscription_status
FROM organizations
LIMIT 5;

-- =====================================================
-- STEP 10: Count invoices created this month (for free tier check)
-- =====================================================
SELECT 
  '=== INVOICES THIS MONTH (FREE TIER: MAX 5) ===' as section,
  COUNT(*) as invoices_this_month,
  CASE 
    WHEN COUNT(*) < 5 THEN '✅ Under free tier limit'
    WHEN COUNT(*) >= 5 THEN '⚠️ At or over free tier limit (5/month)'
  END as quota_status
FROM invoices
WHERE created_at >= date_trunc('month', CURRENT_DATE);

-- =====================================================
-- STEP 11: Check foreign key constraints
-- =====================================================
SELECT 
  '=== FOREIGN KEY CONSTRAINTS ===' as section,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('quotations', 'quotation_items', 'invoices', 'invoice_items')
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Diagnostic complete!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Review the output above to identify the issue.';
  RAISE NOTICE '';
  RAISE NOTICE 'Common issues:';
  RAISE NOTICE '1. Missing converted_to_invoice_id column';
  RAISE NOTICE '2. RLS policies blocking conversion';
  RAISE NOTICE '3. Free tier invoice limit reached';
  RAISE NOTICE '4. Missing quotation_items or invoice_items tables';
  RAISE NOTICE '================================================';
END $$;

