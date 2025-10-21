-- =====================================================
-- Add Payment Link and Token Columns to Invoices
-- Add Default Currency to Organizations
-- =====================================================

-- Add default_currency to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS default_currency VARCHAR(3) DEFAULT 'USD';

COMMENT ON COLUMN organizations.default_currency IS 'Default currency for organization (3-letter ISO code)';

-- Add payment_link column to store DPO payment URL
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_link TEXT;

-- Add payment_token column to store DPO transaction token
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_token TEXT;

-- Add index for faster lookups by payment token
CREATE INDEX IF NOT EXISTS idx_invoices_payment_token 
ON invoices(payment_token) 
WHERE payment_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN invoices.payment_link IS 'DPO payment URL for customer to complete payment';
COMMENT ON COLUMN invoices.payment_token IS 'DPO transaction token for payment verification';

-- Verify the changes
SELECT 
  table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE (table_name = 'invoices' AND column_name IN ('payment_link', 'payment_token'))
   OR (table_name = 'organizations' AND column_name = 'default_currency')
ORDER BY table_name, column_name;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Payment columns added successfully!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Organizations table:';
  RAISE NOTICE '  - default_currency (VARCHAR(3), DEFAULT ''USD'')';
  RAISE NOTICE '';
  RAISE NOTICE 'Invoices table:';
  RAISE NOTICE '  - payment_link (TEXT)';
  RAISE NOTICE '  - payment_token (TEXT)';
  RAISE NOTICE '  - Index created on payment_token';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'You can now generate payment links for invoices!';
  RAISE NOTICE '================================================';
END $$;

