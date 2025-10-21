# Invoice Revenue Tracking Fix

## Problem
When marking invoices as paid, the revenue wasn't showing up on the asset detail page. The total revenue for assets linked to quotations/invoices remained at 0 even after payment.

## Root Cause
The asset detail page calculates revenue from **transactions** with `type='income'` and linked `asset_id`:

```typescript
financials.totalRevenue = transactions
  .filter(t => t.type === 'income')
  .reduce((sum, t) => sum + t.amount, 0);
```

However, the `markInvoiceAsPaid` function only updated the invoice status - it **didn't create any transaction records**. This meant:
- ❌ No revenue transactions were created
- ❌ Asset revenue remained at 0
- ❌ Financial reports showed incorrect data

## Solution
Modified `markInvoiceAsPaid` function to **automatically create income transactions** when an invoice is marked as paid.

### How It Works Now

**1. When Invoice is Marked as Paid:**
```typescript
export async function markInvoiceAsPaid(id, organizationId) {
  // Update invoice status
  // ... existing code ...

  // NEW: Create income transactions
  // Check if invoice was converted from quotation
  const quotation = await supabase
    .from('quotations')
    .select('quotation_items(asset_id, description, total)')
    .eq('converted_to_invoice_id', id);

  if (quotation && quotation.quotation_items) {
    // Create transaction for each item with asset link
    transactions = quotation_items.map(item => ({
      type: 'income',
      amount: item.total,
      asset_id: item.asset_id,  // ✅ Link to asset!
      invoice_id: id,
      // ... other fields
    }));
  } else {
    // Create single transaction without asset link
    transaction = {
      type: 'income',
      amount: invoice.total,
      invoice_id: id,
      // ... other fields
    };
  }
}
```

**2. Transaction Details:**
- **Type:** `income`
- **Category:** `invoice_payment`
- **Amount:** Item total (or full invoice total)
- **Asset Link:** From quotation items (if converted from quotation)
- **Client Link:** Invoice client
- **Invoice Link:** Invoice ID
- **Reference:** Invoice number

### Workflow Example

```
1. Create Quotation with Asset (e.g., Parrot Projector)
   ↓
2. Convert Quotation to Invoice
   ↓
3. Mark Invoice as Paid
   ↓
4. ✨ Transaction Created:
   - type: 'income'
   - asset_id: [Parrot Projector ID]
   - amount: [Invoice Total]
   ↓
5. Asset Detail Page Shows Revenue! ✅
```

## Files Changed

### `lib/db/invoices.ts`
**Function:** `markInvoiceAsPaid`
- Added logic to create income transactions
- Links transactions to assets via quotation items
- Handles both quotation-based and direct invoices
- Gracefully handles transaction creation errors (doesn't block payment)

## Testing

### Test Case 1: Invoice from Quotation with Asset
1. Create quotation with asset (e.g., "Parrot Projector")
2. Convert to invoice
3. Mark invoice as paid
4. Go to asset detail page
5. ✅ Revenue should show invoice amount

### Test Case 2: Direct Invoice (no quotation)
1. Create invoice directly (not from quotation)
2. Mark as paid
3. ✅ Transaction created (without asset link)
4. Revenue appears in financial reports

### Test Case 3: Verify Transactions
Check transactions table:
```sql
SELECT 
  t.id,
  t.type,
  t.category,
  t.amount,
  t.asset_id,
  t.invoice_id,
  t.description,
  a.name as asset_name
FROM transactions t
LEFT JOIN assets a ON t.asset_id = a.id
WHERE t.type = 'income'
  AND t.invoice_id IS NOT NULL
ORDER BY t.created_at DESC;
```

## Impact on Financial Calculations

### Asset Detail Page
**Before:**
```
Total Revenue: $0 (no transactions)
```

**After:**
```
Total Revenue: $1,500 (from paid invoices)
Profit/Loss: $1,500 - $800 = $700
ROI: 87.5%
```

### Financial Reports
- ✅ Income transactions appear in monthly P&L
- ✅ Revenue by asset shows correct amounts
- ✅ Time series data includes invoice payments

## Edge Cases Handled

1. **Invoice without quotation link:** Creates transaction without asset_id
2. **Transaction creation fails:** Logs warning but doesn't block payment
3. **Quotation with multiple items:** Creates separate transaction for each item
4. **Items without asset_id:** Transaction created with null asset_id

## Future Improvements

### Option 1: Add asset_id to invoice_items table
Currently, asset links are retrieved from quotations. Adding `asset_id` directly to `invoice_items` would:
- Allow direct invoices to link to assets
- Eliminate dependency on quotation linkage
- Simplify transaction creation

```sql
ALTER TABLE invoice_items 
ADD COLUMN asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;

CREATE INDEX idx_invoice_items_asset ON invoice_items(asset_id);
```

### Option 2: Batch transaction creation
For invoices with many items, batch insert could improve performance:
```typescript
const { error } = await supabase
  .from('transactions')
  .insert(transactions);  // Single batch insert
```

### Option 3: Transaction reversal
If invoice payment is reversed:
- Delete or mark transactions as reversed
- Update asset revenue calculations

## Related Systems

This fix affects:
- ✅ **Asset Detail Page** - Shows correct revenue
- ✅ **Financial Reports** - Includes invoice income
- ✅ **Dashboard Analytics** - Accurate revenue metrics
- ✅ **Transaction History** - Complete audit trail

## Migration Notes

**For Existing Paid Invoices:**
If you have invoices that were already paid before this fix, they won't have transactions. To backfill:

```sql
-- This is a one-time script to create transactions for existing paid invoices
-- Run in Supabase SQL Editor

INSERT INTO transactions (
  organization_id,
  type,
  category,
  amount,
  currency,
  transaction_date,
  description,
  reference_number,
  client_id,
  invoice_id,
  notes
)
SELECT 
  i.organization_id,
  'income',
  'invoice_payment',
  i.total,
  i.currency,
  i.payment_date,
  'Payment for invoice ' || i.invoice_number,
  i.invoice_number,
  i.client_id,
  i.id,
  'Backfilled transaction for paid invoice'
FROM invoices i
WHERE i.status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.invoice_id = i.id
  );
```

## Summary

- ✅ Fixed revenue tracking for assets
- ✅ Invoices now create income transactions when marked as paid
- ✅ Asset revenue calculations work correctly
- ✅ Financial reports show accurate data
- ✅ No breaking changes to existing functionality

