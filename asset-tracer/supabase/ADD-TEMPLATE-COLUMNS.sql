-- =====================================================
-- Add Template Columns to Organizations Table
-- =====================================================
-- This adds invoice_template and quotation_template columns
-- that are used for PDF generation preferences
-- =====================================================

-- Add invoice_template column
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS invoice_template TEXT DEFAULT 'classic'
CHECK (invoice_template IN ('classic', 'compact'));

-- Add quotation_template column
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS quotation_template TEXT DEFAULT 'classic'
CHECK (quotation_template IN ('classic', 'compact'));

-- Add comments for documentation
COMMENT ON COLUMN organizations.invoice_template IS 'Invoice PDF template style: classic or compact';
COMMENT ON COLUMN organizations.quotation_template IS 'Quotation PDF template style: classic or compact';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('invoice_template', 'quotation_template')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Template columns added successfully!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Columns added:';
  RAISE NOTICE '  - invoice_template (default: classic)';
  RAISE NOTICE '  - quotation_template (default: classic)';
  RAISE NOTICE '';
  RAISE NOTICE 'Valid values: classic, compact';
  RAISE NOTICE '';
END $$;
