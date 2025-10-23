# Fix: OAuth Redirecting to Landing Page After Login

## 🐛 Problem

After successfully logging in with Google OAuth, you're redirected back to the landing page instead of the dashboard.

**What's happening**:
```
1. Click "Continue with Google" ✅
2. Select Google account ✅
3. OAuth callback completes ✅
4. Redirected to... landing page ❌ (should be dashboard!)
```

---

## 🎯 Root Cause

When you sign in with Google OAuth:
1. ✅ Supabase creates an entry in `auth.users` (authentication)
2. ❌ **BUT** no entry is created in `public.users` (user profile)
3. ❌ Your app looks for the user in `public.users` and doesn't find it
4. ❌ The app thinks you're not logged in and redirects to landing page

**The Missing Piece**: A database trigger to automatically create user records on OAuth sign-up!

---

## ✅ SOLUTION: Add Database Trigger

I've created a SQL script that adds a trigger to automatically create user records when someone signs up via OAuth.

### Step 1: Go to Supabase SQL Editor

1. Go to: **https://supabase.com/dashboard**
2. Select your **PRODUCTION** project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Run the Trigger Script

1. Open the file: `asset-tracer/supabase/OAUTH-USER-AUTO-CREATE.sql`
2. Copy ALL the contents
3. Paste into the Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)

### Step 3: Verify the Trigger Was Created

Run this verification query in the SQL Editor:

```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

**Expected result**: You should see one row showing the trigger details.

---

## 🧪 Test Again

Now that the trigger is in place:

1. **Delete your existing incomplete user** (if any):
   ```sql
   -- In Supabase SQL Editor
   DELETE FROM auth.users WHERE email = 'your-email@gmail.com';
   ```

2. **Open an incognito window** (Ctrl+Shift+N)

3. **Go to your app**: `https://your-app.vercel.app`

4. **Click "Continue with Google"**

5. **Select your Google account**

6. **You should now be redirected to the dashboard!** ✅

### What the Trigger Does Automatically:

```
When you sign in with Google OAuth:
├─ Supabase creates entry in auth.users ✅
├─ ✨ TRIGGER FIRES! ✨
├─ Creates new organization for you ✅
├─ Creates user record in public.users ✅
├─ Links user to organization ✅
└─ Sets you as 'owner' ✅

Result: Dashboard loads successfully! 🎉
```

---

## 🔍 How the Trigger Works

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**The `handle_new_user()` function**:
1. Gets your email and name from Google
2. Creates a new organization (e.g., "John's Organization")
3. Creates your user record with:
   - Your email
   - Your full name (from Google)
   - Role: 'owner'
   - Subscription: 'free' (to start)
   - Link to the new organization
4. Saves your Google avatar URL

All of this happens **automatically** the moment you sign in with OAuth!

---

## 🎯 For Existing Users

If you already tried to sign in and got redirected to the landing page:

### Option 1: Delete and Re-Create Account

```sql
-- In Supabase SQL Editor
DELETE FROM auth.users WHERE email = 'your-email@gmail.com';
```

Then sign in again with Google OAuth - the trigger will create everything correctly.

### Option 2: Manually Create User Record

If you want to keep the existing auth entry:

```sql
-- In Supabase SQL Editor
DO $$
DECLARE
  new_org_id UUID;
  auth_user_id UUID;
  user_email TEXT;
BEGIN
  -- Get your auth user ID
  SELECT id, email INTO auth_user_id, user_email
  FROM auth.users
  WHERE email = 'your-email@gmail.com'
  LIMIT 1;

  -- Create organization
  INSERT INTO organizations (name, slug, settings)
  VALUES (
    'My Organization',
    'my-org-' || substr(auth_user_id::text, 1, 8),
    '{"currency": "USD", "timezone": "UTC"}'::jsonb
  )
  RETURNING id INTO new_org_id;

  -- Create user record
  INSERT INTO users (id, email, full_name, role, organization_id, subscription_tier, subscription_status)
  VALUES (
    auth_user_id,
    user_email,
    'Your Name',
    'owner',
    new_org_id,
    'free',
    'active'
  );

  RAISE NOTICE 'User created successfully!';
END $$;
```

Replace `'your-email@gmail.com'` and `'Your Name'` with your actual details.

---

## 📋 Quick Checklist

- [ ] Middleware updated (commit `f505845`) - ✅ Already done!
- [ ] OAuth trigger script created (`OAUTH-USER-AUTO-CREATE.sql`)
- [ ] Opened Supabase SQL Editor
- [ ] Ran the trigger script
- [ ] Verified trigger was created
- [ ] Tested OAuth login in incognito
- [ ] Successfully redirected to dashboard ✅

---

## 🐛 Troubleshooting

### Still redirecting to landing page?

**Check 1**: Verify the trigger exists
```sql
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
```

**Check 2**: Check if user was created
```sql
SELECT * FROM users WHERE email = 'your-email@gmail.com';
```

**Check 3**: Check Supabase logs
- Go to Supabase Dashboard → Logs → Postgres Logs
- Look for any errors during sign-in

**Check 4**: Clear browser cache
- Use incognito mode
- Or clear cookies for your app domain

### Getting database errors?

**Error**: "relation 'organizations' does not exist"
- You need to run the `complete-schema.sql` first
- See: `PRODUCTION-DATABASE-SETUP.md`

**Error**: "permission denied"
- The trigger function uses `SECURITY DEFINER`
- It should have the necessary permissions
- Check RLS policies aren't blocking the insert

### Vercel deployment not picking up changes?

Wait for the deployment to complete:
- Go to Vercel dashboard
- Check that latest commit (`f505845`) is deployed
- If not, manually redeploy

---

## 💡 Why This Approach?

**Alternative approaches considered**:

1. **Create user manually via API after OAuth** ❌
   - Adds latency
   - Can fail silently
   - Extra API call needed

2. **Check and create user in middleware** ❌
   - Runs on every request
   - Performance impact
   - Complex logic

3. **Database trigger (CHOSEN)** ✅
   - Automatic
   - No extra API calls
   - Runs only once per user
   - Guaranteed to execute
   - Standard PostgreSQL pattern

---

## 🎉 Expected Result

**Before Fix**:
```
1. Sign in with Google
2. OAuth completes
3. App checks for user in public.users
4. User not found ❌
5. Redirected to landing page ❌
```

**After Fix**:
```
1. Sign in with Google
2. OAuth completes
3. ✨ Trigger creates user + organization ✨
4. App checks for user in public.users
5. User found ✅
6. Redirected to dashboard ✅
7. You're logged in and ready to go! 🎉
```

---

## 🔒 Security Notes

The trigger function uses `SECURITY DEFINER`, which means:
- It runs with the permissions of the function creator
- It can insert into `users` and `organizations` tables
- It bypasses RLS policies (necessary for setup)
- **This is safe** because it only creates records for authenticated users

---

## 📝 Summary

**Problem**: OAuth users weren't getting user records created  
**Solution**: Database trigger that auto-creates user records  
**Result**: OAuth login works perfectly, users land on dashboard  

**Files Modified**:
- ✅ `middleware.ts` - Added OAuth callback to public routes
- ✅ `OAUTH-USER-AUTO-CREATE.sql` - New trigger script

**Steps to Fix**:
1. Run `OAUTH-USER-AUTO-CREATE.sql` in Supabase SQL Editor
2. Test OAuth login
3. Success! 🎉

---

**Last Updated**: October 22, 2025  
**Status**: ⏳ Awaiting Trigger Deployment

