-- ============================================================================
-- CHECK INVOICE DATA - See if existing invoices have subject field
-- ============================================================================
-- Run this in your Supabase SQL Editor to see your actual invoice data
-- ============================================================================

-- Check if subject column exists and what data is in it
SELECT 
    id,
    invoice_number,
    subject,
    status,
    client_id,
    created_at
FROM invoices
ORDER BY created_at DESC
LIMIT 10;

-- Check how many invoices have a subject vs NULL
SELECT 
    COUNT(*) as total_invoices,
    COUNT(subject) as invoices_with_subject,
    COUNT(*) - COUNT(subject) as invoices_without_subject
FROM invoices;

-- Check invoice items
SELECT 
    i.invoice_number,
    COUNT(ii.id) as item_count
FROM invoices i
LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
GROUP BY i.id, i.invoice_number
ORDER BY i.created_at DESC
LIMIT 10;

