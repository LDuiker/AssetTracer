# Polar Sandbox Testing Tips

## Issue 1: "Already Have Subscription" Error

### Why This Happens
Polar identifies customers by **email address**. When you:
1. Create user with `test@example.com`
2. Buy a subscription
3. Delete the user from your app
4. Create a NEW user with the same email `test@example.com`

→ **Polar still sees the old subscription** because it's tied to the email!

### Solutions

#### Option A: Use Different Emails (Easiest) ✅
For each test, use a unique email:
- `test1@example.com`
- `test2@example.com`  
- `test3@example.com`
- etc.

#### Option B: Clean Up Polar Dashboard
1. Go to [Polar Sandbox Dashboard](https://sandbox.polar.sh/dashboard)
2. Navigate to **Customers**
3. Find the customer by email
4. Delete or cancel their subscription
5. Now you can test with that email again

#### Option C: Use the Sync Button
If you see "already have subscription" error:
1. Go to Settings → Billing
2. Click the **"Sync Now"** button
3. It will activate the existing subscription

---

## Issue 2: Deleted Users Still in Supabase

### Why This Happens
Without `SUPABASE_SERVICE_ROLE_KEY`, the delete account feature can only:
- ✅ Delete from `users` table (your app data)
- ❌ Delete from `auth.users` table (Supabase authentication)

### The Fix

#### Add Service Role Key

1. **Get the Key:**
   - Go to [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api)
   - Find **"Service Role Key"** (secret)
   - It starts with `eyJ...` and is very long

2. **Add to `.env.local`:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Restart Server:**
   ```bash
   Ctrl+C
   npm run dev -- -p 3000
   ```

4. **Clean Up Stuck Users:**
   Run `CLEANUP-STUCK-USER.sql` in Supabase SQL Editor

#### Manual Cleanup (For Now)

To remove stuck auth users manually:

**Option 1: Supabase Dashboard**
1. Go to Authentication → Users
2. Find the user
3. Click `...` → Delete user

**Option 2: SQL Editor**
```sql
-- Replace with the actual email
DELETE FROM auth.users 
WHERE email = 'stuck-user@example.com';
```

---

## Testing Workflow Best Practices

### For Subscription Testing

1. **Use Sequential Test Emails:**
   ```
   testuser1@example.com  → Test Pro
   testuser2@example.com  → Test Business
   testuser3@example.com  → Test Cancellation
   ```

2. **Use Polar Test Card:**
   ```
   Card: 4242 4242 4242 4242
   Expiry: Any future date
   CVC: Any 3 digits
   ```

3. **Check Polar Dashboard:**
   - View customers: https://sandbox.polar.sh/customers
   - View subscriptions: https://sandbox.polar.sh/subscriptions
   - Cancel test subscriptions when done

### For Account Deletion Testing

1. **Add Service Role Key first** (see above)
2. Create test user
3. Try delete account
4. Verify in Supabase:
   ```sql
   -- Should return 0 rows
   SELECT * FROM auth.users WHERE email = 'test@example.com';
   SELECT * FROM users WHERE email = 'test@example.com';
   ```

---

## Common Errors & Fixes

### "You already have an active subscription"
- **Cause:** Email has existing Polar subscription
- **Fix:** Use different email OR clean up Polar customer

### "Failed to delete authentication account"
- **Cause:** Missing `SUPABASE_SERVICE_ROLE_KEY`
- **Fix:** Add the key to `.env.local`

### "User from sub claim in JWT does not exist"
- **Cause:** Deleted user but JWT still cached
- **Fix:** Clear browser cache or use incognito mode

### "Organization not found"
- **Cause:** User record deleted but auth record remains
- **Fix:** Run cleanup SQL or add service role key

---

## Production Considerations

⚠️ **Before Going Live:**

1. **Switch from Sandbox to Production:**
   - Get production Polar API key
   - Update `POLAR_API_KEY` in `.env.local`
   - Use real Polar account (not sandbox)

2. **Ensure Service Role Key is Set:**
   - Critical for account deletion
   - Keep it secret (never commit to git)

3. **Test Full Workflows:**
   - Sign up → Subscribe → Cancel → Delete
   - Verify no stuck records

4. **Set Up Production Webhook:**
   - Get production webhook URL from Polar
   - Update in your deployment (Vercel/etc)

---

## Quick Reference

| Action | Email Strategy |
|--------|---------------|
| Test Pro subscription | `testpro1@example.com` |
| Test Business subscription | `testbiz1@example.com` |
| Test cancellation | `testcancel1@example.com` |
| Test account deletion | `testdelete1@example.com` |
| Test upgrade Pro→Business | Same email, cancel first |

---

## Need Help?

- [Polar Documentation](https://polar.sh/docs)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- Check `CLEANUP-STUCK-USER.sql` for manual cleanup script

