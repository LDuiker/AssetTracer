# Fixed: Type Mismatch Error (integer vs bigint)

## Problem
```
ERROR: 42804: structure of query does not match function result type
DETAIL: Returned type bigint does not match expected type integer in column 13.
```

## Root Cause
In PostgreSQL, `COUNT(*)` returns **`bigint`**, not `integer`.

The functions were declared with `integer` for count columns, but the SQL queries return `bigint` from COUNT operations.

## Solution
Changed all count return types from `integer` to `bigint`:

### Fixed in get_asset_financials()
- ✅ `transaction_count` → Changed from `integer` to `bigint`

### Fixed in get_monthly_pl()
- ✅ `revenue_count` → Changed from `integer` to `bigint`
- ✅ `expense_count` → Changed from `integer` to `bigint`
- ✅ `transaction_count` → Changed from `integer` to `bigint`
- ✅ `invoices_paid_count` → Changed from `integer` to `bigint`

### Fixed in get_financial_summary()
- ✅ `total_assets_count` → Changed from `integer` to `bigint`

## Updated Files
✅ `supabase/functions.sql` - All 3 function return types fixed
✅ `lib/db/financials.ts` - Added comment about bigint

## Try Again Now! 🚀

1. **Re-run functions.sql**
   ```sql
   -- Copy and paste ALL of: supabase/functions.sql
   ```

2. **Test with your actual org ID**
   ```sql
   -- Replace with your actual UUID
   SELECT * FROM get_asset_financials('550e8400-e29b-41d4-a716-446655440000');
   SELECT * FROM get_financial_summary('550e8400-e29b-41d4-a716-446655440000');
   SELECT * FROM get_monthly_pl('550e8400-e29b-41d4-a716-446655440000', '2024-01-01', '2024-12-31');
   ```

3. **Should work now!** ✅

## Quick Test Script

```sql
-- Get your org ID
SELECT id, name FROM organizations ORDER BY created_at DESC LIMIT 1;

-- Test all functions (replace org_id)
\set org_id '550e8400-e29b-41d4-a716-446655440000'

SELECT * FROM get_asset_financials(:'org_id');
SELECT * FROM get_financial_summary(:'org_id');
SELECT * FROM get_monthly_pl(:'org_id', '2024-01-01', '2024-12-31');
SELECT * FROM get_asset_roi_rankings(:'org_id', 10);
```

## Why This Happens

PostgreSQL data types:
- `integer` → 32-bit signed integer (-2B to +2B)
- `bigint` → 64-bit signed integer (much larger range)

Aggregate functions like `COUNT()` return `bigint` to handle large datasets.

## All Fixed! ✅

The functions now properly match PostgreSQL's return types.

