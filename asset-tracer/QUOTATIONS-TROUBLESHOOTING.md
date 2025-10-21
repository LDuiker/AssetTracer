# Quotations Feature - Troubleshooting Guide

## 🐛 Issue: Intermittent "Failed to fetch quotations" Error

### Symptom
- Page loads successfully at first
- After refresh, shows error again
- Error message: "Failed to fetch quotations"

---

## 🔍 Diagnostic Steps

### Step 1: Check Browser Console
1. Open browser DevTools (Press `F12`)
2. Go to **Console** tab
3. Look for error messages starting with:
   - `Error in GET /api/quotations:`
   - `Error fetching quotations:`
   - `Failed to fetch quotations:`
4. Note the **exact error message** and **error code**

### Step 2: Check Network Tab
1. In DevTools, go to **Network** tab
2. Refresh the page
3. Look for the request to `/api/quotations`
4. Click on it and check:
   - **Status Code** (should be 200, not 500, 401, or 404)
   - **Response** tab - see the exact error message
   - **Preview** tab - see the error details

### Step 3: Run Database Diagnostic
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `supabase/DIAGNOSE-QUOTATIONS.sql`
3. Run the entire script
4. Review the output for:
   - ✅ Tables exist
   - ✅ RLS enabled
   - ✅ Policies created
   - ✅ User has organization
   - ✅ Clients exist

---

## 🔧 Common Issues & Solutions

### Issue 1: Tables Don't Exist
**Symptoms:**
- Error: `relation "quotations" does not exist`
- Network status: 500

**Solution:**
```sql
-- Run this in Supabase SQL Editor
-- File: CREATE-QUOTATIONS-TABLES.sql
```

---

### Issue 2: RLS Policies Not Working
**Symptoms:**
- Error: `permission denied for table quotations`
- Tables exist but can't query them
- Network status: 500

**Solution:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('quotations', 'quotation_items');

-- If rowsecurity is false, enable it
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Re-create policies by running CREATE-QUOTATIONS-TABLES.sql
```

---

### Issue 3: User Not Linked to Organization
**Symptoms:**
- Error: `Organization not found`
- Network status: 404

**Solution:**
```sql
-- Check your user's organization
SELECT id, email, organization_id 
FROM users 
WHERE id = auth.uid();

-- If organization_id is NULL, link yourself to an organization
UPDATE users 
SET organization_id = (SELECT id FROM organizations LIMIT 1)
WHERE id = auth.uid();
```

---

### Issue 4: No Clients Available
**Symptoms:**
- Can't create quotations
- "Client is required" validation error
- Empty client dropdown

**Solution:**
1. Go to `/clients` page
2. Create at least one client
3. Then try creating a quotation

Or via SQL:
```sql
-- Create a test client
INSERT INTO clients (
  organization_id,
  name,
  email,
  company
) VALUES (
  (SELECT organization_id FROM users WHERE id = auth.uid()),
  'Test Client',
  'test@example.com',
  'Test Company'
);
```

---

### Issue 5: Intermittent Server Connection
**Symptoms:**
- Works sometimes, fails other times
- Error: `Failed to fetch`
- Network status: varies

**Possible Causes:**
- Supabase server timeout
- Network connectivity issues
- Browser cache issues

**Solution:**
```bash
# 1. Clear browser cache
# - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# 2. Check Supabase project status
# - Go to Supabase Dashboard
# - Check if project is "Active"

# 3. Restart dev server
npm run dev
```

---

### Issue 6: CORS or Authentication Issues
**Symptoms:**
- Error: `Unauthorized`
- Network status: 401
- Session expired

**Solution:**
1. **Sign out and sign in again**
2. **Check cookie settings** in browser
3. **Verify environment variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. **Restart dev server** after env changes

---

## 🧪 Testing Queries

### Test 1: Can you query quotations table directly?
```sql
SELECT * FROM quotations LIMIT 5;
```
✅ If this works → RLS and permissions are OK  
❌ If this fails → RLS policy issue

### Test 2: Can you insert a quotation?
```sql
-- Get your org and a client
SELECT 
  (SELECT organization_id FROM users WHERE id = auth.uid()) as my_org,
  (SELECT id FROM clients LIMIT 1) as test_client;

-- If both values exist, try insert
INSERT INTO quotations (
  organization_id,
  client_id,
  quotation_number,
  issue_date,
  valid_until,
  status,
  currency,
  subtotal,
  tax_total,
  total,
  created_by
) VALUES (
  (SELECT organization_id FROM users WHERE id = auth.uid()),
  (SELECT id FROM clients LIMIT 1),
  'QUO-2025-TEST',
  CURRENT_DATE,
  CURRENT_DATE + 30,
  'draft',
  'USD',
  100,
  15,
  115,
  auth.uid()
);
```

### Test 3: Can the API fetch quotations?
```bash
# In browser console or terminal
fetch('/api/quotations', {
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

---

## 📊 Expected Behavior

### When Working Correctly:

**Browser Console:**
- No errors
- Network tab shows 200 status for `/api/quotations`
- Response contains `{ quotations: [] }` or `{ quotations: [...]}`

**Page Display:**
- Shows "Showing 0 of 0 quotations" (if empty)
- Shows quotations table (if data exists)
- No error messages

**Database:**
- Tables exist: `quotations`, `quotation_items`
- RLS enabled on both tables
- 8 RLS policies created (4 per table)
- User has valid `organization_id`

---

## 🚨 Error Code Reference

| Status Code | Meaning | Common Cause |
|-------------|---------|--------------|
| 200 | Success | Everything working |
| 401 | Unauthorized | Not logged in / session expired |
| 403 | Forbidden | RLS policy blocked access |
| 404 | Not Found | Organization not found |
| 500 | Server Error | Database error / table missing |

---

## 🎯 Next Steps Based on Error

### If you see: "relation 'quotations' does not exist"
→ Run `CREATE-QUOTATIONS-TABLES.sql`

### If you see: "permission denied for table quotations"
→ Check RLS policies with `DIAGNOSE-QUOTATIONS.sql`

### If you see: "Organization not found"
→ Link user to organization (see Issue 3)

### If you see: "Failed to fetch"
→ Check network connection, Supabase status

### If you see: No specific error, just fails intermittently
→ This is the current issue - let's check:

1. **Open browser console** and note the exact error
2. **Run DIAGNOSE-QUOTATIONS.sql** and share results
3. **Check if clients exist** - quotations need clients
4. **Try creating a quotation** - see what happens

---

## 📝 Checklist for Working Feature

- [ ] Tables `quotations` and `quotation_items` exist
- [ ] RLS is enabled on both tables
- [ ] 8 RLS policies exist (4 per table)
- [ ] Your user has an `organization_id`
- [ ] At least one client exists in your organization
- [ ] Can query `SELECT * FROM quotations`
- [ ] `/api/quotations` returns 200 status
- [ ] No errors in browser console
- [ ] Page loads without error message

---

## 🆘 Still Having Issues?

**Please provide:**
1. **Exact error message** from browser console
2. **Network tab screenshot** showing the failed request
3. **Output** from `DIAGNOSE-QUOTATIONS.sql`
4. **Browser** and version you're using

This will help diagnose the intermittent issue!

---

## ✅ Quick Fix Commands

```sql
-- Run all in Supabase SQL Editor

-- 1. Verify setup
\dt quotations*

-- 2. Check your user
SELECT id, email, organization_id FROM users WHERE id = auth.uid();

-- 3. Count your quotations
SELECT COUNT(*) FROM quotations WHERE organization_id IN (
  SELECT organization_id FROM users WHERE id = auth.uid()
);

-- 4. Check clients
SELECT COUNT(*) FROM clients WHERE organization_id IN (
  SELECT organization_id FROM users WHERE id = auth.uid()
);
```

If all return valid results, the setup is correct and the issue is elsewhere!

