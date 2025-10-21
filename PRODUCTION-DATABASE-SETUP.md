# Production Database Setup - Quick Guide

## 🚨 ERROR: relation "assets" does not exist

**This means your production database hasn't been set up yet!**

---

## ✅ Solution: Run These 18 Migrations in Order

### 📍 Where to Run
1. Go to https://supabase.com/dashboard
2. Select your **PRODUCTION** Supabase project
3. Click **"SQL Editor"** in the left sidebar
4. For each file below:
   - Open the file in VS Code
   - Copy ALL contents (`Ctrl+A`, `Ctrl+C`)
   - Paste into Supabase SQL Editor
   - Click **"Run"**
   - Wait for green checkmark ✓
   - Move to next file

---

## 📋 Copy These Files in This Order

### 1️⃣ Base Schema (MOST IMPORTANT!)

```
asset-tracer\supabase\tables-schema.sql
```
**This creates ALL your tables including `assets`**

### 2️⃣ Functions

```
asset-tracer\supabase\functions.sql
```

### 3️⃣ User Setup

```
asset-tracer\supabase\SETUP-USER-ORG.sql
asset-tracer\supabase\CREATE-USER-TRIGGER-V2.sql
```

### 4️⃣ Asset Features

```
asset-tracer\supabase\FIX-ASSETS-SCHEMA.sql
asset-tracer\supabase\add-created-by-to-assets.sql
```

### 5️⃣ User & Company

```
asset-tracer\supabase\ADD-USER-PHONE.sql
asset-tracer\supabase\ADD-COMPANY-PROFILE-FIELDS.sql
asset-tracer\supabase\CREATE-COMPANY-LOGOS-BUCKET.sql
```

### 6️⃣ Payment & Settings

```
asset-tracer\supabase\ADD-PAYMENT-COLUMNS.sql
asset-tracer\supabase\ADD-ORGANIZATION-SETTINGS.sql
```

### 7️⃣ Quotations

```
asset-tracer\supabase\CREATE-QUOTATIONS-TABLES.sql
asset-tracer\supabase\ADD-ASSET-ID-TO-QUOTATION-ITEMS.sql
asset-tracer\supabase\ADD-CONVERTED-TO-INVOICE-COLUMN.sql
asset-tracer\supabase\ADD-SUBJECT-FIELDS.sql
asset-tracer\supabase\ADD-DEFAULT-NOTES-AND-TERMS.sql
asset-tracer\supabase\ADD-INVOICED-STATUS-TO-QUOTATIONS.sql
```

### 8️⃣ Subscriptions

```
COMPLETE-POLAR-MIGRATION.sql
ADD-EMAIL-NOTIFICATIONS.sql
```

### 9️⃣ Team Management

```
asset-tracer\supabase\ADD-TEAM-MANAGEMENT.sql
```

---

## 🎯 Quick Start - First 3 Files

If you just want to get started quickly, run AT LEAST these 3 files:

1. **`asset-tracer\supabase\tables-schema.sql`** ← This fixes your error!
2. **`asset-tracer\supabase\functions.sql`**
3. **`asset-tracer\supabase\SETUP-USER-ORG.sql`**

Then run the remaining 15 files when you have time.

---

## ✅ Verification

After running all migrations, verify in Supabase SQL Editor:

```sql
-- Check if assets table exists
SELECT * FROM assets LIMIT 1;

-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- assets
- clients
- expenses
- inventory_items
- invoices
- invoice_items
- organizations
- quotations
- quotation_items
- team_invitations
- transactions
- users

---

## 🆘 If You Get Errors

### "table already exists"
- Skip that file and move to the next one

### "column already exists"
- Skip that file and move to the next one

### "function already exists"
- Run: `DROP FUNCTION function_name CASCADE;`
- Then run the migration again

### Other errors
- Copy the error message
- Check if it's critical
- Continue with remaining migrations

---

## 💡 Pro Tips

1. **Start with `tables-schema.sql`** - This is the most important!
2. **Run one at a time** - Don't try to run all at once
3. **Wait for confirmation** - Each should show green checkmark
4. **Keep a checklist** - Mark off each file as you complete it
5. **Test after each section** - Verify tables are created

---

## 📱 Checklist

Copy this and check off as you go:

```
Core:
[ ] tables-schema.sql
[ ] functions.sql
[ ] SETUP-USER-ORG.sql
[ ] CREATE-USER-TRIGGER-V2.sql

Assets:
[ ] FIX-ASSETS-SCHEMA.sql
[ ] add-created-by-to-assets.sql

Profiles:
[ ] ADD-USER-PHONE.sql
[ ] ADD-COMPANY-PROFILE-FIELDS.sql
[ ] CREATE-COMPANY-LOGOS-BUCKET.sql

System:
[ ] ADD-PAYMENT-COLUMNS.sql
[ ] ADD-ORGANIZATION-SETTINGS.sql

Quotations:
[ ] CREATE-QUOTATIONS-TABLES.sql
[ ] ADD-ASSET-ID-TO-QUOTATION-ITEMS.sql
[ ] ADD-CONVERTED-TO-INVOICE-COLUMN.sql
[ ] ADD-SUBJECT-FIELDS.sql
[ ] ADD-DEFAULT-NOTES-AND-TERMS.sql
[ ] ADD-INVOICED-STATUS-TO-QUOTATIONS.sql

Billing:
[ ] COMPLETE-POLAR-MIGRATION.sql
[ ] ADD-EMAIL-NOTIFICATIONS.sql

Team:
[ ] ADD-TEAM-MANAGEMENT.sql
```

---

## ⏱️ Time Estimate

- **Minimum (first 3 files):** 5 minutes
- **Complete (all 18 files):** 15-20 minutes
- Each file takes ~1 minute to copy/paste/run

---

## 🎉 When You're Done

Your production database will be fully set up with:
- ✅ All tables created
- ✅ All functions and triggers active
- ✅ RLS policies enabled
- ✅ Ready for production use!

---

## 🚀 After Setup

1. Update your environment variables in Vercel/hosting
2. Deploy your application
3. Test with a real user signup
4. Verify everything works!

---

**Start with `tables-schema.sql` and the error will be fixed!** 🎯

