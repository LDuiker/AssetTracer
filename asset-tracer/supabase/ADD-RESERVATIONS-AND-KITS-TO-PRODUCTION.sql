-- =====================================================
-- MIGRATION: Reservations & Asset Kits
-- =====================================================
-- This script adds the reservations and asset kits features
-- to the database (works for both STAGING and PRODUCTION)
-- 
-- ⚠️ IMPORTANT: Run this in Supabase SQL Editor
-- Staging Project: ougntjrrskfsuognjmcw
-- Production Project: ftelnmursmitpjwjbyrw
-- =====================================================

-- =====================================================
-- PART 1: RESERVATIONS SCHEMA
-- =====================================================

-- 1. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Reservation Details
  title TEXT NOT NULL,
  project_name TEXT,
  description TEXT,
  
  -- Time Period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  
  -- Location
  location TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  
  -- Who/What
  reserved_by UUID REFERENCES users(id),
  team_members UUID[],
  
  -- Metadata
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE reservations IS 'Equipment reservations for projects and productions';

-- 2. Reservation Assets Junction Table
CREATE TABLE IF NOT EXISTS reservation_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
  
  -- Optional: Track actual usage
  checked_out_at TIMESTAMP,
  checked_in_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(reservation_id, asset_id)
);

COMMENT ON TABLE reservation_assets IS 'Many-to-many relationship between reservations and assets';

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_reservations_organization ON reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_reserved_by ON reservations(reserved_by);
CREATE INDEX IF NOT EXISTS idx_reservation_assets_reservation ON reservation_assets(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_assets_asset ON reservation_assets(asset_id);

-- 4. RLS Policies for Reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view reservations in their organization" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations in their organization" ON reservations;
DROP POLICY IF EXISTS "Users can update reservations in their organization" ON reservations;
DROP POLICY IF EXISTS "Users can delete reservations in their organization" ON reservations;

-- Create policies
CREATE POLICY "Users can view reservations in their organization"
  ON reservations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create reservations in their organization"
  ON reservations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update reservations in their organization"
  ON reservations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reservations in their organization"
  ON reservations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 5. RLS Policies for Reservation Assets
ALTER TABLE reservation_assets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view reservation assets in their organization" ON reservation_assets;
DROP POLICY IF EXISTS "Users can create reservation assets in their organization" ON reservation_assets;
DROP POLICY IF EXISTS "Users can update reservation assets in their organization" ON reservation_assets;
DROP POLICY IF EXISTS "Users can delete reservation assets in their organization" ON reservation_assets;

-- Create policies
CREATE POLICY "Users can view reservation assets in their organization"
  ON reservation_assets FOR SELECT
  USING (
    reservation_id IN (
      SELECT id FROM reservations 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create reservation assets in their organization"
  ON reservation_assets FOR INSERT
  WITH CHECK (
    reservation_id IN (
      SELECT id FROM reservations 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update reservation assets in their organization"
  ON reservation_assets FOR UPDATE
  USING (
    reservation_id IN (
      SELECT id FROM reservations 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete reservation assets in their organization"
  ON reservation_assets FOR DELETE
  USING (
    reservation_id IN (
      SELECT id FROM reservations 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- 6. Helper Function: Check Asset Availability
CREATE OR REPLACE FUNCTION check_asset_availability(
  p_asset_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_conflicts JSONB;
  v_conflict_count INTEGER;
BEGIN
  WITH asset_conflicts AS (
    SELECT 
      r.id as reservation_id,
      r.title,
      r.start_date,
      r.end_date,
      r.status
    FROM reservation_assets ra
    JOIN reservations r ON ra.reservation_id = r.id
    WHERE ra.asset_id = p_asset_id
      AND r.status IN ('pending', 'confirmed', 'active')
      AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
      AND (
        (r.start_date <= p_end_date AND r.end_date >= p_start_date)
      )
  )
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'reservation_id', reservation_id,
        'title', title,
        'start_date', start_date,
        'end_date', end_date,
        'status', status
      )
    ), '[]'::jsonb)
  INTO v_conflict_count, v_conflicts
  FROM asset_conflicts;
  
  RETURN jsonb_build_object(
    'is_available', v_conflict_count = 0,
    'conflict_count', v_conflict_count,
    'conflicts', v_conflicts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_asset_availability IS 'Checks if an asset is available for the given date range';

-- 7. Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 2: ASSET KITS SCHEMA
-- =====================================================

-- 1. Asset Kits Table
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

-- 2. Asset Kit Items Table (Junction Table)
CREATE TABLE IF NOT EXISTS asset_kit_items (
  kit_id UUID NOT NULL REFERENCES asset_kits(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  PRIMARY KEY (kit_id, asset_id)
);

COMMENT ON TABLE asset_kit_items IS 'Links assets to specific kits with quantities';

-- 3. RLS Policies for Asset Kits
ALTER TABLE asset_kits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view kits in their organization" ON asset_kits;
DROP POLICY IF EXISTS "Users can create kits in their organization" ON asset_kits;
DROP POLICY IF EXISTS "Users can update kits in their organization" ON asset_kits;
DROP POLICY IF EXISTS "Users can delete kits in their organization" ON asset_kits;

-- Create policies
CREATE POLICY "Users can view kits in their organization"
  ON asset_kits FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create kits in their organization"
  ON asset_kits FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update kits in their organization"
  ON asset_kits FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete kits in their organization"
  ON asset_kits FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- 4. RLS Policies for Asset Kit Items
ALTER TABLE asset_kit_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view kit items in their organization" ON asset_kit_items;
DROP POLICY IF EXISTS "Users can insert kit items in their organization" ON asset_kit_items;
DROP POLICY IF EXISTS "Users can update kit items in their organization" ON asset_kit_items;
DROP POLICY IF EXISTS "Users can delete kit items in their organization" ON asset_kit_items;

-- Create policies
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

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_asset_kits_organization_id ON asset_kits(organization_id);
CREATE INDEX IF NOT EXISTS idx_asset_kits_created_by ON asset_kits(created_by);
CREATE INDEX IF NOT EXISTS idx_asset_kit_items_kit_id ON asset_kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_asset_kit_items_asset_id ON asset_kit_items(asset_id);

-- 6. Trigger: Update updated_at timestamp for asset_kits
CREATE OR REPLACE FUNCTION update_asset_kits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS set_asset_kits_updated_at ON asset_kits;

CREATE TRIGGER set_asset_kits_updated_at
  BEFORE UPDATE ON asset_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_kits_updated_at();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check tables exist
SELECT 
  'reservations' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'reservation_assets' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservation_assets') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'asset_kits' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'asset_kits') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'asset_kit_items' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'asset_kit_items') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- Check function exists
SELECT 
  'check_asset_availability' as function_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_asset_availability') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- Final success message
SELECT 
  '✅ PRODUCTION MIGRATION COMPLETE!' as status,
  'Reservations and Asset Kits schemas have been applied to production' as message,
  NOW() as applied_at;

