# Check Vercel Logs for Staging Errors

The staging site is showing 500 errors on:
- `/api/invoices` 
- `/api/quotations/[id]/convert-to-invoice`

## Steps to Check Logs:

### 1. Check Vercel Function Logs

1. Go to https://vercel.com/larona-duikers-projects/assettracer-staging
2. Click on **Logs** tab (or Runtime Logs)
3. Filter by:
   - **Path**: `/api/invoices` and `/api/quotations`
   - **Status**: 500 (Server Error)
   - **Time**: Last hour

### 2. Look for Error Details

The logs should show the actual error message, such as:
- `column "xxx" does not exist`
- `relation "xxx" does not exist`
- `permission denied for table xxx`
- `new row violates check constraint`

### 3. Common Issues to Check:

#### Missing Columns
If you see errors like:
```
ERROR: column "tax_total" does not exist
ERROR: column "currency" does not exist
ERROR: column "converted_to_invoice_id" does not exist
```

**Solution**: The `FIX-ALL-STAGING-SCHEMA-ISSUES.sql` script may not have run correctly. Try running it again.

#### RLS Policy Errors
If you see errors like:
```
ERROR: new row violates row-level security policy
ERROR: permission denied for table invoices
```

**Solution**: RLS policies might be too restrictive. Temporarily disable RLS to test:
```sql
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotations DISABLE ROW LEVEL SECURITY;
```

#### Foreign Key Errors
If you see errors like:
```
ERROR: insert or update on table "quotations" violates foreign key constraint
ERROR: null value in column "xxx" violates not-null constraint
```

**Solution**: Check that all required foreign keys exist and are valid.

### 4. Check Supabase Logs

1. Go to https://supabase.com/dashboard/project/ldomlpcofqyoynvlyvau
2. Click **Logs** → **Database**
3. Look for recent errors around the time you tried to:
   - Load invoices
   - Convert quotation to invoice

### 5. Test Directly in Supabase SQL Editor

Try running these queries manually:

```sql
-- Test fetching invoices
SELECT * FROM invoices LIMIT 1;

-- Test fetching quotations
SELECT * FROM quotations LIMIT 1;

-- Test the specific quotation
SELECT 
  id,
  quotation_number,
  status,
  currency,
  tax_total,
  converted_to_invoice_id,
  client_id
FROM quotations
WHERE id = 'b3e3c8d0-b0a9-4f2b-9d35-038efe3f327e';

-- Check if quotation items exist
SELECT * FROM quotation_items 
WHERE quotation_id = 'b3e3c8d0-b0a9-4f2b-9d35-038efe3f327e';
```

## What to Report Back

Please copy and paste:
1. Any error messages from Vercel logs
2. Any error messages from Supabase Database logs
3. The results of running `DIAGNOSE-STAGING-SCHEMA-NOW.sql`

This will help identify the exact issue causing the 500 errors.

