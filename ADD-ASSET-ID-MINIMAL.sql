-- Simple version: Just add the column
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_invoice_items_asset_id ON invoice_items(asset_id);

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoice_items' 
  AND column_name = 'asset_id';

