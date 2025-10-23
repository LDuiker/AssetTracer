# How to Delete Auth Users Correctly in Supabase

## 🔒 The Problem

You **cannot** delete from `auth.users` directly via SQL because:
- It's protected by Supabase's auth system
- Direct SQL `DELETE FROM auth.users` doesn't work
- You need to use Supabase's admin interface or API

---

## ✅ METHOD 1: Delete via Supabase Dashboard (EASIEST)

### Step 1: Go to Authentication

1. **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your **PRODUCTION** project
3. Click **"Authentication"** in the left sidebar
4. Click **"Users"**

### Step 2: Find and Delete the User

1. You'll see a list of all users
2. Find your email address
3. Click the **⋯** (three dots) or hover over the row
4. Click **"Delete user"**
5. Confirm the deletion
6. **Wait 10 seconds** for deletion to complete

### Step 3: Verify

1. Refresh the Users page
2. Your email should be gone ✅

---

## ✅ METHOD 2: Use Supabase SQL Admin Function

If Method 1 doesn't work, use this SQL (it uses Supabase's admin API):

```sql
-- This uses Supabase's built-in admin function
SELECT auth.delete_user_by_email('your-email@gmail.com');
```

**If that doesn't exist**, try this:

```sql
-- Alternative: Use the admin API
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = 'your-email@gmail.com';
  
  IF user_id IS NOT NULL THEN
    -- Delete from public.users first
    DELETE FROM public.users WHERE id = user_id;
    
    -- Then delete from auth schema using service role
    DELETE FROM auth.users WHERE id = user_id;
    
    RAISE NOTICE 'Deleted user: %', user_id;
  ELSE
    RAISE NOTICE 'User not found';
  END IF;
END $$;
```

---

## ✅ METHOD 3: Use Supabase Service Role (If SQL doesn't work)

The SQL might not work because you need **service role** permissions to delete from `auth.users`.

### Create a Quick API Script

Create a file called `delete-user.js` in your project:

```javascript
// delete-user.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseServiceKey = 'your-service-role-key'; // From .env.production

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUser(email) {
  try {
    // Get user by email
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) throw fetchError;
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.log('User not found:', email);
      return;
    }
    
    console.log('Found user:', user.id, user.email);
    
    // Delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) throw deleteError;
    
    console.log('✅ User deleted successfully:', email);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Replace with your email
deleteUser('your-email@gmail.com');
```

Then run:
```bash
cd asset-tracer
node delete-user.js
```

---

## 🎯 RECOMMENDED: Use Dashboard Method

**The easiest and most reliable method is Method 1** (Dashboard):

1. ✅ Supabase Dashboard → Authentication → Users
2. ✅ Find your email
3. ✅ Click ⋯ → Delete user
4. ✅ Done!

---

## 🔄 After Deleting

Once the user is deleted:

1. **Wait 30 seconds** for Supabase to fully process
2. **Clear browser cache** or use incognito
3. Go to: `https://www.asset-tracer.com`
4. Click **"Continue with Google"**
5. **This time it will be a NEW user creation**
6. The trigger will fire ✅
7. Profile and organization will be created ✅
8. You'll land on dashboard ✅

---

## 🐛 If Dashboard Delete Doesn't Work

Sometimes the dashboard has caching issues. Try:

1. **Hard refresh**: Ctrl+Shift+R
2. **Clear Supabase cache**: Sign out and back in to Supabase
3. **Try a different browser**
4. **Use Method 2 or 3** (SQL or API)

---

## 📋 Complete Cleanup Checklist

- [ ] Delete user from `auth.users` (via Dashboard)
- [ ] Delete user from `public.users` (SQL: `DELETE FROM users WHERE email = '...'`)
- [ ] Delete orphaned organization if needed
- [ ] Verify deletion in Dashboard → Users
- [ ] Clear browser cache
- [ ] Test OAuth sign-in fresh

---

## 💡 Why Direct SQL DELETE Doesn't Work

Supabase's `auth.users` table is special:
- It's managed by Supabase Auth service
- It has special triggers and hooks
- Direct SQL access is restricted for security
- You must use:
  - Dashboard interface (easiest)
  - Admin API (programmatic)
  - Service role functions (SQL with elevated permissions)

---

## ✅ Success Indicators

**After successful deletion**:

```
Supabase Dashboard → Authentication → Users
→ Your email is NOT in the list ✅

Supabase Dashboard → SQL Editor:
SELECT * FROM auth.users WHERE email = 'your@email.com';
→ 0 rows returned ✅

Try to login:
→ Creates NEW user ✅
→ Trigger fires ✅
→ Profile created ✅
→ Dashboard loads ✅
```

---

## 🚀 Quick Action

**RIGHT NOW**:

1. Go to **Supabase Dashboard**
2. **Authentication** → **Users**
3. Find your email
4. **Delete user** (⋯ menu)
5. Wait 30 seconds
6. Try signing in again

**This is the fastest way!** 🎯

---

**Last Updated**: October 22, 2025  
**Recommended Method**: Dashboard Delete (Method 1)

