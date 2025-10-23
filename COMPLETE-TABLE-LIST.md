# Complete Table List for AssetTracer Production Database

## ✅ Tables You SHOULD Have (11 Total)

### **Base Tables** (from `complete-schema.sql`) - 8 tables
1. **organizations** - Company/organization data
2. **users** - User profiles
3. **clients** - Customer/client information
4. **assets** - Asset management
5. **invoices** - Invoice headers
6. **invoice_items** - Invoice line items
7. **transactions** - Financial transactions
8. **expenses** - Business expenses

### **Additional Tables** (from migrations) - 3 tables
9. **quotations** - Client quotations (from `CREATE-QUOTATIONS-TABLES.sql`)
10. **quotation_items** - Quotation line items (from `CREATE-QUOTATIONS-TABLES.sql`)
11. **team_invitations** - Team member invitations (from `ADD-TEAM-MANAGEMENT.sql`)

---

## ❌ Tables That DON'T Exist

- **organization_members** - NOT used in your app
- **subscriptions** - NOT used in your app

**Why?** Your app stores subscription data **in the organizations table**, not a separate subscriptions table:
- `organizations.subscription_tier` (free/pro/business)
- `organizations.subscription_status` (active/cancelled/expired)
- `organizations.stripe_customer_id`
- `organizations.stripe_subscription_id`

---

## 🔍 Check Your Current Tables

Run this in Supabase SQL Editor:

```sql
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN tablename IN ('organizations', 'users', 'clients', 'assets', 
                       'invoices', 'invoice_items', 'transactions', 'expenses',
                       'quotations', 'quotation_items', 'team_invitations') 
    THEN '✅ Should exist'
    ELSE '⚠️ Unknown table'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 📋 Missing Tables? Run These Migrations (In Order)

### If you're missing quotations tables:
```bash
# Run in Supabase SQL Editor
asset-tracer/supabase/CREATE-QUOTATIONS-TABLES.sql
```

### If you're missing team_invitations:
```bash
# Run in Supabase SQL Editor
asset-tracer/supabase/ADD-TEAM-MANAGEMENT.sql
```

### If organizations table is missing subscription columns:
```bash
# Run in Supabase SQL Editor
asset-tracer/supabase/ADD-SUBSCRIPTION-TIER.sql
```

### If users table is missing role column:
```bash
# Already added by ADD-TEAM-MANAGEMENT.sql
```

---

## 🎯 Quick Check Script

```sql
-- Count all your tables
SELECT COUNT(*) as total_tables
FROM pg_tables
WHERE schemaname = 'public';

-- Should return: 11

-- List all tables with row counts
SELECT 
  tablename,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT 
    tablename,
    query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I.%I', 
                        schemaname, tablename), false, true, '') as xml_count
  FROM pg_tables
  WHERE schemaname = 'public'
) t
ORDER BY tablename;
```

---

## 💡 Summary

You DON'T need `organization_members` or `subscriptions` tables. They're not part of your application design!

**Expected tables: 11**
- 8 base tables
- 2 quotation tables
- 1 team invitation table

