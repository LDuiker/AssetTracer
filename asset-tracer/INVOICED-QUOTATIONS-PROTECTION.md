# Invoiced Quotations Protection

This document outlines all the protections implemented to prevent modifications to quotations that have been converted to invoices.

## Database Schema

### Added Column
- **`converted_to_invoice_id`**: UUID reference to the invoice created from this quotation
- **Index**: `idx_quotations_converted_to_invoice` for query performance

### Status Constraint
Updated the `quotations_status_check` constraint to include the new `'invoiced'` status:
```sql
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'invoiced'))
```

## Backend Protection (API)

### PATCH `/api/quotations/[id]`
**Prevents updates to invoiced quotations:**
1. Checks if quotation has `status === 'invoiced'` OR `converted_to_invoice_id` is set
2. Returns 400 error: "Cannot update a quotation that has been converted to an invoice"
3. Prevents manual setting of `'invoiced'` status (only set via Convert to Invoice feature)

### DELETE `/api/quotations/[id]`
**Prevents deletion of invoiced quotations:**
1. Checks if quotation has `status === 'invoiced'` OR `converted_to_invoice_id` is set
2. Returns 400 error: "Cannot delete a quotation that has been converted to an invoice"

### POST `/api/quotations/[id]/convert-to-invoice`
**Automatically sets status to 'invoiced':**
1. Creates invoice from quotation
2. Updates quotation with `converted_to_invoice_id`
3. Sets quotation `status` to `'invoiced'`

## Frontend Protection (UI)

### QuotationViewPanel
**Status Badge:**
- **Invoiced quotations**: Shows non-clickable badge with tooltip "Status cannot be changed for invoiced quotations"
- **Non-invoiced quotations**: Shows dropdown menu with status options (excluding 'invoiced' from manual selection)

**Action Buttons:**
- **Edit button**: Hidden for invoiced quotations
- **Delete button**: Hidden for invoiced quotations
- **Clone button**: Always available (allows creating new quotation from invoiced one)
- **Download PDF button**: Always available

### QuotationTable
**Dropdown Menu:**
- **Edit option**: Hidden for invoiced quotations
- **Delete option**: Hidden for invoiced quotations
- **Convert to Invoice**: Only shown for `accepted` quotations that haven't been converted yet
- **Clone option**: Always available
- **Download PDF**: Always available

## User Experience

### When a quotation is converted to an invoice:
1. ✅ Status automatically changes to `'invoiced'` (purple badge)
2. ✅ Status dropdown is disabled (no more status changes allowed)
3. ✅ Edit button is hidden
4. ✅ Delete button is hidden
5. ✅ "Converted to Invoice" badge is displayed
6. ✅ Clone and Download PDF remain available

### Protection Levels:
1. **UI Level**: Buttons and dropdowns are hidden/disabled
2. **API Level**: Validation prevents any updates or deletions
3. **Database Level**: Status constraint ensures data integrity

## Benefits

- **Data Integrity**: Prevents accidental changes to quotations that are already invoiced
- **Audit Trail**: Maintains historical accuracy of quotations
- **Consistency**: Invoice and quotation data remain in sync
- **User-Friendly**: Clear visual indicators of which quotations are locked

## Future Enhancements

Potential improvements to consider:
- Add a "View Linked Invoice" button for converted quotations
- Add audit log to track conversion events
- Add permission-based override (e.g., admin can edit invoiced quotations)
- Add bulk conversion feature for multiple accepted quotations

