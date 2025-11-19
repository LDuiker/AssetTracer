-- =====================================================
-- Asset Kits Schema
-- Allows users to create bundles/kits of multiple assets
-- for easier reservation management
-- =====================================================

-- =====================================================
-- 1. Asset Kits Table
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE asset_kits IS 'Pre-configured bundles of assets that can be reserved together';

-- =====================================================
-- 2. Asset Kit Items Table (Junction Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_kit_items (
  kit_id UUID NOT NULL REFERENCES asset_kits(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  PRIMARY KEY (kit_id, asset_id)
);

COMMENT ON TABLE asset_kit_items IS 'Links assets to specific kits with quantities';

-- =====================================================
-- 3. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS for asset_kits table
ALTER TABLE asset_kits ENABLE ROW LEVEL SECURITY;

-- Asset Kits: Users can view kits in their organization
CREATE POLICY "Users can view kits in their organization"
  ON asset_kits FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Asset Kits: Users can create kits in their organization
CREATE POLICY "Users can create kits in their organization"
  ON asset_kits FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Asset Kits: Users can update kits in their organization
CREATE POLICY "Users can update kits in their organization"
  ON asset_kits FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Asset Kits: Users can delete kits in their organization
CREATE POLICY "Users can delete kits in their organization"
  ON asset_kits FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Enable RLS for asset_kit_items table
ALTER TABLE asset_kit_items ENABLE ROW LEVEL SECURITY;

-- Asset Kit Items: Users can view kit items in their organization
CREATE POLICY "Users can view kit items in their organization"
  ON asset_kit_items FOR SELECT
  USING (
    kit_id IN (
      SELECT id FROM asset_kits 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Asset Kit Items: Users can insert kit items in their organization
CREATE POLICY "Users can insert kit items in their organization"
  ON asset_kit_items FOR INSERT
  WITH CHECK (
    kit_id IN (
      SELECT id FROM asset_kits 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Asset Kit Items: Users can update kit items in their organization
CREATE POLICY "Users can update kit items in their organization"
  ON asset_kit_items FOR UPDATE
  USING (
    kit_id IN (
      SELECT id FROM asset_kits 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Asset Kit Items: Users can delete kit items in their organization
CREATE POLICY "Users can delete kit items in their organization"
  ON asset_kit_items FOR DELETE
  USING (
    kit_id IN (
      SELECT id FROM asset_kits 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- 4. Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_asset_kits_organization_id ON asset_kits(organization_id);
CREATE INDEX IF NOT EXISTS idx_asset_kits_created_by ON asset_kits(created_by);
CREATE INDEX IF NOT EXISTS idx_asset_kit_items_kit_id ON asset_kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_asset_kit_items_asset_id ON asset_kit_items(asset_id);

-- =====================================================
-- 5. Trigger: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_asset_kits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to asset_kits table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_asset_kits_updated_at') THEN
    CREATE TRIGGER set_asset_kits_updated_at
    BEFORE UPDATE ON asset_kits
    FOR EACH ROW
    EXECUTE FUNCTION update_asset_kits_updated_at();
    RAISE NOTICE '✅ Created trigger set_asset_kits_updated_at for asset_kits table';
  ELSE
    RAISE NOTICE 'ℹ️ Trigger set_asset_kits_updated_at already exists for asset_kits table';
  END IF;
END $$;

