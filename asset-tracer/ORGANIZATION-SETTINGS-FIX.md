# Organization Settings Error Fix

## 🐛 Error: "Cannot coerce the result to a single JSON object"

This error occurs because the organizations table needs RLS (Row Level Security) policies to allow users to update their organization.

---

## 🔧 Quick Fix

### Run This SQL in Supabase

**File**: `supabase/ADD-ORGANIZATION-SETTINGS.sql`

This script now includes:
1. ✅ Adds organization settings columns
2. ✅ Enables RLS on organizations table
3. ✅ Creates policy to read your organization
4. ✅ Creates policy to update your organization
5. ✅ Verifies everything is set up

---

## 📝 What the Script Does

### 1. Adds Columns
```sql
ALTER TABLE organizations ADD COLUMN default_currency TEXT DEFAULT 'USD';
ALTER TABLE organizations ADD COLUMN default_tax_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE organizations ADD COLUMN timezone TEXT DEFAULT 'America/New_York';
ALTER TABLE organizations ADD COLUMN date_format TEXT DEFAULT 'MM/DD/YYYY';
```

### 2. Enables RLS
```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
```

### 3. Creates Read Policy
```sql
CREATE POLICY "organizations_select_own" ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );
```

**Translation**: Users can read organizations where they are a member.

### 4. Creates Update Policy
```sql
CREATE POLICY "organizations_update_own" ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );
```

**Translation**: Users can update organizations where they are a member.

---

## 🚀 How to Apply

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Click "SQL Editor" in sidebar
3. Click "New Query"

### Step 2: Run the Script
1. Copy entire contents of `supabase/ADD-ORGANIZATION-SETTINGS.sql`
2. Paste into SQL Editor
3. Click "Run"

### Step 3: Look for Success Messages
```
✅ Added default_currency column
✅ Added default_tax_rate column
✅ Added timezone column
✅ Added date_format column
✅ Organization settings columns added successfully!
✅ RLS policies created for organization access
ℹ️ You can now save organization preferences in Settings
```

### Step 4: Test Organization Settings
1. Go to Settings → Organization tab
2. Change currency to BWP
3. Click "Save Changes"
4. ✅ Should work now!
5. ✅ Page reloads
6. ✅ All values show in BWP

---

## 🔍 Why This Error Happened

### The Problem
Without RLS policies, Supabase blocks the update query by default when RLS is enabled, or returns unexpected results.

### The Solution
RLS policies explicitly allow:
- ✅ Users to **read** their organization's data
- ✅ Users to **update** their organization's settings
- ✅ Users to **NOT** access other organizations (security)

---

## ✅ Expected Behavior After Fix

### Currency Change Flow
```
1. User changes currency to BWP
2. Clicks "Save Changes"
3. API updates organizations table ✅
4. Success toast appears ✅
5. Page reloads
6. All amounts show in BWP:
   - Dashboard: P 12,500 (instead of $12,500)
   - Invoices: P amounts
   - Expenses: P amounts
   - Reports: P amounts
```

### Tax Rate Change Flow
```
1. User changes tax rate to 15%
2. Clicks "Save Changes"
3. Saves to database ✅
4. New invoices default to 15% tax ✅
```

---

## 🧪 Verification Steps

### After Running Script

1. **Verify Columns**:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'organizations';
```

Should show:
- default_currency
- default_tax_rate
- timezone
- date_format

2. **Verify Policies**:
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'organizations';
```

Should show:
- organizations_select_own (SELECT)
- organizations_update_own (UPDATE)

3. **Test Update**:
   - Go to Settings → Organization
   - Change any setting
   - Click Save
   - ✅ Should work without errors

---

## 🎯 Currency Formatting

### How Currency Works

**Organization Setting**: Stored in `organizations.default_currency`

**Components That Use It**:
- Dashboard KPIs
- Asset values
- Invoice totals
- Expense amounts
- Financial reports

**Formatting**:
```javascript
new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BWP',  // From organization settings
}).format(amount);

// USD: $12,500
// BWP: P 12,500
// EUR: €12,500
// GBP: £12,500
// ZAR: R 12,500
```

---

## ⚠️ Important Notes

### Page Reload on Currency Change
When you change currency and save, the page automatically reloads. This ensures:
- ✅ All components use new currency
- ✅ No cached old currency values
- ✅ Consistent formatting everywhere

### Organization vs User Settings
- **Organization Settings**: Affect all users in the organization
- **User Settings**: Only affect individual user
- **Currency, Tax, Timezone**: Organization-wide
- **Name, Phone**: User-specific

---

## 🎉 Summary

**Problem**: "Cannot coerce the result to a single JSON object"  
**Root Cause**: Missing RLS policies on organizations table  
**Solution**: Run `ADD-ORGANIZATION-SETTINGS.sql`  
**Result**: Organization settings work perfectly  

---

**Run the updated SQL script and your organization settings will save successfully!** 🚀✨

