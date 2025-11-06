-- =====================================================
-- COMPLETE FIX - UPDATE QUOTATION_ITEMS AND CREATE TRANSACTIONS
-- =====================================================

-- STEP 1: Check if quotation_items have asset_id
SELECT 
  'STEP 1 - Quotation items asset_id check:' as step,
  COUNT(*) as total_items,
  COUNT(CASE WHEN asset_id IS NOT NULL THEN 1 END) as items_with_asset_id,
  COUNT(CASE WHEN asset_id IS NULL THEN 1 END) as items_without_asset_id
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
WHERE q.organization_id = '39423636-3463-421b-9009-b899f577997c'::uuid;

-- STEP 2: Show quotation_items that should have Dell laptop asset_id
-- (by matching description or checking if they're linked to invoices for Dell laptop)
SELECT 
  'STEP 2 - Quotation items to update:' as step,
  qi.id,
  qi.quotation_id,
  qi.asset_id,
  qi.description,
  qi.total,
  q.quotation_number,
  i.invoice_number,
  a.id as dell_laptop_id,
  a.name as asset_name
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id
LEFT JOIN assets a ON a.name ILIKE '%dell%laptop%' AND a.organization_id = COALESCE(i.organization_id, q.organization_id)
WHERE q.organization_id = '39423636-3463-421b-9009-b899f577997c'::uuid
  AND qi.asset_id IS NULL
ORDER BY q.created_at DESC
LIMIT 20;

-- STEP 3: Update quotation_items to link them to Dell laptop
-- This will link items that match Dell laptop by description or invoice
UPDATE quotation_items qi
SET asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
FROM quotations q
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id
WHERE qi.quotation_id = q.id
  AND q.organization_id = '39423636-3463-421b-9009-b899f577997c'::uuid
  AND qi.asset_id IS NULL
  AND (
    -- Match by description containing "dell" or "laptop"
    qi.description ILIKE '%dell%' 
    OR qi.description ILIKE '%laptop%'
    -- OR match invoices that should be linked to Dell laptop
    OR EXISTS (
      SELECT 1 FROM assets a 
      WHERE a.id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
        AND a.organization_id = COALESCE(i.organization_id, q.organization_id)
    )
  );

-- STEP 4: Verify quotation_items were updated
SELECT 
  'STEP 4 - After update:' as step,
  COUNT(*) as items_with_dell_laptop_asset_id
FROM quotation_items
WHERE asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- STEP 5: Create transactions directly from quotation_items
-- Use the asset's organization_id to avoid mismatches
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
  client_id,
  invoice_id,
  notes,
  created_by,
  created_at
)
SELECT DISTINCT
  a.organization_id,  -- Use asset's organization_id (most reliable)
  'income' as type,
  'invoice_payment' as category,
  qi.total as amount,
  COALESCE(i.currency, q.currency, 'USD') as currency,
  COALESCE(i.payment_date, i.issue_date, q.issue_date, CURRENT_DATE) as transaction_date,
  'Payment for ' || COALESCE(i.invoice_number, 'quotation ' || q.quotation_number) || ': ' || COALESCE(qi.description, 'Item') as description,
  COALESCE(i.invoice_number, q.quotation_number) as reference_number,
  COALESCE(i.payment_method, 'unspecified') as payment_method,
  qi.asset_id,
  COALESCE(i.client_id, q.client_id),
  i.id as invoice_id,
  'Created from quotation item' as notes,
  COALESCE(i.created_by, q.created_by),
  NOW()
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
INNER JOIN assets a ON a.id = qi.asset_id
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.asset_id = qi.asset_id
      AND t.organization_id = a.organization_id
      AND ABS(t.amount - qi.total) < 0.01
      AND (
        (t.invoice_id = i.id AND i.id IS NOT NULL)
        OR (t.reference_number = q.quotation_number AND i.id IS NULL)
      )
  );

-- STEP 6: Final verification
SELECT 
  'STEP 6 - Final check:' as step,
  COUNT(*) as transaction_count,
  SUM(amount) as total_revenue,
  organization_id
FROM transactions
WHERE asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND type = 'income'
GROUP BY organization_id;

