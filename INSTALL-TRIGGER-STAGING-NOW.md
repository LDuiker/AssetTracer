# 🚨 INSTALL OAUTH TRIGGER IN STAGING - DO THIS NOW

## ⚠️ Problem
You're redirected to landing page after Google login = **OAuth trigger is NOT installed in staging**

---

## ✅ SOLUTION (2 Steps)

### **STEP 1: Install the Trigger**

1. Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/sql/new
2. Copy and paste **INSTALL-OAUTH-TRIGGER-NOW.sql** (located in project root)
3. Click **RUN**
4. You should see: `✅ OAuth trigger installed successfully!`

---

### **STEP 2: Fix Orphaned User (You)**

You already signed in with Google, so you exist in `auth.users` but NOT in `public.users`.

Run this SQL to fix YOUR account:

```sql
-- Fix orphaned user (creates profile for existing auth.users)
DO $$
DECLARE
  new_org_id UUID;
  auth_user_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get your auth.users details
  SELECT 
    au.id,
    au.email,
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name',
      split_part(au.email, '@', 1)
    )
  INTO auth_user_id, user_email, user_name
  FROM auth.users au
  LEFT JOIN users u ON au.id = u.id
  WHERE u.id IS NULL
  LIMIT 1;

  IF auth_user_id IS NOT NULL THEN
    -- Create organization
    INSERT INTO organizations (
      name, default_currency, timezone, date_format
    )
    VALUES (
      user_name || '''s Organization',
      'USD', 'UTC', 'MM/DD/YYYY'
    )
    RETURNING id INTO new_org_id;

    -- Create user profile
    INSERT INTO users (id, email, name, organization_id)
    VALUES (auth_user_id, user_email, user_name, new_org_id);

    RAISE NOTICE '✅ Profile created for: %', user_email;
  ELSE
    RAISE NOTICE '❌ No orphaned users found';
  END IF;
END $$;
```

---

### **STEP 3: Test**

1. Open **NEW incognito window**
2. Go to: https://assettracer-staging.vercel.app
3. Click "Continue with Google"
4. **You should now reach the dashboard!**

---

## 📋 What This Does

1. **INSTALL-OAUTH-TRIGGER-NOW.sql** - Installs the trigger so FUTURE signups work automatically
2. **Fix orphaned user SQL** - Creates profile for YOUR existing account
3. After both run, you can login and reach dashboard

---

## ⚠️ If Still Issues

If you still get redirected to landing page after running BOTH SQLs:
- Clear browser cache (Ctrl+Shift+Delete)
- Use incognito window
- Check Vercel deployed latest commit (manual redeploy if needed)

