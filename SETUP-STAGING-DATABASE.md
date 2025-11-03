# 🗄️ Setup Staging Database

## Issue: Redirect to Landing Page After Login

This happens when the OAuth trigger is not installed in the staging database, so user profiles aren't being created.

---

## 🚀 **Complete Staging Database Setup**

Run these scripts in **Supabase SQL Editor** for your staging project:
https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/sql

---

## **Step 1: Install OAuth Trigger** (REQUIRED)

**File**: `INSTALL-OAUTH-TRIGGER-NOW.sql`

This creates user profiles automatically when users sign in with Google.

**What it does**:
- Creates `handle_new_user()` function
- Installs trigger on `auth.users` table
- Auto-creates profile + organization on sign-up

---

## **Step 2: Apply RLS Policies** (REQUIRED)

**File**: `FIX-RLS-POLICIES-V2.sql`

This ensures users can access their data securely.

**What it does**:
- Drops old broken policies
- Creates comprehensive RLS policies for all 14 tables
- Enables RLS with correct permissions

---

## **Step 3: Fix Invoice Items RLS** (REQUIRED for quotation conversion)

**File**: `FIX-INVOICE-ITEMS-RLS.sql`

This fixes the quotation-to-invoice conversion feature.

**What it does**:
- Adds RLS policy for `invoice_items` table
- Enables INSERT operations during conversion

---

## **Step 4: Verify Database**

**File**: `DIAGNOSE-OAUTH-ISSUE.sql`

Run this to check everything is working.

**What it checks**:
- ✅ OAuth trigger installed
- ✅ Tables exist
- ✅ RLS policies correct
- ✅ User can access data

---

## 🧪 **Test After Setup**

1. **Delete any test users** from staging database (if any exist)
   ```sql
   -- In Supabase SQL Editor
   DELETE FROM users WHERE email = 'your-test-email@gmail.com';
   ```

2. **Clear browser cache** or use **incognito mode**

3. **Try logging in again** to staging

4. **Expected behavior**:
   - ✅ Login with Google
   - ✅ Auto-create profile
   - ✅ Redirect to dashboard
   - ✅ Dashboard loads with empty data

---

## 📋 **Quick Setup Script Order**

```
1. INSTALL-OAUTH-TRIGGER-NOW.sql       (Creates user profiles)
2. FIX-RLS-POLICIES-V2.sql             (Secures data access)
3. FIX-INVOICE-ITEMS-RLS.sql           (Fixes quotations)
4. DIAGNOSE-OAUTH-ISSUE.sql            (Verifies setup)
```

---

## 🔍 **If Still Failing**

### Check if trigger is installed:
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### Check if user profile exists:
```sql
SELECT u.id, u.email, u.name, u.organization_id, o.name as org_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.email = 'your-email@gmail.com';
```

### Check auth user:
```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'your-email@gmail.com';
```

---

## 🎯 **Expected Result**

After setup:
- ✅ User signs in with Google
- ✅ Profile automatically created in `users` table
- ✅ Organization automatically created in `organizations` table
- ✅ User redirected to dashboard
- ✅ Dashboard shows empty state (no data yet)
- ✅ User can create assets, clients, quotations, etc.

---

## ⚠️ **Staging vs Production**

Remember:
- **Staging database**: `ougntjrrskfsuognjmcw`
- **Production database**: Different project
- They are **completely separate**
- Setting up staging **does not affect** production

---

**Run the 3 required SQL scripts now to fix the redirect issue!**

