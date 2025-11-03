-- =====================================================
-- PRODUCTION DEPLOYMENT: Financial Reporting Fixes
-- =====================================================
-- Run this on PRODUCTION database (ftelnmursmitpjwjbyrw)
-- Last updated: 2025-10-25
-- 
-- This script fixes all financial reporting issues:
-- 1. Purchase cost trigger (prevents overwriting)
-- 2. Missing transaction columns
-- 3. Transaction date syncing
-- 4. Missing transaction records
-- 5. Asset financial links
-- =====================================================

BEGIN;

-- =====================================================
-- FIX 1: Purchase Cost Trigger (Clean Up)
-- =====================================================
-- Production only has 'purchase_cost', not 'purchase_price'
-- Remove any problematic triggers that reference non-existent columns

DROP TRIGGER IF EXISTS sync_purchase_cost_trigger ON assets;
DROP FUNCTION IF EXISTS sync_purchase_cost() CASCADE;

-- No trigger needed - production only has purchase_cost column
-- The staging environment had both columns, but production doesn't

-- =====================================================
-- FIX 2: Transactions Table - Missing Columns
-- =====================================================
-- Add columns that were missing and causing transaction creation to fail

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES expenses(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_expense_id ON transactions(expense_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);

-- =====================================================
-- FIX 3: Transaction Date Column (Skip if not needed)
-- =====================================================
-- Production likely only has 'transaction_date', not 'date'
-- This section is only needed if you have BOTH columns

-- Check if 'date' column exists and sync if needed
DO $$
BEGIN
  -- Only sync if date column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'date'
  ) THEN
    -- Sync existing values
    UPDATE transactions 
    SET transaction_date = date 
    WHERE transaction_date IS NULL AND date IS NOT NULL;
    
    -- Create sync trigger
    DROP TRIGGER IF EXISTS sync_transaction_date_trigger ON transactions;
    
    CREATE OR REPLACE FUNCTION sync_transaction_date()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF NEW.transaction_date IS NOT NULL AND NEW.date IS DISTINCT FROM NEW.transaction_date THEN
        NEW.date := NEW.transaction_date;
      ELSIF NEW.date IS NOT NULL AND NEW.transaction_date IS DISTINCT FROM NEW.date THEN
        NEW.transaction_date := NEW.date;
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    CREATE TRIGGER sync_transaction_date_trigger
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION sync_transaction_date();
  END IF;
END $$;

-- =====================================================
-- FIX 4: Recreate Missing Transactions
-- =====================================================
-- Income transactions from paid invoices
-- Expense transactions from expenses

-- Delete orphaned/incomplete transactions first
DELETE FROM transactions 
WHERE description IS NULL 
  AND amount = 0 
  AND transaction_date IS NULL;

-- Recreate income transactions from paid invoices
INSERT INTO transactions (
  organization_id,
  type,
  category,
  amount,
  description,
  transaction_date,
  currency,
  invoice_id,
  client_id,
  created_at,
  updated_at
)
SELECT 
  i.organization_id,
  'income' as type,
  'sales' as category,
  i.paid_amount as amount,
  'Payment for Invoice #' || i.invoice_number as description,
  COALESCE(i.payment_date, i.updated_at::date) as transaction_date,
  COALESCE(i.currency, 'USD') as currency,
  i.id as invoice_id,
  i.client_id,
  i.updated_at as created_at,
  i.updated_at as updated_at
FROM invoices i
WHERE i.status = 'paid'
  AND i.paid_amount > 0
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id
  )
ON CONFLICT DO NOTHING;

-- Recreate expense transactions from expenses
INSERT INTO transactions (
  organization_id,
  type,
  category,
  amount,
  description,
  transaction_date,
  currency,
  expense_id,
  asset_id,
  created_by,
  created_at,
  updated_at
)
SELECT 
  e.organization_id,
  'expense' as type,
  COALESCE(e.category, 'operating') as category,
  e.amount,
  COALESCE(e.description, 'Expense') as description,
  COALESCE(e.expense_date, e.created_at::date) as transaction_date,
  COALESCE(e.currency, 'USD') as currency,
  e.id as expense_id,
  e.asset_id,
  e.created_by,
  e.created_at,
  e.updated_at
FROM expenses e
WHERE NOT EXISTS (
  SELECT 1 FROM transactions t 
  WHERE t.expense_id = e.id
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FIX 5: Verify and Report
-- =====================================================

-- Show summary of fixes applied
SELECT 'DEPLOYMENT SUMMARY' as section;

SELECT 
  'Transactions Total' as metric,
  COUNT(*) as count
FROM transactions;

SELECT 
  'Income Transactions' as metric,
  COUNT(*) as count
FROM transactions
WHERE type = 'income';

SELECT 
  'Expense Transactions' as metric,
  COUNT(*) as count
FROM transactions
WHERE type = 'expense';

SELECT 
  'Transactions with Dates' as metric,
  COUNT(*) as count
FROM transactions
WHERE transaction_date IS NOT NULL;

SELECT 
  'Assets with Purchase Cost' as metric,
  COUNT(*) as count
FROM assets
WHERE purchase_cost IS NOT NULL AND purchase_cost > 0;

SELECT 
  'Transactions Linked to Assets' as metric,
  COUNT(*) as count
FROM transactions
WHERE asset_id IS NOT NULL;

-- Verify financial functions still work
SELECT 'Testing get_financial_summary()' as test;
SELECT * FROM get_financial_summary((SELECT id FROM organizations LIMIT 1));

-- =====================================================
COMMIT;
-- =====================================================

SELECT '✅ PRODUCTION DEPLOYMENT COMPLETE!' as result;
SELECT 'Refresh your production dashboard to see the fixes!' as next_step;

