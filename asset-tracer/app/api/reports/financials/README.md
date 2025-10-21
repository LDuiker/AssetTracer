# Financial Reports API

This endpoint provides comprehensive financial reporting by combining data from multiple sources.

## Endpoint

```
GET /api/reports/financials
```

## Authentication

Requires valid user session with organization membership.

## Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `start_date` | string | No | Start date for P&L report (YYYY-MM-DD) | `2024-01-01` |
| `end_date` | string | No | End date for P&L report (YYYY-MM-DD) | `2024-12-31` |

**Default**: If dates not provided, defaults to current year (January 1 to December 31).

## Response Structure

```typescript
{
  // Metadata
  report_date: string;        // ISO timestamp of when report was generated
  date_range: {
    start_date: string;       // Start date of report period
    end_date: string;         // End date of report period
  };
  organization_id: string;

  // Asset Financials - Detailed per-asset breakdown
  asset_financials: [
    {
      asset_id: string;
      asset_name: string;
      asset_category: string;
      asset_status: string;
      purchase_cost: number;
      current_value: number;
      total_spend: number;      // All expenses for this asset
      total_revenue: number;    // All revenue from this asset
      profit_loss: number;      // Revenue - Spend
      roi_percentage: number;   // Return on Investment
      maintenance_cost: number;
      operating_cost: number;
      transaction_count: number;
      last_transaction_date: string;
      currency: string;
    }
    // ... more assets
  ],

  // Monthly P&L - Month-by-month breakdown
  monthly_pl: [
    {
      month: string;            // YYYY-MM
      month_start: string;      // First day of month
      month_end: string;        // Last day of month
      total_revenue: number;
      total_expenses: number;
      net_profit: number;
      revenue_count: number;
      expense_count: number;
      transaction_count: number;
      top_revenue_category: string;
      top_expense_category: string;
      asset_purchases: number;
      asset_sales: number;
      invoices_paid: number;
      invoices_paid_count: number;
      currency: string;
    }
    // ... more months
  ],

  // Summary - Aggregated metrics and KPIs
  summary: {
    // Current vs Previous Month Comparison
    current_month_revenue: number;
    current_month_expenses: number;
    current_month_profit: number;
    previous_month_revenue: number;
    previous_month_expenses: number;
    previous_month_profit: number;
    revenue_growth_percentage: number;
    expense_growth_percentage: number;
    profit_growth_percentage: number;
    ytd_revenue: number;
    ytd_expenses: number;
    ytd_profit: number;

    // Assets Summary
    total_assets_count: number;
    total_assets_value: number;
    total_assets_purchase_cost: number;
    total_assets_revenue: number;
    total_assets_spend: number;

    // Period Summary (for selected date range)
    period_total_revenue: number;
    period_total_expenses: number;
    period_net_profit: number;
    period_profit_margin: number;

    // Monthly Averages
    avg_monthly_revenue: number;
    avg_monthly_expenses: number;
    avg_monthly_profit: number;

    // Performance Highlights
    best_month: {
      month: string;
      net_profit: number;
    } | null;
    worst_month: {
      month: string;
      net_profit: number;
    } | null;

    currency: string;
  }
}
```

## Usage Examples

### Get Current Year Report

```typescript
const response = await fetch('/api/reports/financials', {
  credentials: 'include'
});

const report = await response.json();
console.log(`Net Profit: $${report.summary.period_net_profit}`);
```

### Get Custom Date Range

```typescript
const response = await fetch(
  '/api/reports/financials?start_date=2024-01-01&end_date=2024-06-30',
  { credentials: 'include' }
);

const report = await response.json();
console.log(`H1 2024 Profit: $${report.summary.period_net_profit}`);
```

### With SWR (Recommended)

```typescript
import useSWR from 'swr';

function FinancialDashboard() {
  const { data: report, error, isLoading } = useSWR(
    '/api/reports/financials?start_date=2024-01-01&end_date=2024-12-31',
    fetcher
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <h2>Financial Report</h2>
      <p>Total Revenue: ${report.summary.period_total_revenue}</p>
      <p>Total Expenses: ${report.summary.period_total_expenses}</p>
      <p>Net Profit: ${report.summary.period_net_profit}</p>
      <p>Profit Margin: {report.summary.period_profit_margin}%</p>
    </div>
  );
}
```

## Common Use Cases

### 1. Dashboard Summary
Use the `summary` object to display key metrics on your dashboard:
- Current month vs previous month
- YTD totals
- Growth percentages

### 2. P&L Chart
Use the `monthly_pl` array to create line charts showing:
- Revenue trend over time
- Expense trend over time
- Profit trend over time

### 3. Asset Performance
Use the `asset_financials` array to:
- Rank assets by ROI
- Identify most profitable assets
- Find assets with high maintenance costs

### 4. Quarterly Reports
```typescript
// Q1 2024
const q1 = await fetch('/api/reports/financials?start_date=2024-01-01&end_date=2024-03-31');

// Q2 2024
const q2 = await fetch('/api/reports/financials?start_date=2024-04-01&end_date=2024-06-30');

// Q3 2024
const q3 = await fetch('/api/reports/financials?start_date=2024-07-01&end_date=2024-09-30');

// Q4 2024
const q4 = await fetch('/api/reports/financials?start_date=2024-10-01&end_date=2024-12-31');
```

### 5. Year-over-Year Comparison
```typescript
const report2024 = await fetch('/api/reports/financials?start_date=2024-01-01&end_date=2024-12-31');
const report2023 = await fetch('/api/reports/financials?start_date=2023-01-01&end_date=2023-12-31');

const yoyGrowth = ((report2024.summary.period_net_profit - report2023.summary.period_net_profit) 
  / report2023.summary.period_net_profit) * 100;

console.log(`YoY Profit Growth: ${yoyGrowth.toFixed(2)}%`);
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
User is not authenticated.

### 404 Not Found
```json
{
  "error": "Organization not found"
}
```
User doesn't have an associated organization.

### 400 Bad Request
```json
{
  "error": "Invalid date format. Use YYYY-MM-DD"
}
```
Date parameters are not in the correct format.

```json
{
  "error": "Start date must be before or equal to end date"
}
```
Invalid date range provided.

### 500 Internal Server Error
```json
{
  "error": "Failed to generate financial report",
  "details": "Specific error message"
}
```
Server-side error occurred while generating the report.

## Performance Considerations

- This endpoint makes **3 parallel database calls** (asset financials, monthly P&L, financial summary)
- Response time typically: **500ms - 2s** depending on data volume
- Consider caching the response for 5-15 minutes if displaying on a dashboard
- For very large datasets (>1000 transactions), response time may increase

## Caching Strategy (Recommended)

```typescript
import useSWR from 'swr';

// Revalidate every 10 minutes
const { data } = useSWR(
  '/api/reports/financials',
  fetcher,
  { 
    refreshInterval: 600000, // 10 minutes in ms
    revalidateOnFocus: false 
  }
);
```

## Data Sources

This report aggregates data from:

1. **`assets` table** - Asset values and purchase costs
2. **`transactions` table** - Revenue and expense transactions
3. **`expenses` table** - Detailed expense records
4. **`invoices` table** - Invoice payments and revenue

All data is filtered by the user's organization for security.

## PostgreSQL Functions Used

- `get_asset_financials(organization_id)` - Asset-level financial data
- `get_monthly_pl(organization_id, start_date, end_date)` - Monthly profit/loss
- `get_financial_summary(organization_id)` - Overall summary metrics

These functions are defined in `supabase/functions.sql`.

## TypeScript Types

Import types from `@/types`:

```typescript
import type { 
  FinancialReport, 
  FinancialReportSummary,
  DateRange 
} from '@/types';

const report: FinancialReport = await fetch('/api/reports/financials').then(r => r.json());
```

## Rate Limiting

Currently no rate limiting is implemented. For production:
- Consider implementing rate limiting (e.g., 60 requests per hour per user)
- Add caching headers to reduce unnecessary requests
- Consider background report generation for very large datasets

## Future Enhancements

Potential additions:
- Export formats (CSV, PDF, Excel)
- Email report delivery
- Scheduled report generation
- Comparative analysis (multiple periods)
- Budget vs actual comparisons
- Forecasting and projections
- Custom metric calculations
- Report templates

---

**Last Updated**: October 2024  
**Version**: 1.0.0

