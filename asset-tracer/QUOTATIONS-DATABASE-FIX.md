# Quotations Database Fix - Missing Tables

## 🐛 Issue
**Error**: "Failed to fetch quotations"

**Root Cause**: The `quotations` and `quotation_items` tables don't exist in the database yet. The quotations feature was fully implemented in the codebase, but the database schema was never created.

---

## ✅ Solution

### Step 1: Create the Quotations Tables

Run the following SQL script in your **Supabase SQL Editor**:

**File**: `supabase/CREATE-QUOTATIONS-TABLES.sql`

This script will:
- ✅ Create `quotations` table
- ✅ Create `quotation_items` table
- ✅ Add indexes for performance
- ✅ Enable Row Level Security (RLS)
- ✅ Create RLS policies for organization scoping
- ✅ Add `updated_at` triggers
- ✅ Grant permissions to authenticated users

---

## 📋 Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/CREATE-QUOTATIONS-TABLES.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. Wait for success messages

You should see:
```
✅ Quotations tables created successfully!
📋 Tables created: quotations, quotation_items
🔒 RLS policies enabled
⚡ Indexes created for performance
🔄 Triggers created for updated_at
🎉 You can now create quotations in Asset Tracer!
```

### Option 2: Using Supabase CLI

```bash
# Navigate to your project directory
cd asset-tracer

# Run the migration script
supabase db execute --file supabase/CREATE-QUOTATIONS-TABLES.sql
```

---

## 🧪 Verify Installation

After running the script, you can verify the tables were created:

### Option A: Run Test Script
```sql
-- Run this in Supabase SQL Editor
\dt quotations*
```

### Option B: Use the Test File
Run `supabase/TEST-QUOTATIONS.sql` to:
- Verify tables exist
- Check RLS policies
- View table structure
- See record counts

---

## 📊 Database Schema

### `quotations` Table
```sql
id                 UUID PRIMARY KEY
organization_id    UUID (FK → organizations)
client_id          UUID (FK → clients)
quotation_number   VARCHAR(50) UNIQUE
issue_date         DATE
valid_until        DATE
status             VARCHAR(20) (draft, sent, accepted, rejected, expired)
currency           VARCHAR(3)
subtotal           DECIMAL(12,2)
tax_total          DECIMAL(12,2)
total              DECIMAL(12,2)
notes              TEXT
terms              TEXT
created_by         UUID (FK → users)
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

### `quotation_items` Table
```sql
id             UUID PRIMARY KEY
quotation_id   UUID (FK → quotations, CASCADE DELETE)
description    TEXT
quantity       DECIMAL(10,2)
unit_price     DECIMAL(12,2)
tax_rate       DECIMAL(5,2)
amount         DECIMAL(12,2)
tax_amount     DECIMAL(12,2)
total          DECIMAL(12,2)
created_at     TIMESTAMP
updated_at     TIMESTAMP
```

---

## 🔒 Security (RLS Policies)

All policies ensure users can only access quotations from their own organization:

### Quotations Policies
- `quotations_select_policy` - Users can view their org's quotations
- `quotations_insert_policy` - Users can create quotations for their org
- `quotations_update_policy` - Users can update their org's quotations
- `quotations_delete_policy` - Users can delete their org's quotations

### Quotation Items Policies
- `quotation_items_select_policy` - View items from org's quotations
- `quotation_items_insert_policy` - Add items to org's quotations
- `quotation_items_update_policy` - Update items in org's quotations
- `quotation_items_delete_policy` - Delete items from org's quotations

---

## 🚀 After Running the Script

Once the tables are created, the quotations feature will work immediately:

1. **Refresh your browser** on the quotations page
2. The error "Failed to fetch quotations" should be gone
3. You should see an empty quotations table
4. Click **"Create Quotation"** to add your first quotation!

---

## 🎯 Testing the Feature

### Create Your First Quotation

1. Go to `/quotations` page
2. Click **"Create Quotation"**
3. Fill in the form:
   - Select a client (create one first if needed)
   - Set issue date and valid until date
   - Add line items (description, quantity, unit price, tax rate)
   - Watch totals calculate automatically
4. Click **"Create Quotation"**
5. See your quotation with auto-generated number (QUO-2025-0001)

### Try All Features
- ✅ Create quotation
- ✅ Edit quotation
- ✅ Delete quotation
- ✅ Search quotations
- ✅ Filter by status
- ✅ View statistics

---

## 🔧 Troubleshooting

### Error: "relation 'quotations' does not exist"
**Solution**: The SQL script hasn't been run yet. Go to Supabase SQL Editor and run `CREATE-QUOTATIONS-TABLES.sql`.

### Error: "permission denied for table quotations"
**Solution**: RLS policies might not be set up correctly. Re-run the script to recreate policies.

### Error: "organization_id cannot be null"
**Solution**: Make sure your user is linked to an organization. Check with:
```sql
SELECT id, email, organization_id 
FROM users 
WHERE id = auth.uid();
```

### No quotations showing up
**Solution**: Check RLS policies are working:
```sql
-- This should return your quotations
SELECT * FROM quotations 
WHERE organization_id IN (
  SELECT organization_id FROM users WHERE id = auth.uid()
);
```

---

## 📝 What This Fixes

### Before Fix:
- ❌ Quotations page showed "Failed to fetch quotations"
- ❌ Database queries failed with "table doesn't exist"
- ❌ API returned 500 errors

### After Fix:
- ✅ Quotations page loads successfully
- ✅ Database queries work
- ✅ API returns data correctly
- ✅ Full CRUD functionality works
- ✅ Auto quotation numbering works
- ✅ Real-time calculations work
- ✅ Search and filtering work

---

## 🎉 Summary

**Problem**: Missing database tables  
**Solution**: Run `CREATE-QUOTATIONS-TABLES.sql`  
**Time to Fix**: < 1 minute  
**Result**: Fully functional quotations feature ✨

---

## Next Steps

After fixing the database:

1. ✅ **Test the quotations page** - Create a few quotations
2. ✅ **Verify auto-numbering** - Check QUO-2025-XXXX format
3. ✅ **Test all CRUD operations** - Create, edit, delete
4. ✅ **Check statistics** - View KPI cards
5. ✅ **Try search/filter** - Test different statuses

---

**🚀 Once the script is run, your quotations feature will be fully operational!**

