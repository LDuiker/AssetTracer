# Fixed: Policy Already Exists Error

## Problem
```
ERROR: 42710: policy "transactions_org_policy" for table "transactions" already exists
```

## Root Cause
Both scripts were creating the same RLS policies:
1. `CLEAN-AND-CREATE.sql` creates policies ✅
2. `functions.sql` tries to create them again ❌ Conflict!

## Solution
I commented out the RLS policy section in `functions.sql` since the policies are already created by `CLEAN-AND-CREATE.sql`.

## Now It Works! ✅

### Step 1: Run CLEAN-AND-CREATE.sql
Creates:
- ✅ All 8 tables
- ✅ All indexes
- ✅ **All RLS policies**

### Step 2: Run functions.sql
Creates:
- ✅ 4 database functions
- ❌ RLS policies (commented out - not needed!)

## Verify It Works

Run this in Supabase SQL Editor:

```sql
-- Check functions were created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE 'get_%'
ORDER BY routine_name;

-- Should return:
-- get_asset_financials
-- get_asset_roi_rankings
-- get_financial_summary
-- get_monthly_pl

-- Test a function
SELECT * FROM get_financial_summary('your-org-uuid');

-- Should work without errors!
```

## Files Updated

✅ `functions.sql` - RLS section now commented out  
✅ `START-HERE.md` - Added note about RLS policies

## All Fixed! 🎉

Now both scripts can run without conflicts.

