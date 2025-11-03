-- DIAGNOSTIC: Check staging database schema status
-- Run this to see what columns exist and identify missing ones

SELECT '========================================' as separator;
SELECT '🔍 STAGING DATABASE SCHEMA DIAGNOSTIC' as status;
SELECT '========================================' as separator;

-- Check Assets table
SELECT '1️⃣ ASSETS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assets'
  AND column_name IN ('purchase_cost', 'purchase_price', 'status')
ORDER BY column_name;

-- Check Assets status constraint
SELECT '1️⃣ ASSETS STATUS CONSTRAINT:' as info;
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'assets_status_check';

-- Check Invoices table
SELECT '2️⃣ INVOICES TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices'
  AND column_name IN ('tax', 'tax_total', 'paid_amount', 'balance', 'payment_method', 'payment_date', 'created_by', 'currency', 'subject')
ORDER BY column_name;

-- Check Invoice Items table
SELECT '3️⃣ INVOICE_ITEMS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'invoice_items'
  AND column_name IN ('tax_rate', 'tax_amount', 'total', 'updated_at', 'asset_id')
ORDER BY column_name;

-- Check Quotations table
SELECT '4️⃣ QUOTATIONS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quotations'
  AND column_name IN ('tax', 'tax_total', 'currency', 'created_by', 'converted_to_invoice_id')
ORDER BY column_name;

-- Check Quotation Items table
SELECT '5️⃣ QUOTATION_ITEMS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quotation_items'
  AND column_name IN ('tax_rate', 'tax_amount', 'total', 'asset_id')
ORDER BY column_name;

-- Check Clients table
SELECT '6️⃣ CLIENTS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN ('zip', 'postal_code', 'tax_id')
ORDER BY column_name;

-- Check RLS status
SELECT '🔒 RLS STATUS:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('invoices', 'invoice_items', 'quotations', 'quotation_items', 'assets', 'clients')
ORDER BY tablename;

-- Check if there are any invoices
SELECT '📊 DATA COUNTS:' as info;
SELECT 'invoices' as table_name, COUNT(*) as count FROM invoices
UNION ALL
SELECT 'invoice_items', COUNT(*) FROM invoice_items
UNION ALL
SELECT 'quotations', COUNT(*) FROM quotations
UNION ALL
SELECT 'quotation_items', COUNT(*) FROM quotation_items
UNION ALL
SELECT 'assets', COUNT(*) FROM assets
UNION ALL
SELECT 'clients', COUNT(*) FROM clients;

-- Check for any existing quotations with details
SELECT '📝 QUOTATIONS DETAILS:' as info;
SELECT 
  id,
  quotation_number,
  status,
  currency,
  tax_total,
  converted_to_invoice_id,
  created_by
FROM quotations
LIMIT 5;

SELECT '========================================' as separator;
SELECT '✅ DIAGNOSTIC COMPLETE' as status;
SELECT '========================================' as separator;

