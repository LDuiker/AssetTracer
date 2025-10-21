# Top 5 Profitable Assets - Calculation Explained

## Overview
The "Top 5 Profitable Assets" chart on the dashboard shows your most profitable assets ranked by **Profit/Loss**.

## Complete Calculation Chain

### Step 1: Data Collection (PostgreSQL Function)
**Location:** `supabase/functions.sql` → `get_asset_financials()`

#### 1a. Calculate Total Expenses per Asset
```sql
asset_expenses AS (
  SELECT 
    asset_id,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses
  FROM transactions
  WHERE organization_id = org_id
    AND asset_id IS NOT NULL
  GROUP BY asset_id
)
```
**Result:** Sum of all expense transactions linked to each asset

#### 1b. Calculate Total Revenue per Asset
```sql
asset_revenue AS (
  SELECT 
    asset_id,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income
  FROM transactions
  WHERE organization_id = org_id
    AND asset_id IS NOT NULL
  GROUP BY asset_id
)
```
**Result:** Sum of all income transactions linked to each asset

#### 1c. Calculate Total Spend
```sql
total_spend = purchase_cost + total_expenses
```
**Explanation:**
- **Purchase Cost:** Original price when asset was bought
- **Total Expenses:** Sum of all maintenance, repairs, operating costs

**Example:**
- Purchase Cost: BWP 5,000
- Maintenance: BWP 500
- Repairs: BWP 200
- **Total Spend: BWP 5,700**

#### 1d. Calculate Profit/Loss
```sql
profit_loss = total_revenue - total_spend
```

**Formula:**
```
Profit/Loss = Revenue - (Purchase Cost + Expenses)
```

**Example:**
- Total Revenue: BWP 8,000 (from paid invoices)
- Total Spend: BWP 5,700 (from step 1c)
- **Profit/Loss: BWP 2,300** ✅

### Step 2: Sort by Profit/Loss (Dashboard)
**Location:** `app/(dashboard)/dashboard/page.tsx`

```typescript
const top5Assets = useMemo(() => {
  if (!report?.asset_financials) return [];
  return [...report.asset_financials]
    .sort((a, b) => b.profit_loss - a.profit_loss)  // Highest profit first
    .slice(0, 5)  // Take top 5
    .map((asset) => ({
      name: asset.asset_name,
      profit: asset.profit_loss,
    }));
}, [report]);
```

**Sorting Logic:**
- `b.profit_loss - a.profit_loss` = Descending order (highest first)
- Positive profits appear first
- Negative profits (losses) appear last
- Takes only the top 5

### Step 3: Display (Chart)
The chart displays the profit/loss value for each of the top 5 assets.

## Complete Example

Let's say you have these assets:

| Asset | Purchase Cost | Expenses | Revenue | Total Spend | Profit/Loss | Rank |
|-------|---------------|----------|---------|-------------|-------------|------|
| **Parrot Projector** | 5,000 | 700 | 8,000 | 5,700 | **+2,300** | 🥇 #1 |
| **Sound System** | 3,000 | 500 | 5,000 | 3,500 | **+1,500** | 🥈 #2 |
| **LED Screen** | 10,000 | 2,000 | 12,500 | 12,000 | **+500** | 🥉 #3 |
| **Lighting Rig** | 8,000 | 1,000 | 8,200 | 9,000 | **+200** | #4 |
| **Camera Kit** | 6,000 | 800 | 5,000 | 6,800 | **-1,800** | #5 |
| Stage Platform | 4,000 | 500 | 3,000 | 4,500 | -1,500 | - |
| Cable Pack | 200 | 50 | 0 | 250 | -250 | - |

**Top 5 Profitable Assets Chart Shows:**
1. Parrot Projector: +2,300
2. Sound System: +1,500
3. LED Screen: +500
4. Lighting Rig: +200
5. Camera Kit: -1,800

Note: Camera Kit is included even though it has a loss, because it's the 5th asset when sorted by profit.

## Detailed Breakdown

### Component 1: Purchase Cost
- **Source:** `assets.purchase_cost`
- **When recorded:** When asset is created
- **Example:** BWP 5,000

### Component 2: Total Expenses
- **Source:** `transactions` table where `type = 'expense'` and `asset_id = [asset]`
- **When recorded:** When expenses are added to the asset
- **Categories included:**
  - Maintenance
  - Repairs
  - Operating costs
  - Utilities
  - Insurance
  - etc.
- **Example:** BWP 700 (total of all expense transactions)

### Component 3: Total Revenue
- **Source:** `transactions` table where `type = 'income'` and `asset_id = [asset]`
- **When recorded:** 
  - ✅ When invoice is marked as paid (after our fix)
  - When income is manually recorded
- **Example:** BWP 8,000 (from paid invoices linked to asset)

### Component 4: Profit/Loss (The Ranking Metric)
```
Profit/Loss = Total Revenue - (Purchase Cost + Total Expenses)
            = 8,000 - (5,000 + 700)
            = 8,000 - 5,700
            = 2,300
```

## Why Your Asset Might Show 0 Revenue

If an asset shows 0 revenue, it could be because:

1. **No paid invoices linked to the asset**
   - Asset hasn't been used in any quotations/invoices yet
   - Invoices exist but aren't marked as paid

2. **Invoice paid before the fix**
   - Invoices marked as paid BEFORE our transaction-creation fix
   - No transactions were created
   - **Solution:** Run `BACKFILL-INVOICE-TRANSACTIONS.sql`

3. **Asset not linked to quotation items**
   - Invoice created directly (not from quotation)
   - No asset_id in the quotation items
   - **Solution:** Always create quotations with asset links

4. **Income transactions missing**
   - Check: `SELECT * FROM transactions WHERE asset_id = '[your-asset-id]' AND type = 'income'`
   - If empty, no revenue is recorded

## How to Fix Missing Revenue

### Quick Check:
Run this in Supabase SQL Editor:

```sql
-- Replace [asset-id] with your Parrot Projector's ID
SELECT 
  a.name,
  a.purchase_cost,
  -- Expenses
  (SELECT COALESCE(SUM(amount), 0) 
   FROM transactions 
   WHERE asset_id = a.id AND type = 'expense') as expenses,
  -- Revenue
  (SELECT COALESCE(SUM(amount), 0) 
   FROM transactions 
   WHERE asset_id = a.id AND type = 'income') as revenue,
  -- Profit/Loss
  (SELECT COALESCE(SUM(amount), 0) 
   FROM transactions 
   WHERE asset_id = a.id AND type = 'income')
  -
  (a.purchase_cost + 
   (SELECT COALESCE(SUM(amount), 0) 
    FROM transactions 
    WHERE asset_id = a.id AND type = 'expense')) as profit_loss
FROM assets a
WHERE LOWER(a.name) LIKE '%parrot%'
   OR LOWER(a.name) LIKE '%projector%';
```

### If Revenue is 0:
1. Check if invoices were paid before the fix
2. Run `BACKFILL-INVOICE-TRANSACTIONS.sql` to create missing transactions
3. Refresh dashboard

## Formula Summary

### Visual Representation:
```
┌─────────────────────────────────────────────┐
│  TOTAL SPEND                                │
│  = Purchase Cost + All Expenses             │
│  = 5,000 + 700 = 5,700                      │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  TOTAL REVENUE                              │
│  = All Income Transactions                  │
│  = 8,000 (from paid invoices)               │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  PROFIT/LOSS (Used for Top 5 Ranking)       │
│  = Revenue - Total Spend                    │
│  = 8,000 - 5,700 = +2,300 ✅                │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  ROI PERCENTAGE (For reference)             │
│  = (Profit/Loss / Total Spend) × 100        │
│  = (2,300 / 5,700) × 100 = 40.35%           │
└─────────────────────────────────────────────┘
```

## Important Notes

### 1. Includes Negative Profits
The "Top 5" might include assets with losses if you have fewer than 5 profitable assets. This is intentional to always show 5 assets (if you have at least 5).

### 2. Real-Time Updates
- Every time an invoice is marked as paid → Transaction created → Profit updates
- Every time an expense is added → Profit decreases
- Dashboard recalculates when you refresh

### 3. Accurate Only If:
✅ Invoices marked as paid create transactions (our fix)  
✅ Asset is linked to quotation items  
✅ Expenses are recorded with asset_id  

### 4. Asset Must Have Transactions
Assets with no transactions won't appear in the chart because:
- They have 0 profit/loss
- They might be filtered out
- Check if `transaction_count > 0` filter is applied

## Troubleshooting

### Asset Has Revenue but Not in Top 5?
1. Check if 5 other assets have higher profit
2. Sort manually to verify:
   ```sql
   SELECT * FROM get_asset_financials('[org-id]')
   ORDER BY profit_loss DESC;
   ```

### All Assets Show 0 Profit?
1. Check if transactions exist:
   ```sql
   SELECT COUNT(*) FROM transactions WHERE type = 'income';
   ```
2. If 0, run backfill script
3. If > 0, check if transactions have asset_id:
   ```sql
   SELECT COUNT(*) FROM transactions 
   WHERE type = 'income' AND asset_id IS NOT NULL;
   ```

### Profit Doesn't Match Manual Calculation?
1. Check all expense transactions:
   ```sql
   SELECT * FROM transactions 
   WHERE asset_id = '[asset-id]' AND type = 'expense';
   ```
2. Check all income transactions:
   ```sql
   SELECT * FROM transactions 
   WHERE asset_id = '[asset-id]' AND type = 'income';
   ```
3. Verify purchase cost in assets table

## Conclusion

**Top 5 Profitable Assets** = Assets sorted by highest `Profit/Loss` (Revenue - Total Spend), showing the top 5.

The calculation is **mathematically correct** and uses real transactional data from your database. If an asset is showing 0 revenue, it's a data issue (missing transactions), not a calculation issue.

**To fix your Parrot Projector revenue:**
1. Run `VERIFY-ANALYTICS-DATA.sql` to check
2. Run `BACKFILL-INVOICE-TRANSACTIONS.sql` if needed
3. Or create a new quotation → invoice → mark paid to test the fixed flow

