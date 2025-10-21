-- =====================================================
-- Add Default Notes and Terms to Organizations
-- =====================================================
-- This adds fields for default notes and terms that will
-- auto-populate on new invoices and quotations
-- =====================================================

-- Add default notes and terms columns
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS default_notes TEXT,
ADD COLUMN IF NOT EXISTS invoice_terms TEXT DEFAULT 'Payment due within 30 days. Late payments may incur additional charges.',
ADD COLUMN IF NOT EXISTS quotation_terms TEXT DEFAULT 'This quotation is valid for 30 days from the date of issue. Prices are subject to change after this period.';

-- Add comment for documentation
COMMENT ON COLUMN organizations.default_notes IS 'Default notes that appear on both invoices and quotations';
COMMENT ON COLUMN organizations.invoice_terms IS 'Default terms and conditions for invoices';
COMMENT ON COLUMN organizations.quotation_terms IS 'Default terms and conditions for quotations';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('default_notes', 'invoice_terms', 'quotation_terms')
ORDER BY column_name;

