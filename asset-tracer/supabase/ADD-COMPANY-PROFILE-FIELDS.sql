-- =====================================================
-- Add Company Profile Fields to Organizations Table
-- =====================================================
-- This script adds company profile fields for PDF generation
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add company profile columns
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_city TEXT,
ADD COLUMN IF NOT EXISTS company_state TEXT,
ADD COLUMN IF NOT EXISTS company_postal_code TEXT,
ADD COLUMN IF NOT EXISTS company_country TEXT,
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT;

-- Add comments for documentation
COMMENT ON COLUMN organizations.company_email IS 'Company contact email for invoices/quotations';
COMMENT ON COLUMN organizations.company_phone IS 'Company contact phone number';
COMMENT ON COLUMN organizations.company_address IS 'Company street address';
COMMENT ON COLUMN organizations.company_city IS 'Company city';
COMMENT ON COLUMN organizations.company_state IS 'Company state/province';
COMMENT ON COLUMN organizations.company_postal_code IS 'Company postal/ZIP code';
COMMENT ON COLUMN organizations.company_country IS 'Company country';
COMMENT ON COLUMN organizations.company_logo_url IS 'URL to company logo image';
COMMENT ON COLUMN organizations.company_website IS 'Company website URL';

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name LIKE 'company_%'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Company profile fields added to organizations table';
    RAISE NOTICE 'Fields: company_email, company_phone, company_address, company_city,';
    RAISE NOTICE '        company_state, company_postal_code, company_country,';
    RAISE NOTICE '        company_logo_url, company_website';
END $$;

