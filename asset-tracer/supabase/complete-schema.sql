-- =====================================================
-- Asset Tracer - COMPLETE Database Schema
-- =====================================================
-- Run this FIRST before functions.sql
-- Creates ALL required tables for the application
-- =====================================================

-- =====================================================
-- 1. Organizations Table
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  default_currency TEXT DEFAULT 'USD',
  default_tax_rate NUMERIC(5,2) DEFAULT 0,
  timezone TEXT DEFAULT 'America/New_York',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE organizations IS 'Organizations/Companies';

-- =====================================================
-- 2. Users Table
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Application users linked to Supabase auth';

-- =====================================================
-- 3. Clients Table
-- =====================================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE clients IS 'Client/customer information';

-- =====================================================
-- 4. Assets Table
-- =====================================================

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC(10,2),
  current_value NUMERIC(10,2),
  status TEXT CHECK (status IN ('active', 'maintenance', 'retired', 'sold')),
  location TEXT,
  serial_number TEXT,
  image_url TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE assets IS 'Asset inventory and tracking';

-- =====================================================
-- 5. Invoices Table
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  invoice_number TEXT UNIQUE NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  payment_method TEXT,
  payment_date DATE,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE invoices IS 'Client invoices and billing';

-- =====================================================
-- 6. Invoice Items Table
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  tax_rate NUMERIC(5,2) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 100),
  amount NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE invoice_items IS 'Line items for invoices';

-- =====================================================
-- 7. Transactions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
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

COMMENT ON TABLE transactions IS 'Financial transactions (income, expenses, transfers, adjustments)';

-- =====================================================
-- 8. Expenses Table
-- =====================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
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

COMMENT ON TABLE expenses IS 'Business expenses with approval workflow';

-- =====================================================
-- Create Indexes for Performance
-- =====================================================

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name 
    ON organizations(name);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_org_id 
    ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email 
    ON users(email);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_org_id 
    ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_email 
    ON clients(email);

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_assets_org_id 
    ON assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_org_status 
    ON assets(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_category 
    ON assets(category);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_org_id 
    ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id 
    ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_status 
    ON invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_org_payment_date 
    ON invoices(organization_id, payment_date) WHERE payment_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_number 
    ON invoices(invoice_number);

-- Invoice items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id 
    ON invoice_items(invoice_id);

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
-- Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Create RLS Policies
-- =====================================================

-- Users can access their own organization
DROP POLICY IF EXISTS users_org_policy ON users;
CREATE POLICY users_org_policy ON users
    FOR ALL
    USING (id = auth.uid() OR organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Clients policy
DROP POLICY IF EXISTS clients_org_policy ON clients;
CREATE POLICY clients_org_policy ON clients
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Assets policy
DROP POLICY IF EXISTS assets_org_policy ON assets;
CREATE POLICY assets_org_policy ON assets
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Invoices policy
DROP POLICY IF EXISTS invoices_org_policy ON invoices;
CREATE POLICY invoices_org_policy ON invoices
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Invoice items policy (through invoice)
DROP POLICY IF EXISTS invoice_items_policy ON invoice_items;
CREATE POLICY invoice_items_policy ON invoice_items
    FOR ALL
    USING (invoice_id IN (
        SELECT id FROM invoices WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    ));

-- Transactions policy
DROP POLICY IF EXISTS transactions_org_policy ON transactions;
CREATE POLICY transactions_org_policy ON transactions
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Expenses policy
DROP POLICY IF EXISTS expenses_org_policy ON expenses;
CREATE POLICY expenses_org_policy ON expenses
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- =====================================================
-- Verification
-- =====================================================

-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'organizations', 'users', 'clients', 'assets', 
        'invoices', 'invoice_items', 'transactions', 'expenses'
    )
ORDER BY table_name;

-- =====================================================
-- Success Message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ All tables created successfully!';
    RAISE NOTICE '📋 Tables: organizations, users, clients, assets, invoices, invoice_items, transactions, expenses';
    RAISE NOTICE '🔒 RLS policies enabled for all tables';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '';
    RAISE NOTICE '👉 Next step: Run functions.sql to create the database functions';
END $$;

