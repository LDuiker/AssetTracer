-- SIMPLE CHECK: Just the basics, no functions

-- Check 1: Do you have an organization?
SELECT 'YOUR ORGANIZATION:' as info, id, name FROM organizations;

-- Check 2: Do you have transactions?
SELECT 'TRANSACTION COUNT:' as info, COUNT(*) as total FROM transactions;

-- Check 3: Show all transactions
SELECT 'ALL TRANSACTIONS:' as info;
SELECT * FROM transactions;

-- Check 4: Sum transactions by type
SELECT 'SUM BY TYPE:' as info, 
  type, 
  COUNT(*) as count, 
  SUM(amount) as total 
FROM transactions 
GROUP BY type;

-- Check 5: Check transaction dates
SELECT 'TRANSACTION DATES:' as info,
  MIN(transaction_date) as earliest,
  MAX(transaction_date) as latest,
  COUNT(*) as total
FROM transactions;

-- Check 6: Do you have invoices?
SELECT 'INVOICES:' as info, COUNT(*) as total FROM invoices;

-- Check 7: Show invoices
SELECT 'ALL INVOICES:' as info;
SELECT invoice_number, status, total, issue_date FROM invoices;

-- Check 8: Do you have assets?
SELECT 'ASSETS:' as info, COUNT(*) as total FROM assets;

-- Check 9: Show assets
SELECT 'ALL ASSETS:' as info;
SELECT id, name, purchase_cost, current_value FROM assets;

