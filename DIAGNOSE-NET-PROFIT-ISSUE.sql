-- DIAGNOSE: Why is net profit still 0?
-- Run this to check what's happening

SELECT '========================================' as separator;
SELECT '🔍 NET PROFIT DIAGNOSTIC' as title;
SELECT '========================================' as separator;

-- Check 1: Were the columns added to transactions table?
SELECT '1️⃣ TRANSACTIONS TABLE COLUMNS:' as check;
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN (
    'transaction_date', 'currency', 'asset_id', 'client_id', 
    'reference_number', 'payment_method', 'created_by'
  )
ORDER BY column_name;

-- Check 2: Are there any transactions at all?
SELECT '2️⃣ TRANSACTION COUNT:' as check;
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM transactions
GROUP BY type;

-- Check 3: What invoices exist and their status?
SELECT '3️⃣ INVOICES STATUS:' as check;
SELECT 
  invoice_number,
  status,
  total,
  issue_date,
  created_at
FROM invoices
ORDER BY created_at DESC
LIMIT 10;

-- Check 4: Do you have any PAID invoices?
SELECT '4️⃣ PAID INVOICES:' as check;
SELECT 
  COUNT(*) as paid_invoice_count,
  SUM(total) as total_paid_amount
FROM invoices
WHERE status = 'paid';

-- Check 5: Check if transactions have asset_id linked
SELECT '5️⃣ TRANSACTIONS WITH ASSET LINKS:' as check;
SELECT 
  COUNT(*) as total_transactions,
  COUNT(asset_id) as transactions_with_asset,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
FROM transactions;

-- Check 6: What does the financial summary function return?
SELECT '6️⃣ RUNNING FINANCIAL SUMMARY:' as check;
SELECT * FROM get_financial_summary(
  (SELECT id FROM organizations LIMIT 1)
);

-- Check 7: Check recent transactions
SELECT '7️⃣ RECENT TRANSACTIONS:' as check;
SELECT 
  type,
  category,
  amount,
  transaction_date,
  description,
  asset_id,
  invoice_id
FROM transactions
ORDER BY created_at DESC
LIMIT 10;

SELECT '========================================' as separator;
SELECT '📋 INTERPRETATION:' as title;
SELECT '========================================' as separator;
SELECT 'If "TRANSACTION COUNT" is 0 or empty → Invoices need to be marked as PAID' as interpretation_1;
SELECT 'If "PAID INVOICES" shows 0 → You need to mark your invoice as "paid"' as interpretation_2;
SELECT 'If columns are missing → Re-run FIX-TRANSACTIONS-TABLE.sql' as interpretation_3;
SELECT 'If transactions exist but net profit is 0 → Clear browser cache and refresh' as interpretation_4;

