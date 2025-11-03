-- Add document template preference columns to organizations table
-- These columns store the selected template ID for invoices and quotations

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS invoice_template TEXT DEFAULT 'classic' CHECK (invoice_template IN ('classic', 'compact')),
ADD COLUMN IF NOT EXISTS quotation_template TEXT DEFAULT 'classic' CHECK (quotation_template IN ('classic', 'compact'));

-- Add comments to explain the columns
COMMENT ON COLUMN organizations.invoice_template IS 'Invoice PDF template preference: classic or compact';
COMMENT ON COLUMN organizations.quotation_template IS 'Quotation PDF template preference: classic or compact';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('invoice_template', 'quotation_template');

