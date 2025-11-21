# 🔐 Production OAuth Flow Test Guide

**Purpose:** Verify Google OAuth authentication works correctly in production environment

**Date:** 2025-11-21

---

## ✅ **Pre-Test Checklist**

Before testing, verify these are configured:

- [x] Site URL: `https://www.asset-tracer.com` ✅
- [x] Redirect URLs configured ✅
- [x] Google OAuth provider enabled ✅
- [x] Client ID and Client Secret configured ✅

---

## 🧪 **Test Steps**

### Step 1: Clear Browser State

**Important:** Use a fresh browser session or incognito window to avoid cached sessions

1. Open a new **Incognito/Private window** (or clear cookies for `www.asset-tracer.com`)
2. This ensures you're testing a fresh authentication flow

---

### Step 2: Access Login Page

1. Navigate to: `https://www.asset-tracer.com/login`
2. **Expected:** Login page loads without errors
3. **Check:** "Sign in with Google" button is visible and clickable

**Status:** ⏳ Pending

---

### Step 3: Initiate OAuth Flow

1. Click **"Sign in with Google"** button
2. **Expected:** Redirect to Google sign-in page
3. **Check:** Google sign-in page shows your app name/logo

**Status:** ⏳ Pending

---

### Step 4: Complete Google Authentication

1. Select your Google account (or sign in)
2. Review permissions requested by the app
3. Click **"Allow"** or **"Continue"**
4. **Expected:** Google redirects back to your app

**Status:** ⏳ Pending

---

### Step 5: Verify OAuth Callback

1. **Expected Redirect:** `https://www.asset-tracer.com/auth/callback?code=...`
2. **Check Browser Console (F12):**
   - No JavaScript errors
   - No authentication errors
   - Session creation successful

**Status:** ⏳ Pending

---

### Step 6: Verify Dashboard Redirect

1. **Expected:** Automatic redirect to `https://www.asset-tracer.com/dashboard`
2. **Check:** Dashboard loads successfully
3. **Verify:** User is logged in (check for user profile/name in UI)

**Status:** ⏳ Pending

---

### Step 7: Verify User Profile Created

**In Supabase Dashboard → Table Editor → users:**

1. Check if a new user record was created
2. **Verify:**
   - User `id` matches the authenticated user
   - `email` is correct
   - `name` is populated
   - `organization_id` is set

**Status:** ⏳ Pending

---

### Step 8: Verify Organization Created

**In Supabase Dashboard → Table Editor → organizations:**

1. Check if a new organization was created
2. **Verify:**
   - Organization `id` matches user's `organization_id`
   - Organization `name` is set (defaults to user's name or email)
   - Organization has default settings

**Status:** ⏳ Pending

---

### Step 9: Test Logout and Re-login

1. Click **Logout** (if available)
2. Navigate back to `/login`
3. Click **"Sign in with Google"** again
4. **Expected:** 
   - Should recognize existing account
   - Should redirect directly to dashboard (no new org created)
   - Should use existing organization

**Status:** ⏳ Pending

---

## ✅ **Success Criteria**

All of these must pass:

- [ ] Login page loads without errors
- [ ] Google OAuth redirect works
- [ ] User can complete Google sign-in
- [ ] Callback redirects to dashboard
- [ ] Dashboard loads successfully
- [ ] User profile is created in database
- [ ] Organization is created in database
- [ ] Re-login works with existing account

---

## ❌ **Common Issues & Solutions**

### Issue 1: Redirect Loop

**Symptoms:** Page keeps redirecting between `/login` and `/auth/callback`

**Possible Causes:**
- OAuth trigger not installed
- User exists in `auth.users` but not in `public.users` (orphaned user)
- RLS policies blocking access

**Solution:** Check Supabase logs and verify OAuth trigger is installed

---

### Issue 2: "Invalid Redirect URL"

**Symptoms:** Google shows error about redirect URL not being registered

**Possible Causes:**
- Redirect URL not added to Supabase
- Redirect URL typo or mismatch

**Solution:** Verify redirect URLs in Supabase Dashboard → Authentication → URL Configuration

---

### Issue 3: Dashboard Shows Blank/Error

**Symptoms:** Redirects to dashboard but shows error or blank page

**Possible Causes:**
- Organization not created
- RLS policies blocking data access
- Missing user profile

**Solution:** Check Supabase logs and verify user/organization records exist

---

### Issue 4: "User Already Exists" Error

**Symptoms:** Error when trying to create account for existing user

**Possible Causes:**
- User exists in `auth.users` but profile creation failed
- OAuth trigger failed

**Solution:** Check OAuth trigger logs in Supabase

---

## 📋 **Test Results**

**Test Date:** _______________

**Tester:** _______________

**Environment:** Production (`https://www.asset-tracer.com`)

**Results:**

| Step | Status | Notes |
|------|--------|-------|
| 1. Clear Browser | ⏳ | |
| 2. Access Login | ⏳ | |
| 3. Initiate OAuth | ⏳ | |
| 4. Complete Google Auth | ⏳ | |
| 5. Verify Callback | ⏳ | |
| 6. Verify Dashboard | ⏳ | |
| 7. Verify User Profile | ⏳ | |
| 8. Verify Organization | ⏳ | |
| 9. Test Re-login | ⏳ | |

**Overall Status:** ⏳ Pending

**Issues Found:** _______________

**Resolution:** _______________

---

## 🔍 **Debugging Commands**

If issues occur, run these in Supabase SQL Editor:

### Check OAuth Trigger
```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Check for Orphaned Users
```sql
SELECT 
  au.id,
  au.email,
  CASE WHEN u.id IS NULL THEN '❌ NO PROFILE' ELSE '✅ Has profile' END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
ORDER BY au.created_at DESC
LIMIT 10;
```

### Check Recent Organizations
```sql
SELECT 
  id,
  name,
  created_at
FROM organizations
ORDER BY created_at DESC
LIMIT 5;
```

---

**Last Updated:** 2025-11-21

