-- =====================================================
-- ADD ASSET_ID COLUMN TO INVOICE_ITEMS TABLE
-- =====================================================

-- Check if column already exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoice_items' 
  AND column_name = 'asset_id';

-- Add asset_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoice_items' 
    AND column_name = 'asset_id'
  ) THEN
    ALTER TABLE invoice_items 
    ADD COLUMN asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;
    
    -- Add index for better query performance
    CREATE INDEX IF NOT EXISTS idx_invoice_items_asset_id ON invoice_items(asset_id);
    
    RAISE NOTICE '✅ Added asset_id column to invoice_items table';
  ELSE
    RAISE NOTICE 'ℹ️ asset_id column already exists in invoice_items table';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invoice_items' 
  AND column_name = 'asset_id';

