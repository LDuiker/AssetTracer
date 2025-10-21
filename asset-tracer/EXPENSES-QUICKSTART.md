# Expenses Feature - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Development Server

```bash
cd asset-tracer
npm run dev
```

### 2. Navigate to Expenses

Open your browser and go to:
```
http://localhost:3000/expenses
```

Or click **"Expenses"** in the sidebar navigation (DollarSign icon).

## 🧪 Testing the Feature

### Test 1: Create an Expense

1. Click the **"Create Expense"** button in the top-right
2. Fill in the form:
   - **Description**: "Office supplies for Q1"
   - **Amount**: 250.00
   - **Expense Date**: Select today's date
   - **Category**: Select "Supplies"
   - **Vendor**: "ABC Office Supplies"
   - Leave other fields as optional
3. Click **"Save Expense"**
4. ✅ You should see a success toast notification
5. ✅ The expense should appear in the table

### Test 2: Link Expense to Asset

1. First, make sure you have at least one asset created (go to `/assets` if needed)
2. Click **"Create Expense"** again
3. Fill in basic details:
   - **Description**: "Equipment maintenance"
   - **Amount**: 175.00
   - **Expense Date**: Select a date
   - **Category**: Select "Maintenance"
   - **Vendor**: "Maintenance Co"
4. In the **"Linked Asset"** dropdown, select an asset
5. Click **"Save Expense"**
6. ✅ The expense should show the linked asset in the table

### Test 3: Search and Filter

1. Create a few more expenses with different categories
2. **Search Test**: Type in the search box (searches description, vendor, reference, notes)
   - ✅ Table should filter in real-time
   - ✅ Results count should update
3. **Category Filter**: Select a category from the dropdown
   - ✅ Only expenses from that category should show
   - ✅ A badge should appear showing the active filter
4. **Asset Filter**: Select an asset or "No Asset"
   - ✅ Filter should apply correctly
5. **Date Range**: Set start and end dates
   - ✅ Only expenses within the date range should show
6. Click **"Clear Filters"** or X on individual badges
   - ✅ Filters should reset

### Test 4: Edit an Expense

1. Click the three-dot menu (⋮) on any expense row
2. Select **"Edit"**
3. Update any field (e.g., change amount to 300.00)
4. Click **"Save Expense"**
5. ✅ Success toast should appear
6. ✅ Table should update with new values

### Test 5: Delete an Expense

1. Click the three-dot menu (⋮) on any expense row
2. Select **"Delete"** (red text)
3. Confirm the deletion in the browser alert
4. ✅ Success toast should appear
5. ✅ Expense should disappear from the table

### Test 6: View Receipt

1. Create or edit an expense
2. Add a **Receipt URL**: `https://example.com/receipt.pdf`
3. Save the expense
4. Click the three-dot menu (⋮) on that expense
5. Select **"View Receipt"**
6. ✅ Receipt URL should open in a new tab

### Test 7: Tax Deductible Flag

1. Create a new expense
2. Check the **"Tax Deductible"** checkbox
3. Save the expense
4. Edit the same expense
5. ✅ The checkbox should remain checked
6. ✅ This data is stored for future reporting

### Test 8: Status Management

1. Create an expense with status **"Pending"**
2. Edit the expense and change status to **"Approved"**
3. ✅ The badge should change color (yellow → green)
4. Change to **"Paid"**
5. ✅ Badge should be blue

## 📊 Test Data Examples

### Example 1: Vehicle Fuel Expense
```
Description: Fuel for company vehicle
Amount: 85.50
Date: Today
Category: Fuel
Vendor: Gas Station XYZ
Payment Method: Credit Card
Status: Paid
```

### Example 2: Equipment Repair
```
Description: Laptop screen repair
Amount: 320.00
Date: 2024-01-15
Category: Repair
Vendor: Tech Repair Inc.
Reference Number: REP-2024-001
Asset: [Select a laptop asset]
Payment Method: Bank Transfer
Status: Approved
Tax Deductible: ✓
Notes: Warranty expired, paid in full
```

### Example 3: Insurance Premium
```
Description: Annual business insurance
Amount: 1200.00
Date: 2024-01-01
Category: Insurance
Vendor: Insurance Co.
Payment Method: Check
Status: Paid
Tax Deductible: ✓
```

## 🔍 Edge Cases to Test

### Empty State
1. Delete all expenses
2. ✅ Should show empty state with icon and message

### No Search Results
1. Search for something that doesn't exist (e.g., "xyz123abc")
2. ✅ Should show "No expenses found" message
3. Clear the search
4. ✅ All expenses should reappear

### Date Range Edge Cases
1. Set start date after end date
2. ✅ Should show no results (or all if no expenses match)
3. Set both dates to today
4. ✅ Should show only today's expenses

### Asset Dropdown
1. If you have no assets created yet
2. ✅ Asset dropdown should show only "No Asset"
3. Create an asset
4. ✅ Refresh expenses page, asset should appear in dropdown

### Form Validation
1. Try to submit form with empty required fields
2. ✅ Should show validation errors
3. Try to enter negative amount
4. ✅ Should show "Amount must be greater than 0"
5. Try invalid URL in receipt field
6. ✅ Should show URL validation error

## 📱 Responsive Design Test

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on different screen sizes:
   - **Mobile** (375px): ✅ Table should scroll horizontally
   - **Tablet** (768px): ✅ Layout should adjust
   - **Desktop** (1920px): ✅ Full layout visible

## 🎯 Expected Behavior

### Loading State
- While fetching data, table shows skeleton loaders
- Form submit button shows loading spinner

### Error Handling
- Network errors show error state with retry button
- API errors show toast notifications with error message

### Optimistic Updates
- UI updates immediately on create/edit/delete
- Background revalidation ensures data consistency
- Errors rollback optimistic changes

## 🐛 Troubleshooting

### Expenses Not Showing
1. Check browser console for errors
2. Verify you're logged in and have an organization
3. Check Supabase database to see if expenses table exists
4. Run: `SELECT * FROM expenses LIMIT 5;` in Supabase SQL Editor

### Cannot Link to Asset
1. Verify assets exist: Go to `/assets` and create at least one
2. Check that assets belong to your organization
3. Refresh the expenses page

### 404 on API Routes
1. Make sure dev server is running: `npm run dev`
2. Check that files exist in `app/api/expenses/`
3. Restart dev server

### Form Validation Not Working
1. Check browser console for errors
2. Ensure Zod is installed: `npm list zod`
3. Clear browser cache and reload

## ✅ Success Checklist

After testing, you should have verified:

- [ ] Create expense works
- [ ] Edit expense works
- [ ] Delete expense works (with confirmation)
- [ ] Search filters expenses correctly
- [ ] Category filter works
- [ ] Asset filter works (all, unlinked, specific asset)
- [ ] Date range filter works
- [ ] Clear filters button works
- [ ] Filter badges appear and clear individually
- [ ] Results count updates correctly
- [ ] Total amount calculates correctly
- [ ] Status badges show correct colors
- [ ] Asset linking works
- [ ] Receipt URL opens in new tab
- [ ] Tax deductible checkbox saves
- [ ] Form validation works
- [ ] Loading states appear
- [ ] Error states show properly
- [ ] Toast notifications appear for all actions
- [ ] Empty state displays when no expenses
- [ ] Table is responsive on mobile
- [ ] Sidebar navigation to Expenses works

## 🎉 Next Steps

Once testing is complete, you can:

1. **Add More Features**
   - Receipt file upload
   - Bulk import
   - Export to CSV
   - Expense charts and visualizations

2. **View Financial Reports**
   - Go to `/dashboard` to see expense totals
   - Use API: `GET /api/financials/monthly-pl?period=current_year`
   - Use API: `GET /api/financials/asset-financials` to see asset-linked expenses

3. **Link to Other Features**
   - View asset-specific expenses from asset detail pages
   - Generate reports combining invoices and expenses

---

**Happy Testing!** 🚀

If you encounter any issues, check the browser console and network tab for detailed error messages.

