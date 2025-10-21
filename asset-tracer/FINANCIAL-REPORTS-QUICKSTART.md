# Financial Reports API - Quick Start Guide

## 🚀 Overview

The Financial Reports API provides a comprehensive overview of your organization's financial health by combining:
- Asset financials (ROI, profitability per asset)
- Monthly profit & loss statements
- Overall financial summary with KPIs

## 📍 Endpoint

```
GET /api/reports/financials
```

## 🧪 Testing the API

### Test 1: Get Current Year Report (Default)

```bash
# Using curl
curl http://localhost:3000/api/reports/financials \
  -H "Cookie: your-session-cookie"

# Or in browser (make sure you're logged in)
http://localhost:3000/api/reports/financials
```

**Expected Response**:
```json
{
  "report_date": "2024-10-04T20:00:00.000Z",
  "date_range": {
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  },
  "organization_id": "your-org-id",
  "asset_financials": [ /* array of assets */ ],
  "monthly_pl": [ /* array of months */ ],
  "summary": {
    "period_total_revenue": 50000,
    "period_total_expenses": 30000,
    "period_net_profit": 20000,
    "period_profit_margin": 40.00,
    // ... more metrics
  }
}
```

### Test 2: Get Custom Date Range

```bash
# First half of 2024
curl "http://localhost:3000/api/reports/financials?start_date=2024-01-01&end_date=2024-06-30"

# Just Q1 2024
curl "http://localhost:3000/api/reports/financials?start_date=2024-01-01&end_date=2024-03-31"

# Last 3 months
curl "http://localhost:3000/api/reports/financials?start_date=2024-07-01&end_date=2024-09-30"
```

### Test 3: Using JavaScript Fetch

```javascript
// In browser console or frontend code
async function getFinancialReport() {
  const response = await fetch('/api/reports/financials?start_date=2024-01-01&end_date=2024-12-31', {
    credentials: 'include'
  });
  
  const report = await response.json();
  
  console.log('=== FINANCIAL REPORT ===');
  console.log('Report Period:', report.date_range);
  console.log('Total Revenue:', report.summary.period_total_revenue);
  console.log('Total Expenses:', report.summary.period_total_expenses);
  console.log('Net Profit:', report.summary.period_net_profit);
  console.log('Profit Margin:', report.summary.period_profit_margin + '%');
  console.log('Total Assets:', report.summary.total_assets_count);
  console.log('Assets Value:', report.summary.total_assets_value);
  
  return report;
}

getFinancialReport();
```

### Test 4: With SWR in a React Component

```typescript
'use client';

import useSWR from 'swr';
import { FinancialReport } from '@/types';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function FinancialDashboard() {
  const { data: report, error, isLoading } = useSWR<FinancialReport>(
    '/api/reports/financials',
    fetcher
  );

  if (isLoading) return <div>Loading report...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!report) return <div>No data</div>;

  return (
    <div>
      <h1>Financial Report</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <h3>Total Revenue</h3>
          <p className="text-2xl font-bold">
            ${report.summary.period_total_revenue.toLocaleString()}
          </p>
        </div>
        
        <div className="card">
          <h3>Total Expenses</h3>
          <p className="text-2xl font-bold">
            ${report.summary.period_total_expenses.toLocaleString()}
          </p>
        </div>
        
        <div className="card">
          <h3>Net Profit</h3>
          <p className="text-2xl font-bold">
            ${report.summary.period_net_profit.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2>Monthly Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Revenue</th>
              <th>Expenses</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {report.monthly_pl.map((month) => (
              <tr key={month.month}>
                <td>{month.month}</td>
                <td>${month.total_revenue.toLocaleString()}</td>
                <td>${month.total_expenses.toLocaleString()}</td>
                <td>${month.net_profit.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h2>Top Performing Assets</h2>
        {report.asset_financials
          .sort((a, b) => b.roi_percentage - a.roi_percentage)
          .slice(0, 5)
          .map((asset) => (
            <div key={asset.asset_id} className="p-4 border rounded">
              <h3>{asset.asset_name}</h3>
              <p>ROI: {asset.roi_percentage.toFixed(2)}%</p>
              <p>Profit: ${asset.profit_loss.toLocaleString()}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
```

## 📊 Understanding the Response

### Summary Metrics

```typescript
{
  summary: {
    // Current vs Previous Month
    current_month_revenue: 5000,
    previous_month_revenue: 4500,
    revenue_growth_percentage: 11.11,  // 11.11% growth
    
    // Year-to-Date
    ytd_revenue: 50000,
    ytd_expenses: 30000,
    ytd_profit: 20000,
    
    // Period Totals (based on query date range)
    period_total_revenue: 50000,
    period_total_expenses: 30000,
    period_net_profit: 20000,
    period_profit_margin: 40.00,  // 40% margin
    
    // Averages
    avg_monthly_revenue: 4166.67,
    avg_monthly_expenses: 2500.00,
    avg_monthly_profit: 1666.67,
    
    // Performance Highlights
    best_month: {
      month: "2024-06",
      net_profit: 3500
    },
    worst_month: {
      month: "2024-02",
      net_profit: 800
    }
  }
}
```

### Asset Financials Array

Each asset includes:
```typescript
{
  asset_id: "uuid",
  asset_name: "Delivery Van #1",
  asset_category: "Vehicles",
  asset_status: "active",
  purchase_cost: 35000,
  current_value: 28000,
  total_spend: 5200,        // All expenses
  total_revenue: 15000,     // All revenue generated
  profit_loss: 9800,        // Revenue - Spend
  roi_percentage: 28.00,    // (Profit / Investment) * 100
  maintenance_cost: 2500,
  operating_cost: 2700,
  transaction_count: 48,
  last_transaction_date: "2024-09-30",
  currency: "USD"
}
```

### Monthly P&L Array

Each month includes:
```typescript
{
  month: "2024-06",
  month_start: "2024-06-01",
  month_end: "2024-06-30",
  total_revenue: 8500,
  total_expenses: 5200,
  net_profit: 3300,
  revenue_count: 25,
  expense_count: 18,
  transaction_count: 43,
  top_revenue_category: "sales",
  top_expense_category: "maintenance",
  asset_purchases: 0,
  asset_sales: 0,
  invoices_paid: 12500,
  invoices_paid_count: 15,
  currency: "USD"
}
```

## 🎯 Common Use Cases

### 1. Dashboard KPI Cards

```typescript
const { data: report } = useSWR('/api/reports/financials', fetcher);

return (
  <div className="grid grid-cols-4 gap-4">
    <KPICard 
      title="Revenue" 
      value={report.summary.period_total_revenue}
      growth={report.summary.revenue_growth_percentage}
    />
    <KPICard 
      title="Expenses" 
      value={report.summary.period_total_expenses}
      growth={report.summary.expense_growth_percentage}
    />
    <KPICard 
      title="Profit" 
      value={report.summary.period_net_profit}
      growth={report.summary.profit_growth_percentage}
    />
    <KPICard 
      title="Margin" 
      value={report.summary.period_profit_margin}
      suffix="%"
    />
  </div>
);
```

### 2. Monthly Trend Chart

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const chartData = report.monthly_pl.map(month => ({
  month: month.month,
  revenue: month.total_revenue,
  expenses: month.total_expenses,
  profit: month.net_profit,
}));

return (
  <LineChart data={chartData} width={800} height={400}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="revenue" stroke="#10b981" />
    <Line type="monotone" dataKey="expenses" stroke="#ef4444" />
    <Line type="monotone" dataKey="profit" stroke="#3b82f6" />
  </LineChart>
);
```

### 3. Asset ROI Ranking

```typescript
const topAssets = report.asset_financials
  .sort((a, b) => b.roi_percentage - a.roi_percentage)
  .slice(0, 10);

return (
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Asset</th>
        <th>ROI</th>
        <th>Profit</th>
      </tr>
    </thead>
    <tbody>
      {topAssets.map((asset, index) => (
        <tr key={asset.asset_id}>
          <td>{index + 1}</td>
          <td>{asset.asset_name}</td>
          <td>{asset.roi_percentage.toFixed(2)}%</td>
          <td>${asset.profit_loss.toLocaleString()}</td>
        </tr>
      ))}
    </tbody>
  </table>
);
```

### 4. Quarterly Comparison

```typescript
async function getQuarterlyComparison() {
  const quarters = [
    { name: 'Q1', start: '2024-01-01', end: '2024-03-31' },
    { name: 'Q2', start: '2024-04-01', end: '2024-06-30' },
    { name: 'Q3', start: '2024-07-01', end: '2024-09-30' },
    { name: 'Q4', start: '2024-10-01', end: '2024-12-31' },
  ];

  const reports = await Promise.all(
    quarters.map(q => 
      fetch(`/api/reports/financials?start_date=${q.start}&end_date=${q.end}`)
        .then(r => r.json())
    )
  );

  return quarters.map((q, i) => ({
    quarter: q.name,
    revenue: reports[i].summary.period_total_revenue,
    expenses: reports[i].summary.period_total_expenses,
    profit: reports[i].summary.period_net_profit,
  }));
}
```

## 🐛 Troubleshooting

### Error: 401 Unauthorized
**Solution**: Make sure you're logged in and have a valid session.

### Error: 404 Organization not found
**Solution**: Your user account needs to be associated with an organization. Check the `users` table in Supabase.

### Error: Invalid date format
**Solution**: Dates must be in `YYYY-MM-DD` format. Example: `2024-01-01`

### Empty data arrays
**Solution**: You may not have any transactions, expenses, or assets yet. Create some test data first:
1. Go to `/assets` and create assets
2. Go to `/expenses` and create expenses
3. Create transactions in the database

### Slow response times
**Solution**: 
- The API makes 3 database function calls
- For large datasets, consider caching the response
- Use shorter date ranges to reduce data volume

## 📈 Next Steps

1. **Create a Financial Dashboard Page**
   - Display KPI cards
   - Show monthly trend chart
   - List top performing assets

2. **Export Functionality**
   - Add CSV export
   - Add PDF report generation
   - Email scheduled reports

3. **Advanced Features**
   - Budget vs actual comparison
   - Forecasting
   - Category breakdowns
   - Custom metrics

## ✅ Success Checklist

- [ ] API returns data for current year (default)
- [ ] API returns data for custom date range
- [ ] Summary metrics are calculated correctly
- [ ] Asset financials array is populated
- [ ] Monthly P&L array is populated
- [ ] Error handling works (401, 404, 400, 500)
- [ ] Date validation works
- [ ] Response time is acceptable (<2 seconds)

---

**Happy Reporting!** 📊

For full API documentation, see: `app/api/reports/financials/README.md`

