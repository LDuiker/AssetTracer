# Fixed: Reserved Keyword Issue

## Problem
The column name `date` is a **reserved keyword** in PostgreSQL, causing errors:
```
ERROR: 42703: column "date" does not exist
```

## Solution
Renamed columns to avoid reserved keywords:

### Changes Made

#### Transactions Table
- ❌ `date` → ✅ `transaction_date`

#### Expenses Table  
- ❌ `date` → ✅ `expense_date`

## Files Updated

### 1. `supabase/tables-schema.sql`
- Updated `transactions` table schema
- Updated `expenses` table schema  
- Updated all indexes
- Updated sample INSERT statements

### 2. `supabase/functions.sql`
- Updated `get_asset_financials()` function
- Updated `get_monthly_pl()` function
- Updated `get_financial_summary()` function
- Updated all index definitions

### 3. `types/financial.ts`
- Updated `Transaction` interface
- Updated `Expense` interface

## Now Run These (In Order)

### Step 1: Create Tables
```sql
-- In Supabase SQL Editor
-- Copy and paste ALL of: supabase/tables-schema.sql
```

### Step 2: Create Functions
```sql
-- In Supabase SQL Editor  
-- Copy and paste ALL of: supabase/functions.sql
```

## Test It Works

```sql
-- Should return empty result (no errors!)
SELECT * FROM get_financial_summary('your-org-uuid');

-- Check table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- You should see transaction_date (not date)
```

## All Fixed! ✅

The scripts should now run without errors.

