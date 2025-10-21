-- =====================================================
-- ADD ORGANIZATION SETTINGS COLUMNS
-- =====================================================
-- This script adds settings columns to the organizations table
-- Run this to enable organization-level preferences
-- =====================================================

-- Add default_currency column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'default_currency'
    ) THEN
        ALTER TABLE organizations ADD COLUMN default_currency TEXT DEFAULT 'USD';
        COMMENT ON COLUMN organizations.default_currency IS 'Default currency for invoices and reports';
        RAISE NOTICE '✅ Added default_currency column';
    ELSE
        RAISE NOTICE 'ℹ️ default_currency column already exists';
    END IF;
END $$;

-- Add default_tax_rate column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'default_tax_rate'
    ) THEN
        ALTER TABLE organizations ADD COLUMN default_tax_rate NUMERIC(5,2) DEFAULT 0;
        COMMENT ON COLUMN organizations.default_tax_rate IS 'Default tax rate percentage';
        RAISE NOTICE '✅ Added default_tax_rate column';
    ELSE
        RAISE NOTICE 'ℹ️ default_tax_rate column already exists';
    END IF;
END $$;

-- Add timezone column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'timezone'
    ) THEN
        ALTER TABLE organizations ADD COLUMN timezone TEXT DEFAULT 'America/New_York';
        COMMENT ON COLUMN organizations.timezone IS 'Organization timezone';
        RAISE NOTICE '✅ Added timezone column';
    ELSE
        RAISE NOTICE 'ℹ️ timezone column already exists';
    END IF;
END $$;

-- Add date_format column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'date_format'
    ) THEN
        ALTER TABLE organizations ADD COLUMN date_format TEXT DEFAULT 'MM/DD/YYYY';
        COMMENT ON COLUMN organizations.date_format IS 'Preferred date format';
        RAISE NOTICE '✅ Added date_format column';
    ELSE
        RAISE NOTICE 'ℹ️ date_format column already exists';
    END IF;
END $$;

-- Verify all columns were added
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY ordinal_position;

-- =====================================================
-- RLS POLICIES FOR ORGANIZATION ACCESS
-- =====================================================

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "organizations_select_own" ON organizations;
DROP POLICY IF EXISTS "organizations_update_own" ON organizations;

-- Policy: Users can read their own organization
CREATE POLICY "organizations_select_own" ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can update their own organization
CREATE POLICY "organizations_update_own" ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'organizations'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Organization settings columns added successfully!';
    RAISE NOTICE '✅ RLS policies created for organization access';
    RAISE NOTICE 'ℹ️ You can now save organization preferences in Settings';
END $$;

