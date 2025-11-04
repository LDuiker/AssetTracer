# Schema Comparison: Staging vs Production - Run Now

## Step 1: Run in STAGING

1. Go to **Staging Supabase Dashboard** → SQL Editor
2. Copy and paste the contents of `asset-tracer/supabase/COMPARE-SCHEMAS-STAGING-VS-PRODUCTION.sql`
3. Click "Run"
4. Copy ALL the results (all tabs/sections)
5. Save to a file: `staging-schema-results.txt`

## Step 2: Run in PRODUCTION

1. Go to **Production Supabase Dashboard** → SQL Editor
2. Copy and paste the SAME SQL script
3. Click "Run"
4. Copy ALL the results (all tabs/sections)
5. Save to a file: `production-schema-results.txt`

## Step 3: Quick Check - Critical Constraints

Before doing a full comparison, check these specific results:

### ✅ Expected Results (After Fixes)

#### For QUOTATIONS:
```
table_name  | indexname                                        | status
------------|--------------------------------------------------|------------------
QUOTATIONS  | quotations_organization_id_quotation_number_key  | ✅ PER-ORG (Correct)
```

#### For INVOICES:
```
table_name  | indexname                                     | status
------------|-----------------------------------------------|------------------
INVOICES    | invoices_organization_id_invoice_number_key   | ✅ PER-ORG (Correct)
```

### ❌ What You DON'T Want to See:
```
QUOTATIONS  | quotations_quotation_number_key  | ❌ GLOBAL (Wrong)
INVOICES    | invoices_invoice_number_key      | ❌ GLOBAL (Wrong)
```

## Step 4: Compare Results

### Option A: Manual Comparison
Open both files side by side and look for differences, especially:
- Part 3 (Critical Business Logic) - quotations and invoices
- Part 1 (Indexes) - should be identical
- Part 2 (Constraints) - should be identical

### Option B: Using Diff Tool
If you have a diff tool (VS Code, Beyond Compare, WinMerge):
1. Open both result files
2. Compare them
3. Look for any differences

### Option C: Quick PowerShell Check
```powershell
# Save this as compare-results.ps1
$staging = Get-Content "staging-schema-results.txt"
$production = Get-Content "production-schema-results.txt"

if (Compare-Object $staging $production) {
    Write-Host "⚠️ DIFFERENCES FOUND!" -ForegroundColor Red
    Compare-Object $staging $production | Format-Table
} else {
    Write-Host "✅ SCHEMAS MATCH PERFECTLY!" -ForegroundColor Green
}
```

## Step 5: Report Back

After running the comparison, let me know:
1. Do the critical constraints (quotations/invoices) show "✅ PER-ORG" in BOTH environments?
2. Are there any other differences between the two?
3. Paste the "Part 3: Critical Business Logic Constraints" results from both environments

## What We're Validating

After the fixes you applied, both environments should have:
- ✅ Quotations: `(organization_id, quotation_number)` unique constraint
- ✅ Invoices: `(organization_id, invoice_number)` unique constraint
- ✅ Same RLS policies
- ✅ Same table structures

If everything matches, you're good to go for future deployments!

