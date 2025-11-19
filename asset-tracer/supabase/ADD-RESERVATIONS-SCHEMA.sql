-- =====================================================
-- ASSET TRACER - SMART RESERVATIONS SCHEMA
-- =====================================================
-- This script creates the reservations system tables
-- Run this in Supabase SQL Editor (STAGING) to add reservations feature
-- =====================================================

-- =====================================================
-- 1. Reservations Table
-- =====================================================
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

-- =====================================================
-- 2. Reservation Assets Junction Table
-- =====================================================
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

-- =====================================================
-- 3. Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_reservations_organization ON reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_reserved_by ON reservations(reserved_by);
CREATE INDEX IF NOT EXISTS idx_reservation_assets_reservation ON reservation_assets(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_assets_asset ON reservation_assets(asset_id);

-- =====================================================
-- 4. RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_assets ENABLE ROW LEVEL SECURITY;

-- Reservations: Users can view reservations in their organization
CREATE POLICY "Users can view reservations in their organization"
  ON reservations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Reservations: Users can create reservations in their organization
CREATE POLICY "Users can create reservations in their organization"
  ON reservations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Reservations: Users can update reservations in their organization
CREATE POLICY "Users can update reservations in their organization"
  ON reservations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Reservations: Users can delete reservations in their organization
CREATE POLICY "Users can delete reservations in their organization"
  ON reservations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Reservation Assets: Users can view reservation assets in their organization
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

-- Reservation Assets: Users can create reservation assets in their organization
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

-- Reservation Assets: Users can update reservation assets in their organization
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

-- Reservation Assets: Users can delete reservation assets in their organization
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

-- =====================================================
-- 5. Helper Function: Check Asset Availability
-- =====================================================
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

-- =====================================================
-- 6. Trigger: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Verification Query
-- =====================================================
SELECT 
  'reservations' as table_name,
  COUNT(*) as row_count
FROM reservations
UNION ALL
SELECT 
  'reservation_assets' as table_name,
  COUNT(*) as row_count
FROM reservation_assets;

SELECT 
  'Schema created successfully!' as status,
  'Tables: reservations, reservation_assets' as tables,
  'Indexes and RLS policies applied' as features;

