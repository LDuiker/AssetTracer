# 🚀 Start Here - Supabase Setup

## Quick Setup (2 Steps)

### Step 1: Create Tables ⭐
**Run this in Supabase SQL Editor:**

Copy and paste **ALL** of:
```
asset-tracer/supabase/CLEAN-AND-CREATE.sql
```

This will:
- ✅ Drop any existing tables (fresh start)
- ✅ Create all 8 required tables
- ✅ Create all indexes
- ✅ Enable RLS security

You'll see: **"✅ SETUP COMPLETE!"**

### Step 2: Create Functions
**Run this in Supabase SQL Editor:**

Copy and paste **ALL** of:
```
asset-tracer/supabase/DROP-AND-CREATE-FUNCTIONS.sql
```

This creates 4 database functions for financial analytics.

**Note:** This script drops old functions first (if they exist), then creates new ones with correct types.

**Alternative:** Use `functions.sql` if this is your first time running it.

---

## ✅ Done!

Test it works:
```sql
SELECT * FROM get_financial_summary('your-org-uuid');
```

---

## Files Explained

| File | Purpose | When |
|------|---------|------|
| **CLEAN-AND-CREATE.sql** | ⭐ Use this! Creates fresh tables | **FIRST** |
| **functions.sql** | Creates database functions | **SECOND** |
| complete-schema.sql | Alternative (keeps existing data) | Only if you have data |
| tables-schema.sql | Partial schema | ❌ Don't use |

---

## Troubleshooting

### ❌ "column does not exist"
**Problem:** You have old tables with missing columns  
**Solution:** Use `CLEAN-AND-CREATE.sql` (drops old tables)

### ❌ "relation does not exist"  
**Problem:** Tables not created yet  
**Solution:** Run `CLEAN-AND-CREATE.sql` first

### ❌ "function does not exist"
**Problem:** Functions not created yet  
**Solution:** Run `functions.sql` after tables

---

## ⚠️ Important

`CLEAN-AND-CREATE.sql` will **DELETE ALL DATA** in these tables:
- organizations
- users  
- clients
- assets
- invoices
- transactions
- expenses

Only use it for:
- ✅ Initial setup
- ✅ Development/testing
- ❌ NOT for production with real data!

---

## What Gets Created

### 8 Tables
1. organizations
2. users
3. clients
4. **assets** (with status: active/maintenance/retired/sold)
5. **invoices** (with status: draft/sent/paid/overdue/cancelled)
6. invoice_items
7. **transactions** (with transaction_date)
8. expenses (with status: pending/approved/rejected/paid)

### 4 Functions
1. `get_asset_financials(org_id)` - Asset ROI and profitability
2. `get_monthly_pl(org_id, start, end)` - Monthly profit/loss
3. `get_financial_summary(org_id)` - Dashboard metrics
4. `get_asset_roi_rankings(org_id, limit)` - Top performing assets

### Security
- ✅ Row Level Security enabled
- ✅ Organization-based access control
- ✅ 30+ performance indexes

---

## Next Steps

After running both scripts:
1. ✅ Create API routes in Next.js (`app/api/financials/*`)
2. ✅ Build dashboard UI
3. ✅ Add charts and visualizations
4. ✅ Test with sample data

---

## Need Help?

See detailed docs:
- `README.md` - Full documentation
- `FIX-STATUS-COLUMN.md` - Common fixes
- `FIXED-COLUMN-NAMES.md` - Reserved keyword fixes

