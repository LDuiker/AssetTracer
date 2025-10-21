# Asset Detail Page - Quick Start

## What Was Built

A comprehensive **Asset Detail Page** that shows complete financial analytics for individual assets.

## How to Access

1. **Navigate to Assets page**: `/assets`
2. **Click on any asset** in the table
3. **View detailed information** at `/assets/{asset-id}`

## Key Features

### 📊 **Financials Tab** (Main Feature)
- **4 KPI Cards**:
  - Total Spend (purchase + expenses)
  - Total Revenue (from transactions)
  - Profit/Loss
  - **ROI %** (prominent display)

- **Interactive Chart**: Spend vs Revenue over time
- **Expenses Table**: All expenses for this asset
- **Revenue Table**: All income transactions

### 📝 **Overview Tab**
- Complete asset details
- Purchase information
- Description

### ➕ **Add Expense Button**
- Quickly add expenses linked to this asset
- Opens dialog with asset pre-selected
- Real-time updates

## What's New

### 1. **New Page**
- `app/(dashboard)/assets/[id]/page.tsx`

### 2. **New API Route**
- `app/api/transactions/route.ts`
  - GET `/api/transactions?asset_id={uuid}`
  - Returns transactions for a specific asset

### 3. **Updated API Route**
- `app/api/expenses/route.ts`
  - Now supports `asset_id` query parameter
  - GET `/api/expenses?asset_id={uuid}`

### 4. **New UI Component**
- Installed `Tabs` component from shadcn/ui

## Testing It Out

### Step 1: Add Test Data (if needed)
Run this in Supabase SQL Editor to add a transaction to an existing asset:

```sql
-- Get your asset ID
SELECT id, name FROM assets WHERE organization_id = '41fa8bc6-5280-47de-b4d2-dca2540206a8';

-- Add a revenue transaction (replace asset_id with your actual asset ID)
INSERT INTO transactions (
  organization_id,
  type,
  category,
  amount,
  transaction_date,
  description,
  currency,
  asset_id,
  created_by
)
VALUES (
  '41fa8bc6-5280-47de-b4d2-dca2540206a8',
  'income',
  'sales',
  8500.00,
  '2024-04-15',
  'April equipment rental revenue',
  'USD',
  'YOUR-ASSET-ID-HERE',
  '8dbd9d54-737d-4761-af05-1c290d4d0233'
);
```

### Step 2: Navigate to Asset Detail
1. Go to `/assets`
2. Click on any asset
3. You should see:
   - Asset information at top
   - Two tabs: Overview and Financials
   - Financials tab shows KPIs, chart, and tables

### Step 3: Add an Expense
1. On Financials tab, click "Add Expense"
2. Fill in the form
3. Save
4. Watch the KPIs and chart update automatically

### Step 4: Verify Calculations
- **Total Spend** should = Purchase Cost + Sum of Expenses
- **Total Revenue** should = Sum of Income Transactions
- **Profit/Loss** should = Revenue - Spend
- **ROI %** should = (Profit/Loss / Total Spend) × 100

## Expected Results

### For Asset with Data:
```
Total Spend: $35,850
Total Revenue: $8,500
Profit/Loss: -$27,350
ROI: -76.29%
```

### Chart Should Show:
- Red line (spend) with purchase cost spike at first month
- Green line (revenue) showing income over time
- Both lines on same time axis

### Tables Should Display:
- All expenses in chronological order
- All revenue transactions in chronological order
- Proper formatting (dates, currency)

## Troubleshooting

### "No data available"
- Make sure the asset has expenses or transactions
- Add test data using SQL script above

### Page not loading
- Check that dev server is running: `npm run dev`
- Verify asset ID in URL is valid UUID

### KPIs showing $0
- Check that expenses table has `asset_id` column populated
- Verify transactions table has `asset_id` column populated
- Run SQL to confirm: 
  ```sql
  SELECT * FROM expenses WHERE asset_id = 'YOUR-ASSET-ID';
  SELECT * FROM transactions WHERE asset_id = 'YOUR-ASSET-ID';
  ```

### Chart not displaying
- Needs at least one expense or transaction with a date
- Check browser console for errors

## File Changes Summary

### Created (3 files):
1. `app/(dashboard)/assets/[id]/page.tsx` - Main detail page
2. `app/api/transactions/route.ts` - Transactions API
3. `components/ui/tabs.tsx` - Tabs component (shadcn)

### Modified (1 file):
1. `app/api/expenses/route.ts` - Added `asset_id` filter support

### Documentation (2 files):
1. `ASSET-DETAIL-PAGE.md` - Comprehensive docs
2. `ASSET-DETAIL-QUICKSTART.md` - This file

## What's Next

You can now:
1. **View detailed asset analytics** for any asset
2. **Track ROI** for individual assets
3. **Manage expenses** directly from asset page
4. **Visualize** spend vs revenue trends

## Future Enhancements Ideas
- Edit asset button functionality
- Add transaction manually (not just from invoices)
- Export asset report to PDF
- Depreciation tracking
- Maintenance scheduling
- Document attachments
- Activity timeline

---

**Status**: ✅ Ready to use!

Navigate to `/assets` and click any asset to see it in action! 🚀

