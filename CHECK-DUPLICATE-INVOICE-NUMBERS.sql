-- Check for duplicate invoice numbers
SELECT 
  invoice_number,
  organization_id,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at) as invoice_ids,
  array_agg(created_at ORDER BY created_at) as created_dates
FROM invoices
GROUP BY invoice_number, organization_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, invoice_number;

-- Show all invoices with their numbers (to see the sequence)
SELECT 
  invoice_number,
  organization_id,
  created_at,
  id
FROM invoices
ORDER BY organization_id, created_at DESC
LIMIT 50;

