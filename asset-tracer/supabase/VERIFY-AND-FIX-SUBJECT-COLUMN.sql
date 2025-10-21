-- ============================================================================
-- VERIFY AND FIX SUBJECT COLUMN IN INVOICES AND QUOTATIONS
-- ============================================================================
-- This script checks if the subject column exists and adds it if missing
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Check if subject column exists in invoices table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'subject'
    ) THEN
        -- Add subject column to invoices
        ALTER TABLE invoices ADD COLUMN subject TEXT;
        COMMENT ON COLUMN invoices.subject IS 'Subject or title of the invoice';
        RAISE NOTICE '✅ Added subject column to invoices table';
    ELSE
        RAISE NOTICE '✅ Subject column already exists in invoices table';
    END IF;
END $$;

-- Step 2: Check if subject column exists in quotations table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'quotations' 
        AND column_name = 'subject'
    ) THEN
        -- Add subject column to quotations
        ALTER TABLE quotations ADD COLUMN subject TEXT;
        COMMENT ON COLUMN quotations.subject IS 'Subject or title of the quotation';
        RAISE NOTICE '✅ Added subject column to quotations table';
    ELSE
        RAISE NOTICE '✅ Subject column already exists in quotations table';
    END IF;
END $$;

-- Step 3: Verify the columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('invoices', 'quotations')
AND column_name = 'subject'
ORDER BY table_name;

-- Step 4: Test query on invoices (should not error)
SELECT id, invoice_number, subject, status
FROM invoices
LIMIT 1;

-- Step 5: Test query on quotations (should not error)
SELECT id, quotation_number, subject, status
FROM quotations
LIMIT 1;

-- ============================================================================
-- FINAL MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ Subject column verification complete!';
    RAISE NOTICE '==================================================';
END $$;

