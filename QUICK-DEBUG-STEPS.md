# Quick Revenue/ROI Debugging Steps

## Step 1: Check Browser Console When Marking Invoice as Paid

1. Open browser DevTools (F12)
2. Go to the Console tab
3. Mark an invoice as paid
4. Look for these messages:
   - `✅ Created X transaction(s) with asset_id for invoice...` (GOOD - transactions created)
   - `⚠️ No transactions created: No items with asset_id found...` (PROBLEM - no asset_id found)
   - `Error creating transaction records:...` (PROBLEM - error occurred)
   - `ℹ️ Transactions already exist for invoice..., skipping creation` (INFO - already exists)

## Step 2: Check Asset Detail Page Console

1. Navigate to an asset detail page
2. Open browser DevTools (F12)
3. Go to the Console tab
4. Look for any errors related to:
   - Transactions fetching
   - Revenue calculation
   - API errors

## Step 3: Run SQL Queries in Supabase

### Query 1: Check if transactions exist for paid invoices
```sql
SELECT 
  i.invoice_number,
  i.status,
  i.total,
  COUNT(t.id) as transaction_count,
  STRING_AGG(DISTINCT t.asset_id::text, ', ') as asset_ids
FROM invoices i
LEFT JOIN transactions t ON t.invoice_id = i.id AND t.type = 'income'
WHERE i.status = 'paid'
GROUP BY i.id, i.invoice_number, i.status, i.total
ORDER BY i.payment_date DESC NULLS LAST
LIMIT 10;
```

### Query 2: Check transactions for a specific asset
```sql
-- Replace 'YOUR-ASSET-ID-HERE' with your actual asset ID
SELECT 
  a.name as asset_name,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_revenue,
  STRING_AGG(DISTINCT t.description, ' | ') as descriptions
FROM assets a
LEFT JOIN transactions t ON t.asset_id = a.id AND t.type = 'income'
WHERE a.id = 'YOUR-ASSET-ID-HERE'  -- Replace with actual asset ID
GROUP BY a.id, a.name;
```

### Query 3: Check if quotations have asset_id
```sql
SELECT 
  q.quotation_number,
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
ORDER BY i.payment_date DESC NULLS LAST
LIMIT 20;
```

## Step 4: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to an asset detail page
4. Look for the API call: `/api/transactions?asset_id=...`
5. Check the response:
   - Does it return transactions?
   - Do transactions have `asset_id`?
   - Do transactions have `amount`?
   - Are amounts numbers or strings?

## Step 5: Test the Fix

1. **If transactions don't exist:** Run `BACKFILL-ASSET-TRANSACTIONS.sql` in Supabase SQL Editor
2. **If transactions exist but no asset_id:** Check Query 3 above - do quotation_items have asset_id?
3. **If everything looks correct but revenue is still 0:** Check the Network tab response format

## What to Share

Please share:
1. ✅ Console logs when marking invoice as paid (Step 1)
2. ✅ Results of Query 2 for a specific asset (Step 3)
3. ✅ Network tab response for `/api/transactions?asset_id=...` (Step 4)
4. ✅ Any errors in the console (Step 2)

This will help identify exactly where the issue is!

