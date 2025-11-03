-- CHECK: Why aren't expense transactions being created?

SELECT '========================================' as separator;
SELECT '🔍 EXPENSE TRANSACTION DIAGNOSTIC' as title;
SELECT '========================================' as separator;

-- Check 1: Do you have expenses in the expenses table?
SELECT '1️⃣ EXPENSES TABLE:' as check;
SELECT COUNT(*) as total_expenses FROM expenses;

-- Check 2: Show all expenses
SELECT '2️⃣ ALL EXPENSES:' as check;
SELECT 
  id,
  category,
  amount,
  expense_date,
  vendor,
  description,
  status,
  created_at
FROM expenses
ORDER BY created_at DESC;

-- Check 3: Do these expenses have matching transactions?
SELECT '3️⃣ EXPENSES WITH TRANSACTIONS:' as check;
SELECT 
  e.id as expense_id,
  e.description as expense_description,
  e.amount as expense_amount,
  e.expense_date,
  t.id as transaction_id,
  t.amount as transaction_amount,
  CASE 
    WHEN t.id IS NULL THEN '❌ NO TRANSACTION'
    ELSE '✅ HAS TRANSACTION'
  END as status
FROM expenses e
LEFT JOIN transactions t ON (
  t.description LIKE '%' || e.description || '%' 
  AND t.amount = e.amount 
  AND t.type = 'expense'
);

-- Check 4: Transactions by type
SELECT '4️⃣ TRANSACTIONS BY TYPE:' as check;
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
GROUP BY type;

-- Check 5: Check if expense category is valid in transactions
SELECT '5️⃣ EXPENSE TRANSACTIONS:' as check;
SELECT 
  category,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
WHERE type = 'expense'
GROUP BY category;

SELECT '========================================' as separator;
SELECT '📊 DIAGNOSIS:' as title;
SELECT '========================================' as separator;
SELECT 'If expenses exist but have "NO TRANSACTION" → Need to recreate them' as note1;
SELECT 'If expenses table is empty → Expenses were never created properly' as note2;
SELECT 'If transactions show 0 expenses → Missing expense transactions' as note3;

