# Fixed: Missing Status Column Error

## Problem
```
ERROR: 42703: column "status" does not exist
```

The functions query `assets.status` and `invoices.status`, but these tables don't exist yet or are missing the `status` column.

## Root Cause
You need to create **ALL required tables** before running the functions. The functions expect:
- `organizations` table
- `users` table  
- `clients` table
- **`assets` table with `status` column**
- **`invoices` table with `status` column**
- `invoice_items` table
- `transactions` table
- `expenses` table

## Solution
I created `complete-schema.sql` with **ALL 8 tables** needed!

## How to Fix (Right Now!)

### Step 1: Drop Functions (if already created)
```sql
-- Run in Supabase SQL Editor
DROP FUNCTION IF EXISTS get_asset_financials(uuid);
DROP FUNCTION IF EXISTS get_monthly_pl(uuid, date, date);
DROP FUNCTION IF EXISTS get_financial_summary(uuid);
DROP FUNCTION IF EXISTS get_asset_roi_rankings(uuid, integer);
```

### Step 2: Run Complete Schema
1. Open **Supabase SQL Editor**
2. Copy **ALL** of `supabase/complete-schema.sql`
3. Paste and click **Run**
4. You should see: ✅ "All tables created successfully!"

### Step 3: Run Functions
1. Create new query
2. Copy **ALL** of `supabase/functions.sql`
3. Paste and click **Run**
4. Success! ✅

## What Was Created

### ✅ 8 Tables
1. `organizations` - Company/org data
2. `users` - User accounts (linked to Supabase auth)
3. `clients` - Customers/clients
4. `assets` - Asset inventory (**with status column!**)
5. `invoices` - Billing/invoices (**with status column!**)
6. `invoice_items` - Invoice line items
7. `transactions` - Financial transactions
8. `expenses` - Business expenses

### ✅ Status Columns
- `assets.status` → `'active' | 'maintenance' | 'retired' | 'sold'`
- `invoices.status` → `'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'`
- `expenses.status` → `'pending' | 'approved' | 'rejected' | 'paid'`

### ✅ Indexes (30+)
Performance indexes on all tables for fast queries

### ✅ RLS Policies
Row Level Security enabled on all tables

## Verify It Worked

```sql
-- Check assets table has status column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assets' AND column_name = 'status';

-- Check invoices table has status column  
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'invoices' AND column_name = 'status';

-- Test the function
SELECT * FROM get_financial_summary('your-org-uuid');
```

## Files to Use

| File | Purpose | When to Run |
|------|---------|-------------|
| `complete-schema.sql` | Creates ALL tables | **FIRST** |
| `functions.sql` | Creates 4 functions | **SECOND** |

## All Fixed! ✅

The complete schema now includes:
- ✅ All 8 required tables
- ✅ Status columns in assets & invoices
- ✅ transaction_date (not date)
- ✅ All foreign keys
- ✅ All indexes
- ✅ All RLS policies

Run the scripts and you're good to go! 🚀

