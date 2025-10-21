-- =====================================================
-- Backfill Transactions for Paid Invoices
-- =====================================================
-- This script creates income transactions for paid invoices
-- that were marked as paid BEFORE the auto-transaction fix
-- =====================================================

-- STEP 1: Preview what will be created
SELECT '=== PREVIEW: Invoices that need transactions ===' as section;

SELECT 
  i.invoice_number,
  i.payment_date,
  i.total,
  i.currency,
  c.name as client_name,
  CASE 
    WHEN q.id IS NOT NULL THEN 'From Quotation (has asset links)'
    ELSE 'Direct Invoice (no asset links)'
  END as invoice_type
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN quotations q ON q.converted_to_invoice_id = i.id
WHERE i.status = 'paid'
  AND i.payment_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id AND t.type = 'income'
  )
ORDER BY i.payment_date DESC;

-- =====================================================
-- STEP 2A: Backfill with Asset Links (from quotations)
-- =====================================================

SELECT '=== Creating transactions with asset links ===' as section;

-- Create income transactions for invoices converted from quotations
-- These will have asset_id linked from quotation_items
INSERT INTO transactions (
  organization_id,
  type,
  category,
  amount,
  currency,
  transaction_date,
  description,
  reference_number,
  payment_method,
  asset_id,
  client_id,
  invoice_id,
  notes,
  created_at,
  updated_at
)
SELECT 
  i.organization_id,
  'income'::text,
  'invoice_payment'::text,
  qi.total,  -- Amount per item
  i.currency,
  i.payment_date,
  'Payment for invoice ' || i.invoice_number || ': ' || qi.description,
  i.invoice_number,
  COALESCE(i.payment_method, 'unspecified'),
  qi.asset_id,  -- ✅ Link to asset
  i.client_id,
  i.id,
  'Backfilled transaction for paid invoice (created ' || NOW()::date || ')',
  i.payment_date::timestamp,  -- Use payment date as created time
  NOW()
FROM invoices i
JOIN quotations q ON q.converted_to_invoice_id = i.id
JOIN quotation_items qi ON qi.quotation_id = q.id
WHERE i.status = 'paid'
  AND i.payment_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id AND t.type = 'income'
  );

-- Show what was created
SELECT 
  COUNT(*) as transactions_created_with_asset_links,
  SUM(amount) as total_revenue_added
FROM transactions
WHERE notes LIKE '%Backfilled%'
  AND asset_id IS NOT NULL
  AND type = 'income';

-- =====================================================
-- STEP 2B: Backfill without Asset Links (direct invoices)
-- =====================================================

SELECT '=== Creating transactions without asset links ===' as section;

-- Create income transactions for direct invoices (not from quotations)
INSERT INTO transactions (
  organization_id,
  type,
  category,
  amount,
  currency,
  transaction_date,
  description,
  reference_number,
  payment_method,
  client_id,
  invoice_id,
  notes,
  created_at,
  updated_at
)
SELECT 
  i.organization_id,
  'income'::text,
  'invoice_payment'::text,
  i.total,
  i.currency,
  i.payment_date,
  'Payment for invoice ' || i.invoice_number,
  i.invoice_number,
  COALESCE(i.payment_method, 'unspecified'),
  i.client_id,
  i.id,
  'Backfilled transaction for paid invoice (created ' || NOW()::date || ')',
  i.payment_date::timestamp,
  NOW()
FROM invoices i
WHERE i.status = 'paid'
  AND i.payment_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM quotations q WHERE q.converted_to_invoice_id = i.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id AND t.type = 'income'
  );

-- Show what was created
SELECT 
  COUNT(*) as transactions_created_without_asset_links,
  SUM(amount) as total_revenue_added
FROM transactions
WHERE notes LIKE '%Backfilled%'
  AND asset_id IS NULL
  AND type = 'income';

-- =====================================================
-- STEP 3: Verify Results
-- =====================================================

SELECT '=== VERIFICATION ===' as section;

-- Check 1: All paid invoices should now have transactions
SELECT 
  'Paid invoices without transactions' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Still have missing transactions'
  END as status
FROM invoices i
WHERE i.status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id AND t.type = 'income'
  );

-- Check 2: Transaction totals should match invoice totals
SELECT 
  'Invoice amounts match transaction amounts' as check_name,
  COUNT(*) as mismatches,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '⚠️ WARNING - Some amounts dont match'
  END as status
FROM invoices i
LEFT JOIN (
  SELECT invoice_id, SUM(amount) as total
  FROM transactions
  WHERE type = 'income'
  GROUP BY invoice_id
) t ON i.id = t.invoice_id
WHERE i.status = 'paid'
  AND ABS(COALESCE(t.total, 0) - i.total) > 0.01;  -- Allow for rounding

-- Check 3: Total revenue should increase
SELECT 
  'Total Revenue in Transactions' as metric,
  ROUND(SUM(amount)::numeric, 2) as amount
FROM transactions
WHERE type = 'income';

SELECT 
  'Total Paid in Invoices' as metric,
  ROUND(SUM(total)::numeric, 2) as amount
FROM invoices
WHERE status = 'paid';

-- =====================================================
-- STEP 4: Final Report
-- =====================================================

SELECT '=== FINAL REPORT ===' as section;

DO $$
DECLARE
  total_backfilled int;
  total_revenue_added numeric;
  missing_transactions int;
BEGIN
  -- Count backfilled transactions
  SELECT COUNT(*), COALESCE(SUM(amount), 0)
  INTO total_backfilled, total_revenue_added
  FROM transactions
  WHERE notes LIKE '%Backfilled%' AND type = 'income';
  
  -- Count remaining issues
  SELECT COUNT(*)
  INTO missing_transactions
  FROM invoices i
  WHERE i.status = 'paid'
    AND NOT EXISTS (
      SELECT 1 FROM transactions t 
      WHERE t.invoice_id = i.id AND t.type = 'income'
    );
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'BACKFILL COMPLETE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Transactions created: %', total_backfilled;
  RAISE NOTICE 'Revenue added: %', total_revenue_added;
  RAISE NOTICE 'Remaining issues: %', missing_transactions;
  RAISE NOTICE '';
  
  IF missing_transactions = 0 THEN
    RAISE NOTICE '✅ SUCCESS! All paid invoices have transactions!';
    RAISE NOTICE '';
    RAISE NOTICE 'Your dashboard analytics should now show:';
    RAISE NOTICE '  - Accurate revenue per asset';
    RAISE NOTICE '  - Correct monthly revenue totals';
    RAISE NOTICE '  - Proper ROI calculations';
    RAISE NOTICE '';
    RAISE NOTICE 'Refresh your dashboard to see updated numbers!';
  ELSE
    RAISE NOTICE '⚠️ WARNING: % paid invoices still missing transactions', missing_transactions;
    RAISE NOTICE 'This might be due to:';
    RAISE NOTICE '  - Invoices with NULL payment_date';
    RAISE NOTICE '  - Invoices in inconsistent state';
    RAISE NOTICE '';
    RAISE NOTICE 'Run the verification queries above to investigate.';
  END IF;
  
  RAISE NOTICE '================================================';
END $$;

