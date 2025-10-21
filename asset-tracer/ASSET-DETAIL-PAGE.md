# Asset Detail Page Feature

## Overview
Comprehensive asset detail page showing complete financial analytics, expense tracking, and revenue monitoring for individual assets.

## Location
- **Page**: `app/(dashboard)/assets/[id]/page.tsx`
- **API Routes**:
  - `app/api/transactions/route.ts` (NEW)
  - `app/api/expenses/route.ts` (UPDATED to support `asset_id` filter)

## Features

### 1. **Asset Information Header**
- Asset image (or placeholder if none)
- Name, description, and status badge
- Key details: Category, Location, Purchase Date, Serial Number
- Purchase cost and current value prominently displayed
- Back navigation and Edit button

### 2. **Two-Tab Interface**

#### **Overview Tab**
- **Basic Information Section**:
  - Name, Category, Status, Location
- **Purchase Information Section**:
  - Purchase Date, Purchase Cost, Current Value, Serial Number
- **Description** (if available)

#### **Financials Tab**
- **4 KPI Cards**:
  1. **Total Spend**: Purchase cost + all expenses (red)
  2. **Total Revenue**: Sum of all income transactions (green)
  3. **Profit/Loss**: Revenue - Spend (green/red based on value)
  4. **ROI**: Return on Investment percentage (large, prominent display with gradient background)

- **Interactive Line Chart**:
  - Shows spend vs revenue over time
  - Monthly aggregation
  - Includes purchase cost in first month
  - Hover tooltips with formatted currency

- **Expenses Table**:
  - Lists all expenses linked to this asset
  - Columns: Date, Description, Category, Vendor, Amount
  - Actions: Edit, Delete
  - "Add Expense" button opens dialog

- **Revenue Transactions Table**:
  - Lists all income transactions for this asset
  - Columns: Date, Description, Category, Reference, Amount
  - Green-colored amounts for easy identification

### 3. **Add/Edit Expense Dialog**
- Opens ExpenseDialog component
- Pre-fills asset_id automatically
- Full expense form with all fields
- Create or update expenses
- Real-time list updates after save

### 4. **Financial Calculations**
```typescript
Total Spend = Purchase Cost + Sum(All Expenses)
Total Revenue = Sum(All Income Transactions)
Profit/Loss = Total Revenue - Total Spend
ROI % = (Profit/Loss / Total Spend) × 100
```

### 5. **Time Series Data**
- Aggregates financial data by month
- Combines purchase cost, expenses, and revenue
- Sorted chronologically
- Powers the line chart visualization

## API Endpoints

### GET `/api/expenses?asset_id={uuid}`
Returns all expenses for a specific asset.

**Query Parameters**:
- `asset_id` (optional): Filter by asset UUID

**Response**:
```json
[
  {
    "id": "uuid",
    "description": "Oil change",
    "amount": 150.00,
    "expense_date": "2024-03-15",
    "category": "maintenance",
    "vendor": "Auto Shop",
    ...
  }
]
```

### GET `/api/transactions?asset_id={uuid}`
Returns all transactions for a specific asset.

**Query Parameters**:
- `asset_id` (optional): Filter by asset UUID

**Response**:
```json
[
  {
    "id": "uuid",
    "type": "income",
    "category": "sales",
    "amount": 5000.00,
    "transaction_date": "2024-03-20",
    "description": "March rental income",
    ...
  }
]
```

## UI Components Used

### shadcn/ui
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Button`
- `Badge`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` ✨ NEW
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead`
- `Skeleton`

### Icons (lucide-react)
- `ArrowLeft`, `Package`, `DollarSign`, `TrendingUp`
- `Calendar`, `MapPin`, `Tag`, `Plus`, `Edit`, `Trash2`

### Charts (Recharts)
- `LineChart`, `Line`
- `XAxis`, `YAxis`, `CartesianGrid`
- `Tooltip`, `Legend`
- `ResponsiveContainer`

### Custom Components
- `ExpenseDialog` from `@/components/expenses`

## Data Flow

```
1. Page loads with asset ID from URL params
   ↓
2. Fetch asset data: GET /api/assets/{id}
   ↓
3. Fetch expenses: GET /api/expenses?asset_id={id}
   ↓
4. Fetch transactions: GET /api/transactions?asset_id={id}
   ↓
5. Calculate financials (spend, revenue, P&L, ROI)
   ↓
6. Generate time series data for chart
   ↓
7. Render UI with tabs, charts, and tables
```

## User Actions

### View Asset
- Navigate from assets list by clicking an asset
- URL: `/assets/{asset-id}`

### Add Expense
1. Click "Add Expense" button
2. Fill in expense form (asset_id pre-filled)
3. Save
4. Expense appears in list and updates totals

### Edit Expense
1. Click Edit icon on expense row
2. Modify fields in dialog
3. Save
4. Changes reflect immediately

### Delete Expense
1. Click Delete icon on expense row
2. Confirm deletion
3. Expense removed, totals recalculated

### Navigate
- "Back to Assets" returns to assets list
- "Edit Asset" goes to edit page (not yet implemented)

## Styling & UX

### Color Coding
- **Red**: Expenses, negative values, total spend
- **Green**: Revenue, positive profit, ROI gains
- **Blue**: ROI card gradient background
- **Badges**: Status-specific colors (active=green, maintenance=yellow, etc.)

### Responsive Design
- Mobile: Single column layout, stacked cards
- Tablet: 2-column grid for KPIs
- Desktop: 4-column grid for KPIs, full-width charts

### Loading States
- Skeleton loaders for initial page load
- Smooth transitions between states

### Empty States
- "No expenses recorded for this asset"
- "No revenue transactions for this asset"
- Centered, gray text for clarity

## Technical Details

### State Management
- `useSWR` for all data fetching
- Automatic revalidation on focus
- Optimistic UI updates with `mutate()`

### Type Safety
- Full TypeScript coverage
- Typed interfaces for Asset, Expense, Transaction
- Type-safe API responses

### Error Handling
- Try-catch blocks for API calls
- Toast notifications for success/error
- Graceful error display for fetch failures

### Performance
- Parallel data fetching (SWR)
- Memoized calculations (useMemo potential)
- Efficient re-renders

## Future Enhancements

### Potential Features
1. **Edit Asset** button functionality
2. **Add Transaction** button for manual revenue entry
3. **Export to PDF** - Asset financial report
4. **Depreciation Tracking** - Auto-calculate asset depreciation
5. **Maintenance Schedule** - Track upcoming maintenance
6. **Document Attachments** - Upload receipts, manuals, warranties
7. **Activity Timeline** - Chronological view of all asset events
8. **Comparison View** - Compare with other similar assets
9. **Alerts** - Notify when ROI drops below threshold
10. **Budget Tracking** - Set and monitor expense budgets per asset

### Chart Enhancements
- Add more chart types (pie chart for expense categories)
- Cumulative profit/loss over time
- Comparison to budget/forecast
- Year-over-year comparison

## Testing Checklist

### Manual Testing
- [ ] Navigate to asset detail page
- [ ] Verify all data displays correctly
- [ ] Switch between Overview and Financials tabs
- [ ] Check KPI calculations are accurate
- [ ] Hover over chart data points
- [ ] Add new expense via dialog
- [ ] Edit existing expense
- [ ] Delete expense (with confirmation)
- [ ] Verify totals update after expense changes
- [ ] Test on mobile, tablet, and desktop
- [ ] Check loading states
- [ ] Check error states (invalid asset ID)

### Data Verification
- [ ] Total Spend = Purchase Cost + Sum(Expenses)
- [ ] Total Revenue = Sum(Income Transactions)
- [ ] Profit/Loss = Revenue - Spend
- [ ] ROI % = (P/L / Spend) × 100
- [ ] Chart data matches table data
- [ ] Dates formatted correctly
- [ ] Currency formatted consistently

## Related Files
- `components/expenses/ExpenseDialog.tsx`
- `components/expenses/ExpenseForm.tsx`
- `lib/db/expenses.ts`
- `types/asset.ts`
- `types/financial.ts`

## Date Created
October 4, 2025

---

**Status**: ✅ **Fully Implemented**

This asset detail page provides a comprehensive, visually appealing view of individual asset performance with full CRUD capabilities for expenses and detailed financial analytics.

