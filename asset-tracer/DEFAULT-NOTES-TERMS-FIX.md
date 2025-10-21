# Default Notes and Terms Fix

## Problem
The payment terms and notes saved in the Settings page were not appearing when creating new invoices and quotations.

## Root Cause
The issue had two parts:
1. **API Missing Fields**: The organization settings API route was not handling the `default_notes`, `invoice_terms`, and `quotation_terms` fields
2. **Async Loading**: The form components were trying to load defaults before the organization data was fetched

## What Was Fixed

### 1. API Route Updates (`app/api/organization/settings/route.ts`)
- ✅ Added `default_notes`, `invoice_terms`, `quotation_terms` to validation schema
- ✅ Added these fields to GET response
- ✅ Added these fields to PATCH (save) logic

### 2. Form Component Updates
- ✅ **InvoiceForm.tsx**: Added `useEffect` to load default notes and invoice terms when org data loads
- ✅ **QuotationForm.tsx**: Added `useEffect` to load default notes and quotation terms when org data loads

### 3. Database Migration
Created verification script: `supabase/VERIFY-DEFAULT-NOTES-COLUMNS.sql`

## Setup Required

### Step 1: Run Database Migration

The database columns need to exist for this feature to work. Run this SQL in your **Supabase SQL Editor**:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open and run: `asset-tracer/supabase/VERIFY-DEFAULT-NOTES-COLUMNS.sql`

This will:
- Check if columns exist
- Add them if they don't exist
- Verify the changes

### Step 2: Test the Feature

1. **Save Default Values**:
   - Go to Settings → Organization tab
   - Scroll to "Document Defaults" section
   - Fill in:
     - Default Notes
     - Invoice Terms & Conditions
     - Quotation Terms & Conditions
   - Click "Save Changes"

2. **Test New Invoice**:
   - Go to Invoices → Create New Invoice
   - The Notes and Terms fields should auto-populate with your saved defaults
   - You can still edit them per invoice

3. **Test New Quotation**:
   - Go to Quotations → Create New Quotation
   - The Notes and Terms fields should auto-populate with your saved defaults
   - You can still edit them per quotation

## How It Works Now

1. When you open the new invoice/quotation form, it starts with empty fields
2. The form fetches organization settings in the background
3. When settings load (usually < 1 second), the default notes and terms automatically populate
4. Users can still override these defaults on a per-document basis
5. When editing existing documents, it uses the saved values from those documents

## Files Changed

- `app/api/organization/settings/route.ts` - Added field handling
- `components/invoices/InvoiceForm.tsx` - Added auto-populate logic
- `components/quotations/QuotationForm.tsx` - Added auto-populate logic
- `supabase/VERIFY-DEFAULT-NOTES-COLUMNS.sql` - Created verification script (NEW)
- `DEFAULT-NOTES-TERMS-FIX.md` - This documentation (NEW)

## Notes

- The migration uses `ADD COLUMN IF NOT EXISTS` so it's safe to run multiple times
- Default values are only applied to NEW documents, not when editing existing ones
- Each document type (invoice/quotation) has its own terms field
- The default_notes field is shared between both document types

