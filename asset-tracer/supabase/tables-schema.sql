-- =====================================================
-- Asset Tracer - Database Tables Schema
-- =====================================================
-- Run this BEFORE running functions.sql
-- Creates the required tables for financial tracking
-- =====================================================

-- =====================================================
-- 1. Transactions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'adjustment')),
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  payment_method TEXT,
  
  -- Related entities (optional)
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  receipt_url TEXT,
  
  -- Audit fields
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE transactions IS 'Financial transactions (income, expenses, transfers, adjustments)';

-- =====================================================
-- 2. Expenses Table (Optional - for approval workflow)
-- =====================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  expense_date DATE NOT NULL,
  vendor TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  payment_method TEXT,
  
  -- Related entities (optional)
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  project_id UUID,
  
  -- Tax and accounting
  is_tax_deductible BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  
  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID,
  approved_at TIMESTAMP,
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  receipt_url TEXT,
  
  -- Audit fields
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE expenses IS 'Business expenses with approval workflow';

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_org_id 
    ON transactions(organization_id);

CREATE INDEX IF NOT EXISTS idx_transactions_org_date 
    ON transactions(organization_id, transaction_date);

CREATE INDEX IF NOT EXISTS idx_transactions_asset_id 
    ON transactions(asset_id) WHERE asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_type 
    ON transactions(type);

CREATE INDEX IF NOT EXISTS idx_transactions_org_type_date 
    ON transactions(organization_id, type, transaction_date);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_org_id 
    ON expenses(organization_id);

CREATE INDEX IF NOT EXISTS idx_expenses_org_date 
    ON expenses(organization_id, expense_date);

CREATE INDEX IF NOT EXISTS idx_expenses_asset_id 
    ON expenses(asset_id) WHERE asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_status 
    ON expenses(status);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Transactions RLS policy
DROP POLICY IF EXISTS transactions_org_policy ON transactions;
CREATE POLICY transactions_org_policy ON transactions
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- Expenses RLS policy
DROP POLICY IF EXISTS expenses_org_policy ON expenses;
CREATE POLICY expenses_org_policy ON expenses
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- Insert Sample Data (Optional - for testing)
-- =====================================================

-- Uncomment to insert sample transactions
/*
INSERT INTO transactions (organization_id, type, category, amount, currency, transaction_date, description, created_by)
VALUES 
    ('your-org-uuid', 'income', 'services', 2500.00, 'USD', '2024-10-01', 'Consulting services', 'user-uuid'),
    ('your-org-uuid', 'expense', 'maintenance', 450.00, 'USD', '2024-10-05', 'Equipment repair', 'user-uuid'),
    ('your-org-uuid', 'income', 'sales', 1800.00, 'USD', '2024-10-10', 'Product sales', 'user-uuid'),
    ('your-org-uuid', 'expense', 'supplies', 200.00, 'USD', '2024-10-12', 'Office supplies', 'user-uuid');
*/

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('transactions', 'expenses')
ORDER BY table_name;

-- Check columns in transactions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('transactions', 'expenses')
ORDER BY tablename, indexname;

-- =====================================================
-- End of Script
-- =====================================================

