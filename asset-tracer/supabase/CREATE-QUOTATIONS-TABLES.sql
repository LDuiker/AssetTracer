-- =====================================================
-- CREATE QUOTATIONS TABLES
-- =====================================================
-- This script creates the quotations and quotation_items tables
-- for managing client quotations/proposals
-- =====================================================

-- Drop existing tables if they exist (for clean slate)
DROP TABLE IF EXISTS quotation_items CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;

-- =====================================================
-- 1. Create quotations table
-- =====================================================
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  issue_date DATE NOT NULL,
  valid_until DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'invoiced')),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  converted_to_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. Create quotation_items table
-- =====================================================
CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. Create indexes for performance
-- =====================================================

-- Quotations indexes
CREATE INDEX idx_quotations_organization ON quotations(organization_id);
CREATE INDEX idx_quotations_client ON quotations(client_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_number ON quotations(quotation_number);
CREATE INDEX idx_quotations_created_at ON quotations(created_at DESC);
CREATE INDEX idx_quotations_converted_to_invoice ON quotations(converted_to_invoice_id);

-- Quotation items indexes
CREATE INDEX idx_quotation_items_quotation ON quotation_items(quotation_id);
CREATE INDEX idx_quotation_items_asset ON quotation_items(asset_id);

-- =====================================================
-- 4. Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. Create RLS Policies
-- =====================================================

-- Quotations: Users can only see quotations from their organization
CREATE POLICY quotations_select_policy ON quotations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Quotations: Users can insert quotations for their organization
CREATE POLICY quotations_insert_policy ON quotations
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Quotations: Users can update quotations from their organization
CREATE POLICY quotations_update_policy ON quotations
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Quotations: Users can delete quotations from their organization
CREATE POLICY quotations_delete_policy ON quotations
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Quotation Items: Users can see items from quotations in their organization
CREATE POLICY quotation_items_select_policy ON quotation_items
  FOR SELECT
  USING (
    quotation_id IN (
      SELECT id 
      FROM quotations 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
      )
    )
  );

-- Quotation Items: Users can insert items for quotations in their organization
CREATE POLICY quotation_items_insert_policy ON quotation_items
  FOR INSERT
  WITH CHECK (
    quotation_id IN (
      SELECT id 
      FROM quotations 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
      )
    )
  );

-- Quotation Items: Users can update items from quotations in their organization
CREATE POLICY quotation_items_update_policy ON quotation_items
  FOR UPDATE
  USING (
    quotation_id IN (
      SELECT id 
      FROM quotations 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
      )
    )
  );

-- Quotation Items: Users can delete items from quotations in their organization
CREATE POLICY quotation_items_delete_policy ON quotation_items
  FOR DELETE
  USING (
    quotation_id IN (
      SELECT id 
      FROM quotations 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- 6. Create updated_at trigger function
-- =====================================================

CREATE OR REPLACE FUNCTION update_quotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_quotation_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER quotations_updated_at_trigger
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_quotations_updated_at();

CREATE TRIGGER quotation_items_updated_at_trigger
  BEFORE UPDATE ON quotation_items
  FOR EACH ROW
  EXECUTE FUNCTION update_quotation_items_updated_at();

-- =====================================================
-- 7. Grant permissions
-- =====================================================

GRANT ALL ON quotations TO authenticated;
GRANT ALL ON quotation_items TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

-- Script completed successfully
SELECT 'Quotations tables created successfully!' AS status;

