-- =====================================================
-- Add Subject Fields to Quotations and Invoices
-- =====================================================
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add subject column to quotations table
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add comment
COMMENT ON COLUMN quotations.subject IS 'Subject/title of the quotation';

-- Add subject column to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add comment
COMMENT ON COLUMN invoices.subject IS 'Subject/title of the invoice';

-- Verify the changes
DO $$ 
BEGIN
    -- Check if columns were added
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotations' AND column_name = 'subject'
    ) THEN
        RAISE NOTICE '✅ Subject column added to quotations table';
    ELSE
        RAISE NOTICE '❌ Failed to add subject column to quotations table';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'subject'
    ) THEN
        RAISE NOTICE '✅ Subject column added to invoices table';
    ELSE
        RAISE NOTICE '❌ Failed to add subject column to invoices table';
    END IF;
END $$;

-- Success message
SELECT 
    'Subject fields added successfully!' as status,
    'Run this query to verify:' as next_step,
    'SELECT column_name, data_type FROM information_schema.columns WHERE table_name IN (''quotations'', ''invoices'') AND column_name = ''subject'';' as verification_query;

