# Document Defaults Feature - Setup Guide

## Overview
Added ability to set default notes and terms & conditions for invoices and quotations in organization settings.

## What Was Added

### 1. Database Changes (`ADD-DEFAULT-NOTES-AND-TERMS.sql`)
Three new columns added to the `organizations` table:
- `default_notes` - Default notes for both invoices and quotations
- `invoice_terms` - Default terms & conditions for invoices
- `quotation_terms` - Default terms & conditions for quotations

### 2. Settings Page Updates
Added new "Document Defaults" section in Organization Settings with:
- **Default Notes** textarea - Appears on both invoices and quotations
- **Invoice Terms & Conditions** textarea - Appears only on invoices
- **Quotation Terms & Conditions** textarea - Appears only on quotations

### 3. Form Updates
- **InvoiceForm**: Now uses `default_notes` and `invoice_terms` from organization settings
- **QuotationForm**: Now uses `default_notes` and `quotation_terms` from organization settings

## Setup Instructions

### Step 1: Run the Database Migration

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to "SQL Editor"
4. Click "New query"
5. Copy and paste the contents of `ADD-DEFAULT-NOTES-AND-TERMS.sql`
6. Click "Run" or press `Ctrl+Enter`

### Step 2: Verify the Setup

```sql
-- Verify columns were added
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('default_notes', 'invoice_terms', 'quotation_terms');
```

### Step 3: Set Your Defaults

1. Navigate to `/settings` in your application
2. Go to the "Organization" tab
3. Scroll down to "Document Defaults" section
4. Fill in your default notes and terms
5. Click "Save Changes"

## How It Works

### For New Invoices
1. User clicks "Create Invoice"
2. Form automatically populates:
   - Notes field with `organization.default_notes`
   - Terms field with `organization.invoice_terms`
3. User can edit these per invoice before saving

### For New Quotations
1. User clicks "Create Quotation"
2. Form automatically populates:
   - Notes field with `organization.default_notes`
   - Terms field with `organization.quotation_terms`
3. User can edit these per quotation before saving

### For Existing Documents
- Existing invoices and quotations keep their current notes and terms
- Only new documents will use the defaults

## Default Values

If no organization defaults are set, the system uses these fallbacks:

**Invoice Terms:**
```
Payment due within 30 days. Late payments may incur additional charges.
```

**Quotation Terms:**
```
This quotation is valid for 30 days from the date of issue. Prices are subject to change after this period.
```

## Files Modified

1. `supabase/ADD-DEFAULT-NOTES-AND-TERMS.sql` - ✨ NEW
2. `app/(dashboard)/settings/page.tsx` - Updated
3. `components/invoices/InvoiceForm.tsx` - Updated
4. `components/quotations/QuotationForm.tsx` - Updated

## API Impact

The `/api/organization/settings` endpoint now accepts and returns:
- `default_notes`
- `invoice_terms`
- `quotation_terms`

## Testing Checklist

- [ ] Run the SQL migration
- [ ] Refresh browser and log in
- [ ] Go to Settings → Organization
- [ ] Verify "Document Defaults" section appears
- [ ] Set default notes and terms
- [ ] Save changes successfully
- [ ] Create a new invoice
- [ ] Verify default notes and invoice terms appear
- [ ] Create a new quotation
- [ ] Verify default notes and quotation terms appear
- [ ] Verify you can edit the defaults per document

## Troubleshooting

### "Failed to update organization"
- Check that the SQL migration ran successfully
- Verify your user is linked to an organization

### Defaults not appearing on new documents
- Hard refresh your browser (`Ctrl+Shift+R`)
- Check that you saved the defaults in settings
- Verify organization settings API returns the new fields

### "User is not associated with an organization"
- Run the `SETUP-USER-ORG.sql` script to link your user to an organization
- See previous instructions on fixing this issue

## Need Help?

If you encounter issues:
1. Check browser console for errors (`F12`)
2. Verify the SQL migration completed
3. Ensure you're logged in with a valid session
4. Try hard refresh (`Ctrl+Shift+R`)

