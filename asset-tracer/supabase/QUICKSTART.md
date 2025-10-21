# Quick Start Guide - Supabase Functions

## Setup (5 minutes)

### Step 1: Run SQL Script

1. Open Supabase Dashboard → **SQL Editor**
2. Copy **all contents** of `functions.sql`
3. Paste and click **Run**
4. Wait for "Success. No rows returned" message

### Step 2: Verify

Run this test query:
```sql
SELECT * FROM get_financial_summary('your-org-uuid');
```

If you see data, you're done! 🎉

---

## Quick Reference

### Function 1: Asset Financials
```sql
SELECT * FROM get_asset_financials('org-uuid');
```

Returns: ROI and profitability for each asset

### Function 2: Monthly P&L
```sql
SELECT * FROM get_monthly_pl('org-uuid', '2024-01-01', '2024-12-31');
```

Returns: Monthly revenue, expenses, profit

### Function 3: Financial Summary
```sql
SELECT * FROM get_financial_summary('org-uuid');
```

Returns: Dashboard metrics with growth %

### Function 4: Top Assets by ROI
```sql
SELECT * FROM get_asset_roi_rankings('org-uuid', 10);
```

Returns: Top 10 assets by ROI

---

## API Integration

### Create API Route

`app/api/financials/summary/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const orgId = 'your-org-id'; // Get from user session
  
  const { data, error } = await supabase
    .rpc('get_financial_summary', { org_id: orgId });
  
  return Response.json({ data });
}
```

### Use in Component

```typescript
import useSWR from 'swr';

export function Dashboard() {
  const { data } = useSWR('/api/financials/summary');
  
  return (
    <div>
      <h1>Revenue: ${data?.current_month_revenue}</h1>
      <p>Growth: {data?.revenue_growth_percentage}%</p>
    </div>
  );
}
```

---

## Example Queries

### Get profitable assets
```sql
SELECT asset_name, roi_percentage, profit_loss
FROM get_asset_financials('org-uuid')
WHERE profit_loss > 0
ORDER BY roi_percentage DESC;
```

### Get last 3 months P&L
```sql
SELECT month, total_revenue, total_expenses, net_profit
FROM get_monthly_pl(
    'org-uuid',
    (CURRENT_DATE - INTERVAL '3 months')::date,
    CURRENT_DATE
)
ORDER BY month DESC;
```

### Get top 5 performing assets
```sql
SELECT rank, asset_name, roi_percentage, performance_indicator
FROM get_asset_roi_rankings('org-uuid', 5);
```

---

## Common Issues

**Q: "function does not exist"**
A: Run `functions.sql` in SQL Editor

**Q: "permission denied"**
A: Make sure you're authenticated (logged in)

**Q: Empty results**
A: Check your organization_id is correct

**Q: Slow queries**
A: Run the index creation section in `functions.sql`

---

## What's Created

✅ 4 PostgreSQL functions
✅ 6 performance indexes
✅ 3 RLS security policies
✅ Permissions for authenticated users

---

## Next Steps

1. ✅ Run the SQL script
2. ✅ Test with your org ID
3. ✅ Create API routes
4. ✅ Build dashboard UI
5. ✅ Add charts/visualizations

For detailed docs, see `README.md`

