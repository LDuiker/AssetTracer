-- =====================================================
-- SIMPLE: Add asset_id to quotation_items
-- =====================================================

-- Step 1: Add the column
ALTER TABLE quotation_items 
ADD COLUMN asset_id UUID;

-- Step 2: Add foreign key constraint
ALTER TABLE quotation_items
ADD CONSTRAINT fk_quotation_items_asset
FOREIGN KEY (asset_id) 
REFERENCES assets(id) 
ON DELETE SET NULL;

-- Step 3: Add index for performance
CREATE INDEX idx_quotation_items_asset 
ON quotation_items(asset_id);

-- Step 4: Verify it was added
SELECT 'SUCCESS: asset_id column added to quotation_items' as result;

