# Financial Analytics API Routes

API routes for financial analytics and reporting using PostgreSQL functions.

## Routes Overview

| Route | Method | Description |
|-------|--------|-------------|
| `/api/financials/asset-financials` | GET | Asset financial summaries with ROI |
| `/api/financials/monthly-pl` | GET | Monthly profit & loss data |
| `/api/financials/summary` | GET | High-level financial dashboard summary |
| `/api/financials/asset-roi-rankings` | GET | Top assets ranked by ROI |

---

## 1. Asset Financials

**Endpoint**: `GET /api/financials/asset-financials`

**Description**: Returns financial summary for all assets including ROI calculations.

**Authentication**: Required

**Response**:
```json
{
  "data": [
    {
      "asset_id": "uuid",
      "asset_name": "Laptop",
      "asset_category": "Electronics",
      "asset_status": "active",
      "purchase_cost": 1500.00,
      "current_value": 1200.00,
      "total_spend": 1650.00,
      "total_revenue": 2500.00,
      "profit_loss": 850.00,
      "roi_percentage": 51.52,
      "maintenance_cost": 150.00,
      "operating_cost": 0.00,
      "transaction_count": 5,
      "last_transaction_date": "2024-10-15",
      "currency": "USD"
    }
  ]
}
```

**Usage**:
```typescript
const { data } = await fetch('/api/financials/asset-financials', {
  credentials: 'include',
}).then(r => r.json());
```

---

## 2. Monthly Profit & Loss

**Endpoint**: `GET /api/financials/monthly-pl`

**Description**: Returns monthly profit & loss data for a date range.

**Authentication**: Required

**Query Parameters**:
- `period` (optional): Shortcut for date range
  - `current_year` - January 1 to December 31 of current year
  - `last_3_months` - Last 3 months
  - `last_6_months` - Last 6 months
  - `last_12_months` - Last 12 months
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)

**Note**: If no parameters provided, defaults to current year.

**Response**:
```json
{
  "data": [
    {
      "month": "2024-10",
      "month_start": "2024-10-01",
      "month_end": "2024-10-31",
      "total_revenue": 15000.00,
      "total_expenses": 8500.00,
      "net_profit": 6500.00,
      "revenue_count": 25,
      "expense_count": 42,
      "transaction_count": 67,
      "top_revenue_category": "services",
      "top_expense_category": "salaries",
      "asset_purchases": 2000.00,
      "asset_sales": 500.00,
      "invoices_paid": 12000.00,
      "invoices_paid_count": 8,
      "currency": "USD"
    }
  ],
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }
}
```

**Usage**:
```typescript
// Current year
const { data } = await fetch('/api/financials/monthly-pl?period=current_year')
  .then(r => r.json());

// Last 6 months
const { data } = await fetch('/api/financials/monthly-pl?period=last_6_months')
  .then(r => r.json());

// Custom date range
const { data } = await fetch('/api/financials/monthly-pl?start_date=2024-01-01&end_date=2024-03-31')
  .then(r => r.json());
```

---

## 3. Financial Summary

**Endpoint**: `GET /api/financials/summary`

**Description**: Returns high-level financial overview for dashboard.

**Authentication**: Required

**Response**:
```json
{
  "data": {
    "current_month_revenue": 15000.00,
    "current_month_expenses": 8500.00,
    "current_month_profit": 6500.00,
    "previous_month_revenue": 12000.00,
    "previous_month_expenses": 7000.00,
    "previous_month_profit": 5000.00,
    "revenue_growth_percentage": 25.00,
    "expense_growth_percentage": 21.43,
    "profit_growth_percentage": 30.00,
    "ytd_revenue": 120000.00,
    "ytd_expenses": 75000.00,
    "ytd_profit": 45000.00,
    "total_assets_value": 50000.00,
    "total_assets_count": 15,
    "total_invoices_outstanding": 25000.00,
    "total_invoices_overdue": 5000.00,
    "currency": "USD"
  }
}
```

**Usage**:
```typescript
const { data } = await fetch('/api/financials/summary', {
  credentials: 'include',
}).then(r => r.json());

// Perfect for dashboard stats
console.log(`Current month profit: $${data.current_month_profit}`);
console.log(`Revenue growth: ${data.revenue_growth_percentage}%`);
```

---

## 4. Asset ROI Rankings

**Endpoint**: `GET /api/financials/asset-roi-rankings`

**Description**: Returns assets ranked by ROI performance.

**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Number of results (default: 10, max: 100)

**Response**:
```json
{
  "data": [
    {
      "rank": 1,
      "asset_id": "uuid",
      "asset_name": "Server A",
      "asset_category": "Equipment",
      "roi_percentage": 75.50,
      "profit_loss": 3020.00,
      "total_revenue": 7020.00,
      "total_spend": 4000.00,
      "performance_indicator": "Excellent"
    },
    {
      "rank": 2,
      "asset_name": "Laptop Pro",
      "roi_percentage": 51.52,
      "performance_indicator": "Excellent"
    }
  ],
  "limit": 10
}
```

**Performance Indicators**:
- **Excellent**: ROI ≥ 50%
- **Good**: ROI ≥ 20%
- **Fair**: ROI ≥ 0%
- **Poor**: ROI < 0%

**Usage**:
```typescript
// Top 10 assets (default)
const { data } = await fetch('/api/financials/asset-roi-rankings')
  .then(r => r.json());

// Top 5 assets
const { data } = await fetch('/api/financials/asset-roi-rankings?limit=5')
  .then(r => r.json());
```

---

## Frontend Integration Examples

### React Component with SWR

```typescript
'use client';

import useSWR from 'swr';
import { FinancialSummaryDB } from '@/lib/db/financials';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());

export function DashboardStats() {
  const { data, error, isLoading } = useSWR<{ data: FinancialSummaryDB }>(
    '/api/financials/summary',
    fetcher
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;
  if (!data?.data) return null;

  const summary = data.data;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Current Month Revenue"
        value={`$${summary.current_month_revenue.toLocaleString()}`}
        growth={summary.revenue_growth_percentage}
      />
      <StatCard
        title="Current Month Expenses"
        value={`$${summary.current_month_expenses.toLocaleString()}`}
        growth={summary.expense_growth_percentage}
      />
      <StatCard
        title="Current Month Profit"
        value={`$${summary.current_month_profit.toLocaleString()}`}
        growth={summary.profit_growth_percentage}
      />
      <StatCard
        title="YTD Profit"
        value={`$${summary.ytd_profit.toLocaleString()}`}
      />
    </div>
  );
}
```

### Asset Financials Table

```typescript
'use client';

import useSWR from 'swr';
import { AssetFinancials } from '@/types';

export function AssetFinancialsTable() {
  const { data } = useSWR<{ data: AssetFinancials[] }>(
    '/api/financials/asset-financials'
  );

  return (
    <table>
      <thead>
        <tr>
          <th>Asset</th>
          <th>Revenue</th>
          <th>Spend</th>
          <th>Profit/Loss</th>
          <th>ROI</th>
        </tr>
      </thead>
      <tbody>
        {data?.data.map((asset) => (
          <tr key={asset.asset_id}>
            <td>{asset.asset_name}</td>
            <td>${asset.total_revenue.toLocaleString()}</td>
            <td>${asset.total_spend.toLocaleString()}</td>
            <td className={asset.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}>
              ${asset.profit_loss.toLocaleString()}
            </td>
            <td>{asset.roi_percentage.toFixed(2)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Monthly P&L Chart

```typescript
'use client';

import useSWR from 'swr';
import { MonthlyPL } from '@/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export function MonthlyPLChart() {
  const { data } = useSWR<{ data: MonthlyPL[] }>(
    '/api/financials/monthly-pl?period=last_12_months'
  );

  return (
    <LineChart width={800} height={400} data={data?.data}>
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="total_revenue" stroke="#10b981" name="Revenue" />
      <Line type="monotone" dataKey="total_expenses" stroke="#ef4444" name="Expenses" />
      <Line type="monotone" dataKey="net_profit" stroke="#3b82f6" name="Net Profit" />
    </LineChart>
  );
}
```

---

## Error Handling

All endpoints return consistent error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized. Please sign in."
}
```

### 403 Forbidden
```json
{
  "error": "User is not associated with an organization."
}
```

### 500 Server Error
```json
{
  "error": "Internal server error. Please try again later."
}
```

---

## Security

- ✅ Authentication required on all endpoints
- ✅ Organization-based access control
- ✅ Data isolation between organizations
- ✅ Server-side execution only (no client access to database functions)

---

## Performance

- **Caching**: Use SWR with appropriate revalidation strategies
- **Response times**: 50-300ms typical
- **Rate limiting**: Consider implementing for production
- **Pagination**: Not currently implemented (all results returned)

---

## Testing

```bash
# Test with curl (replace with your session cookie)
curl http://localhost:3000/api/financials/summary \
  -H "Cookie: sb-access-token=your-token"

# Test monthly P&L
curl "http://localhost:3000/api/financials/monthly-pl?period=last_6_months" \
  -H "Cookie: sb-access-token=your-token"

# Test ROI rankings
curl "http://localhost:3000/api/financials/asset-roi-rankings?limit=5" \
  -H "Cookie: sb-access-token=your-token"
```

---

## Next Steps

1. ✅ Create UI components to display the data
2. ✅ Add charts and visualizations
3. ✅ Implement caching strategies
4. ✅ Add pagination for large datasets
5. ✅ Create dashboard page combining all metrics

