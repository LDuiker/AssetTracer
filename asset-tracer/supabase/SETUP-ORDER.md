# Supabase Setup - Correct Order

⚠️ **IMPORTANT**: Run these scripts in order!

## Step 1: Create ALL Tables (FIRST!)
Run `complete-schema.sql` in Supabase SQL Editor

This creates:
- `organizations` table
- `users` table
- `clients` table
- `assets` table (with `status` column!)
- `invoices` table (with `status` column!)
- `invoice_items` table
- `transactions` table
- `expenses` table
- All indexes
- All RLS policies

## Step 2: Create Functions (SECOND!)
Run `functions.sql` in Supabase SQL Editor

This creates:
- `get_asset_financials()` function
- `get_monthly_pl()` function
- `get_financial_summary()` function
- `get_asset_roi_rankings()` function

## Quick Commands

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### 2. Navigate to SQL Editor
Click: **SQL Editor** in left sidebar

### 3. Run Schema Script
1. Create new query
2. Copy ALL of `complete-schema.sql`
3. Paste and click **Run**
4. Wait for success ✅
5. You should see: "✅ All tables created successfully!"

### 4. Run Functions Script
1. Create new query
2. Copy ALL of `functions.sql`
3. Paste and click **Run**
4. Wait for success ✅

## Verify Setup

Run this to check everything:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'organizations', 'users', 'clients', 'assets',
        'invoices', 'invoice_items', 'transactions', 'expenses'
    )
ORDER BY table_name;

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE 'get_%'
ORDER BY routine_name;
```

You should see:
- ✅ Tables: `assets`, `clients`, `expenses`, `invoice_items`, `invoices`, `organizations`, `transactions`, `users`
- ✅ Functions: `get_asset_financials`, `get_financial_summary`, `get_monthly_pl`, `get_asset_roi_rankings`

## Troubleshooting

### Error: "relation does not exist"
**Solution**: Run `complete-schema.sql` first

### Error: "column 'status' does not exist"  
**Solution**: Run `complete-schema.sql` first (creates assets & invoices with status columns)

### Error: "column 'date' does not exist"
**Solution**: The column is now called `transaction_date` (not `date`). Make sure you're using the latest `complete-schema.sql`

### Error: "function does not exist"
**Solution**: Run `functions.sql` after tables are created

### Error: "permission denied"
**Solution**: Make sure you're the database owner or have SUPERUSER role

## Test with Sample Data

After setup, insert test transaction:

```sql
INSERT INTO transactions (
    organization_id, 
    type, 
    category, 
    amount, 
    currency, 
    date, 
    description, 
    created_by
)
VALUES (
    'your-org-uuid',
    'income',
    'services',
    2500.00,
    'USD',
    CURRENT_DATE,
    'Test transaction',
    auth.uid()
);

-- Test function
SELECT * FROM get_financial_summary('your-org-uuid');
```

## Done! 🎉

Now you can use the financial functions in your app.

