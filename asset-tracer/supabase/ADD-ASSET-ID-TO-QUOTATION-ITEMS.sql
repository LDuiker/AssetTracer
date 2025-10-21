-- =====================================================
-- ADD ASSET_ID COLUMN TO QUOTATION_ITEMS
-- =====================================================
-- This migration adds the asset_id column to quotation_items
-- to support linking quotation items to assets
-- =====================================================

-- Add asset_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotation_items' 
    AND column_name = 'asset_id'
  ) THEN
    ALTER TABLE quotation_items 
    ADD COLUMN asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;
    
    -- Add index for performance
    CREATE INDEX idx_quotation_items_asset ON quotation_items(asset_id);
    
    RAISE NOTICE 'Successfully added asset_id column to quotation_items';
  ELSE
    RAISE NOTICE 'Column asset_id already exists in quotation_items';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quotation_items'
  AND column_name = 'asset_id';

