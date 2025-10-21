# Reports API

This directory contains API routes for generating various reports in AssetTracer.

## Available Reports

### 1. Financial Reports
**Endpoint**: `/api/reports/financials`

Comprehensive financial reporting combining:
- Asset financials (ROI, spend, revenue)
- Monthly P&L (profit/loss by month)
- Overall financial summary with KPIs

[View Full Documentation](./financials/README.md)

**Quick Example**:
```typescript
const report = await fetch('/api/reports/financials?start_date=2024-01-01&end_date=2024-12-31');
```

## Common Patterns

### Error Handling
All report endpoints follow consistent error handling:

```typescript
try {
  const response = await fetch('/api/reports/financials');
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Report error:', error.error);
    return;
  }
  
  const report = await response.json();
  // Use report data
} catch (error) {
  console.error('Network error:', error);
}
```

### With SWR (Recommended)
```typescript
import useSWR from 'swr';

const { data: report, error, isLoading } = useSWR(
  '/api/reports/financials',
  fetcher,
  {
    refreshInterval: 600000, // 10 min
    revalidateOnFocus: false,
  }
);
```

### Date Range Filtering
Most reports support date range filtering:

```typescript
// Current year (default)
'/api/reports/financials'

// Custom range
'/api/reports/financials?start_date=2024-01-01&end_date=2024-06-30'

// Last 12 months
const endDate = new Date().toISOString().split('T')[0];
const startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
  .toISOString().split('T')[0];
const url = `/api/reports/financials?start_date=${startDate}&end_date=${endDate}`;
```

## Authentication

All report endpoints require:
1. Valid user session
2. Organization membership

Unauthorized requests return `401 Unauthorized`.

## Response Format

All reports follow a consistent structure:

```typescript
{
  report_date: string;      // ISO timestamp
  date_range: {
    start_date: string;
    end_date: string;
  };
  organization_id: string;
  // ... report-specific data
  summary: {
    // ... aggregated metrics
  }
}
```

## Performance Tips

1. **Cache Reports**: Financial reports can be cached for 5-15 minutes
2. **Use Date Ranges**: Limit data by specifying start/end dates
3. **Parallel Requests**: Fetch multiple reports simultaneously with `Promise.all()`
4. **Background Processing**: For large datasets, consider generating reports in the background

## Future Report Types

Planned report endpoints:

- `/api/reports/assets` - Asset utilization and depreciation
- `/api/reports/invoices` - Invoice aging and payment analysis
- `/api/reports/expenses` - Expense breakdown by category/vendor
- `/api/reports/clients` - Client revenue and payment behavior
- `/api/reports/tax` - Tax-related reports and summaries

## TypeScript Types

Import report types:

```typescript
import type { 
  FinancialReport,
  FinancialReportSummary,
  DateRange 
} from '@/types';
```

## Report Generation Best Practices

### 1. Show Loading States
```typescript
if (isLoading) {
  return <Skeleton className="h-64 w-full" />;
}
```

### 2. Handle Errors Gracefully
```typescript
if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Failed to load report</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
      <Button onClick={() => mutate()}>Retry</Button>
    </Alert>
  );
}
```

### 3. Cache Intelligently
```typescript
// For dashboards - refresh every 10 minutes
const config = { refreshInterval: 600000 };

// For static reports - don't auto-refresh
const config = { revalidateOnFocus: false, revalidateOnReconnect: false };
```

### 4. Export Functionality
```typescript
function exportToCSV(report: FinancialReport) {
  const csv = convertToCSV(report.monthly_pl);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financial-report-${report.date_range.start_date}.csv`;
  a.click();
}
```

## Security

- All reports are scoped to user's organization
- Row-Level Security (RLS) enforced at database level
- No cross-organization data leakage
- Audit logs for report access (future enhancement)

## Support

For issues or questions:
1. Check the specific report's README
2. Review TypeScript types in `types/report.ts`
3. Check database functions in `supabase/functions.sql`

---

**API Version**: 1.0.0  
**Last Updated**: October 2024

