# Debug Revenue & ROI Calculation Issue

## Problem
Revenue and ROI are not calculating correctly on asset detail pages.

## Root Causes to Check

### 1. Check if Transactions Exist
Run this SQL query in Supabase SQL Editor to check if transactions exist for paid invoices:

```sql
-- Check paid invoices and their transactions
SELECT 
  i.invoice_number,
  i.status,
  i.total,
  i.payment_date,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_transactions,
  STRING_AGG(DISTINCT t.asset_id::text, ', ') as asset_ids
FROM invoices i
LEFT JOIN transactions t ON t.invoice_id = i.id AND t.type = 'income'
WHERE i.status = 'paid'
GROUP BY i.id, i.invoice_number, i.status, i.total, i.payment_date
ORDER BY i.payment_date DESC;
```

### 2. Check if Transactions Have Asset IDs
Run this to see if transactions are linked to assets:

```sql
-- Check transactions with asset_id
SELECT 
  t.id,
  t.amount,
  t.description,
  t.asset_id,
  a.name as asset_name,
  i.invoice_number
FROM transactions t
LEFT JOIN assets a ON a.id = t.asset_id
LEFT JOIN invoices i ON i.id = t.invoice_id
WHERE t.type = 'income'
  AND t.asset_id IS NOT NULL
ORDER BY t.transaction_date DESC;
```

### 3. Check Quotation to Invoice Links
Verify if quotations have asset_id and are linked to invoices:

```sql
-- Check quotations linked to paid invoices
SELECT 
  q.quotation_number,
  q.converted_to_invoice_id,
  i.invoice_number,
  i.status as invoice_status,
  qi.asset_id,
  a.name as asset_name,
  qi.total as item_total
FROM quotations q
INNER JOIN invoices i ON i.id = q.converted_to_invoice_id
INNER JOIN quotation_items qi ON qi.quotation_id = q.id
LEFT JOIN assets a ON a.id = qi.asset_id
WHERE i.status = 'paid'
ORDER BY i.payment_date DESC;
```

### 4. Check Asset Revenue Calculation
Check what the API is returning for a specific asset:

```sql
-- Replace 'YOUR-ASSET-ID-HERE' with actual asset ID
SELECT 
  a.name as asset_name,
  a.id as asset_id,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_revenue,
  STRING_AGG(DISTINCT t.description, ' | ') as transaction_descriptions
FROM assets a
LEFT JOIN transactions t ON t.asset_id = a.id AND t.type = 'income'
WHERE a.id = 'YOUR-ASSET-ID-HERE'  -- Replace with actual asset ID
GROUP BY a.id, a.name;
```

## Solutions

### Solution 1: Backfill Transactions for Existing Paid Invoices

If transactions don't exist for paid invoices, run the backfill script:

**File:** `BACKFILL-ASSET-TRANSACTIONS.sql`

This will:
1. Create transactions with `asset_id` for paid invoices from quotations
2. Create transactions without `asset_id` for paid invoices without quotation links
3. Skip invoices that already have transactions

### Solution 2: Re-mark Invoices as Paid

If transactions exist but don't have `asset_id`, you can:

1. **Option A:** Update the invoice status to something else, then mark it as paid again
2. **Option B:** Manually update transactions with asset_id using the backfill script

### Solution 3: Check Browser Console

After marking an invoice as paid, check the browser console for:
- `✅ Created X transaction(s) with asset_id for invoice...`
- `⚠️ No transactions created: No items with asset_id found...`
- `Error creating transaction records:...`

## Common Issues

### Issue 1: Invoice Not Created from Quotation
**Symptom:** Invoice was created directly, not from a quotation.

**Solution:** Transactions will be created without `asset_id`. You need to manually link invoice_items to assets (if invoice_items has asset_id column).

### Issue 2: Quotation Items Don't Have Asset ID
**Symptom:** Quotation exists but quotation_items don't have asset_id.

**Solution:** Update quotation_items to include asset_id:

```sql
-- Update quotation_items with asset_id
-- Replace 'YOUR-QUOTATION-ID' and 'YOUR-ASSET-ID' with actual IDs
UPDATE quotation_items
SET asset_id = 'YOUR-ASSET-ID'
WHERE quotation_id = 'YOUR-QUOTATION-ID'
  AND asset_id IS NULL;
```

### Issue 3: Transactions Already Exist Without Asset ID
**Symptom:** Transactions exist but asset_id is NULL.

**Solution:** Update existing transactions:

```sql
-- Update transactions with asset_id from quotation_items
UPDATE transactions t
SET asset_id = qi.asset_id
FROM invoices i
INNER JOIN quotations q ON q.converted_to_invoice_id = i.id
INNER JOIN quotation_items qi ON qi.quotation_id = q.id
WHERE t.invoice_id = i.id
  AND t.type = 'income'
  AND t.asset_id IS NULL
  AND qi.asset_id IS NOT NULL
  AND qi.total = t.amount;  -- Match by amount to ensure correct item
```

## Testing Steps

1. **Check if transactions exist:**
   - Run query #1 above
   - If no transactions, run backfill script

2. **Check if transactions have asset_id:**
   - Run query #2 above
   - If asset_id is NULL, run Solution 3 above

3. **Check asset revenue:**
   - Run query #4 above
   - Verify total_revenue matches expected amount

4. **Test in browser:**
   - Open asset detail page
   - Check browser console for errors
   - Verify revenue and ROI display correctly

## Next Steps

If the issue persists after running these diagnostics:

1. Share the results of queries #1, #2, and #4
2. Check browser console for any errors
3. Verify the invoice was created from a quotation with asset_id in quotation_items
4. Run the backfill script if transactions are missing

