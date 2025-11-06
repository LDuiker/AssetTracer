-- =====================================================
-- ADD ASSET GROUPS SUPPORT
-- =====================================================
-- This adds the ability to create grouped assets
-- (e.g., "Cutlery Set - 24 pieces")
-- =====================================================

-- Step 1: Add asset_type column
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS asset_type TEXT DEFAULT 'individual' 
CHECK (asset_type IN ('individual', 'group'));

-- Step 2: Add parent_group_id for linking items to groups
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS parent_group_id UUID REFERENCES assets(id) ON DELETE SET NULL;

-- Step 3: Add quantity column (for groups: total items, for individuals: 1)
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 CHECK (quantity > 0);

-- Step 4: Add index for faster group queries
CREATE INDEX IF NOT EXISTS idx_assets_parent_group_id ON assets(parent_group_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON assets(asset_type);

-- Step 5: Update existing assets to be 'individual' type
UPDATE assets SET asset_type = 'individual' WHERE asset_type IS NULL;

-- Step 6: Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'assets' 
  AND column_name IN ('asset_type', 'parent_group_id', 'quantity')
ORDER BY column_name;

