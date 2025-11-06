-- =====================================================
-- ULTIMATE DIAGNOSTIC - CHECK EVERYTHING
-- =====================================================

-- DIAG 1: Does the asset exist?
SELECT 'DIAG 1 - Asset:' as diag, id, name, organization_id FROM assets WHERE id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- DIAG 2: Do quotation_items exist with this asset_id?
SELECT 'DIAG 2 - Quotation items with asset_id:' as diag, COUNT(*) as count FROM quotation_items WHERE asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- DIAG 3: Show ALL quotation_items (to see if asset_id is NULL)
SELECT 'DIAG 3 - All quotation items:' as diag, qi.id, qi.quotation_id, qi.asset_id, qi.total, q.quotation_number, q.organization_id 
FROM quotation_items qi 
INNER JOIN quotations q ON q.id = qi.quotation_id 
ORDER BY q.created_at DESC 
LIMIT 10;

-- DIAG 4: Are quotations linked to invoices?
SELECT 'DIAG 4 - Quotations to invoices:' as diag, q.id, q.quotation_number, q.converted_to_invoice_id, i.id as invoice_id, i.invoice_number, i.status 
FROM quotations q 
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id 
ORDER BY q.created_at DESC 
LIMIT 10;

-- DIAG 5: Do ANY transactions exist anywhere?
SELECT 'DIAG 5 - All transactions:' as diag, COUNT(*) as total, COUNT(CASE WHEN asset_id IS NOT NULL THEN 1 END) as with_asset_id FROM transactions;

-- DIAG 6: What happens when we try to create a transaction manually?
-- Let's create one transaction directly to test
INSERT INTO transactions (
  organization_id,
  type,
  category,
  amount,
  currency,
  transaction_date,
  description,
  reference_number,
  payment_method,
  asset_id,
  notes,
  created_at
)
VALUES (
  (SELECT organization_id FROM assets WHERE id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid),
  'income',
  'test',
  525.00,
  'USD',
  CURRENT_DATE,
  'Test transaction for Dell laptop',
  'TEST-001',
  'manual',
  'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid,
  'Manual test transaction',
  NOW()
)
ON CONFLICT DO NOTHING
RETURNING id, amount, asset_id, organization_id;

-- DIAG 7: Verify the test transaction
SELECT 'DIAG 7 - Test transaction created:' as diag, COUNT(*) as count, SUM(amount) as total 
FROM transactions 
WHERE asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid 
  AND type = 'income'
  AND notes = 'Manual test transaction';

