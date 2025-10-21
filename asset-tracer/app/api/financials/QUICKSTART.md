# Financial API - Quick Start Guide

## Test Your API Routes (5 minutes)

### Step 1: Start Your Dev Server

```bash
cd asset-tracer
npm run dev
```

### Step 2: Test in Browser

Open these URLs in your browser (must be logged in):

```
http://localhost:3000/api/financials/summary
http://localhost:3000/api/financials/asset-financials
http://localhost:3000/api/financials/monthly-pl?period=current_year
http://localhost:3000/api/financials/asset-roi-rankings?limit=5
```

You should see JSON responses! 🎉

---

## Quick Test Component

Create `app/(dashboard)/test-financials/page.tsx`:

```typescript
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TestFinancials() {
  const { data: summary } = useSWR('/api/financials/summary', fetcher);
  const { data: assets } = useSWR('/api/financials/asset-financials', fetcher);
  const { data: monthlyPL } = useSWR('/api/financials/monthly-pl?period=last_6_months', fetcher);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Financial API Test</h1>
      
      <section>
        <h2 className="text-xl font-bold mb-4">Summary</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(summary, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Asset Financials</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(assets, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Monthly P&L</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(monthlyPL, null, 2)}
        </pre>
      </section>
    </div>
  );
}
```

Visit: `http://localhost:3000/test-financials`

---

## Expected Response Examples

### Summary API
```json
{
  "data": {
    "current_month_revenue": 0,
    "current_month_expenses": 0,
    "current_month_profit": 0,
    "revenue_growth_percentage": 0,
    "ytd_revenue": 0,
    "total_assets_count": 0,
    "currency": "USD"
  }
}
```

### Asset Financials API
```json
{
  "data": []
}
```

*Empty arrays are normal if you haven't added test data yet!*

---

## Add Test Data

Run in Supabase SQL Editor:

```sql
-- Your org ID (replace with yours!)
DO $$
DECLARE
    org_id UUID := '41fa8bc6-5280-47de-b4d2-dca2540206a8';
BEGIN
    -- Create test asset
    INSERT INTO assets (organization_id, name, category, purchase_cost, current_value, status)
    VALUES (org_id, 'Test Laptop', 'Electronics', 1500, 1200, 'active');
    
    -- Create test transactions
    INSERT INTO transactions (organization_id, type, category, amount, transaction_date, description, created_by)
    VALUES 
        (org_id, 'income', 'services', 2500, CURRENT_DATE, 'Consulting', org_id),
        (org_id, 'expense', 'supplies', 200, CURRENT_DATE, 'Office supplies', org_id),
        (org_id, 'income', 'sales', 1800, CURRENT_DATE - 30, 'Product sales', org_id);
    
    RAISE NOTICE 'Test data created!';
END $$;
```

Refresh the API and you'll see data! 🎉

---

## Common Issues

### "Unauthorized" Error
**Problem**: Not signed in  
**Solution**: Sign in through your app first

### "User is not associated with an organization"
**Problem**: User doesn't have organization_id  
**Solution**: Make sure you created an organization in Supabase

### Empty Data
**Problem**: No financial data exists  
**Solution**: Add test data using the SQL script above

---

## Next Steps

1. ✅ Test all 4 API endpoints
2. ✅ Add test data
3. ✅ Build UI components
4. ✅ Create dashboard with charts
5. ✅ Add to your app navigation

See `README.md` for complete API documentation and React examples.

