-- =====================================================
-- DIRECT FIX: Check everything and create transactions
-- =====================================================

-- First, let's see what we actually have:

-- 1. Does the asset exist?
SELECT 'Asset exists?' as check_name, id, name, organization_id 
FROM assets 
WHERE id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- 2. Are there ANY quotation_items with this asset_id?
SELECT 'Quotation items with asset_id?' as check_name, 
  COUNT(*) as count,
  STRING_AGG(qi.id::text, ', ') as item_ids
FROM quotation_items qi
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- 3. Are those quotations linked to invoices?
SELECT 'Quotations linked to invoices?' as check_name,
  q.id as quotation_id,
  q.quotation_number,
  q.converted_to_invoice_id,
  i.id as invoice_id,
  i.invoice_number,
  i.status,
  i.organization_id
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
LEFT JOIN invoices i ON i.id = q.converted_to_invoice_id
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid;

-- 4. Are those invoices paid?
SELECT 'Are invoices paid?' as check_name,
  i.id,
  i.invoice_number,
  i.status,
  i.total,
  i.payment_date,
  i.organization_id
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
INNER JOIN invoices i ON i.id = q.converted_to_invoice_id
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid;

-- 5. CREATE transactions directly - even if invoice isn't marked paid
-- This will create transactions for ANY invoice linked to a quotation with this asset
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
  i.organization_id,
  'income' as type,
  'invoice_payment' as category,
  qi.total as amount,
  COALESCE(i.currency, 'USD') as currency,
  COALESCE(i.payment_date, i.issue_date, CURRENT_DATE) as transaction_date,
  'Payment for invoice ' || i.invoice_number || ': ' || COALESCE(qi.description, 'Item') as description,
  i.invoice_number as reference_number,
  COALESCE(i.payment_method, 'unspecified') as payment_method,
  qi.asset_id,
  i.client_id,
  i.id as invoice_id,
  'Created manually from quotation item' as notes,
  i.created_by,
  NOW()
FROM quotation_items qi
INNER JOIN quotations q ON q.id = qi.quotation_id
INNER JOIN invoices i ON i.id = q.converted_to_invoice_id
WHERE qi.asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND i.organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id 
      AND t.asset_id = qi.asset_id
      AND ABS(t.amount - qi.total) < 0.01
  );

-- 6. Verify
SELECT 'After creation:' as check_name,
  COUNT(*) as transaction_count,
  SUM(amount) as total_revenue
FROM transactions
WHERE asset_id = 'e2b90791-fce9-41b1-b3e9-90d0c98b2970'::uuid
  AND type = 'income'
  AND organization_id = '38f5f27c-743c-45bd-bdd2-2714b6990df0'::uuid;

