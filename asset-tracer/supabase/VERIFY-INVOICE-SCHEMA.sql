-- =====================================================
-- Verify Invoice Schema
-- =====================================================
-- Run this to check if subject column exists and invoice_items structure
-- =====================================================

-- Check invoices table columns
SELECT 
    'INVOICES TABLE COLUMNS' as check_type,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

-- Check invoice_items table columns
SELECT 
    'INVOICE_ITEMS TABLE COLUMNS' as check_type,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoice_items'
ORDER BY ordinal_position;

-- Check if subject column exists in invoices
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'subject'
        ) 
        THEN '✅ Subject column exists in invoices table'
        ELSE '❌ Subject column MISSING from invoices table'
    END as subject_check;

-- Check if description column exists in invoice_items
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'invoice_items' AND column_name = 'description'
        ) 
        THEN '✅ Description column exists in invoice_items table'
        ELSE '❌ Description column MISSING from invoice_items table'
    END as description_check;

-- Sample data check - show first 3 invoices with subject
SELECT 
    'SAMPLE INVOICES' as check_type,
    id,
    invoice_number,
    subject,
    created_at
FROM invoices
ORDER BY created_at DESC
LIMIT 3;

-- Sample data check - show first 5 invoice items with descriptions
SELECT 
    'SAMPLE INVOICE ITEMS' as check_type,
    id,
    invoice_id,
    description,
    quantity,
    unit_price
FROM invoice_items
ORDER BY created_at DESC
LIMIT 5;

