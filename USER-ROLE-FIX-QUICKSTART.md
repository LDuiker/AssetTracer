# User Role Fix - Quick Start Guide

## Problem
Users who sign up are automatically assigned 'member' role instead of 'owner' role. This prevents them from accessing critical admin features like team invitations and member management.

## Files You Need

### 1. Diagnosis
- **`check-user-roles-staging.sql`** - Check current state before fixing

### 2. Fix Scripts
- **`FIX-USER-ROLE-STAGING.sql`** - Apply to staging database first
- **`FIX-USER-ROLE-PRODUCTION.sql`** - Apply to production after testing

### 3. Documentation
- **`APPLY-USER-ROLE-FIX-STAGING.md`** - Step-by-step instructions
- **`USER-ROLE-FIX-IMPACT.md`** - What this fixes and why it matters

## Quick Apply Process

### Step 1: Check Current State (Staging)
```
1. Open Supabase Dashboard (Staging)
   https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw

2. Go to SQL Editor

3. Run: check-user-roles-staging.sql

4. Review output - you'll see:
   - ❌ Users with 'member' or null role
   - ⚠️  OAuth trigger status
   - 📊 Summary of issues
```

### Step 2: Apply Fix (Staging)
```
1. Still in Supabase SQL Editor (Staging)

2. Run: FIX-USER-ROLE-STAGING.sql

3. Verify output shows:
   ✅ Trigger installed
   ✅ Function created
   ✅ Users promoted to owner

4. Check users table:
   SELECT email, role FROM users;
```

### Step 3: Test (Staging)
```
1. Open incognito browser

2. Go to: https://assettracer-staging.vercel.app

3. Sign up with new email (e.g., test-owner@example.com)

4. After signup, go to Settings → Team

5. Verify:
   ✅ You see "Invite Team Member" button
   ✅ You can send an invitation
   ✅ Your role shows as "Owner"
```

### Step 4: Apply to Production (After Testing)
```
1. Open Supabase Dashboard (Production)
   https://supabase.com/dashboard/project/YOUR_PROD_PROJECT

2. Go to SQL Editor

3. Run: FIX-USER-ROLE-PRODUCTION.sql

4. Verify existing users (mrlduiker@gmail.com and larona@stageworksafrica.com)
   now have 'owner' role

5. Test with their accounts - they should be able to invite team members
```

## What Gets Fixed

### Before Fix ❌
```
New user signs up
  ↓
User created with role = 'member'
  ↓
User goes to Settings → Team
  ↓
"Only owners and admins can invite team members" error
  ↓
User cannot manage their organization 😞
```

### After Fix ✅
```
New user signs up
  ↓
User created with role = 'owner'
  ↓
User goes to Settings → Team
  ↓
Can invite team members
Can manage roles
Can remove members
Full admin access 🎉
```

## Features Enabled

Once fixed, organization owners can:
- ✅ Invite new team members
- ✅ Remove team members
- ✅ Change member roles (promote to admin)
- ✅ Cancel pending invitations
- ✅ View all team activity

## Role Hierarchy

| Role | Permissions | Who Gets It |
|------|-------------|-------------|
| **Owner** | Full control, cannot be removed | Person who creates organization |
| **Admin** | Manage team, most settings | Promoted by owner |
| **Member** | Create/edit resources | Invited team members |
| **Viewer** | Read-only access | Observers, auditors |

## Safety Notes

✅ **Safe to run:** Script checks if columns exist before adding them
✅ **Idempotent:** Can run multiple times without issues
✅ **Reversible:** Can rollback if needed (see docs)
✅ **No data loss:** Only adds/updates, never deletes

## Common Questions

### Q: Will this affect existing users?
**A:** Yes, in a good way! Users who are the only member of their organization will automatically be promoted to 'owner' role.

### Q: What about users with existing teams?
**A:** The script only promotes users who are solo in their organization. Multi-member organizations are not affected automatically (to prevent demoting existing admins).

### Q: Can I manually change someone's role later?
**A:** Yes! Just run:
```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

### Q: What if I run this by accident twice?
**A:** No problem! The script is idempotent - it checks if things exist before creating them.

### Q: Will this break anything?
**A:** No. The code already checks for owner/admin roles. This fix simply ensures those roles are assigned correctly from the start.

## Troubleshooting

### Issue: Script fails with "column already exists"
**Solution:** This is fine! The script uses `IF NOT EXISTS` so it should skip existing columns. If you get this error, the column is already there.

### Issue: Users still show as 'member' after fix
**Check:**
1. Did the trigger install successfully?
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. Is the trigger function checking for role?
   ```sql
   SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
   ```
   Should see `'owner'` in the function body.

3. Did you test with a NEW signup or existing user?
   The fix only affects NEW signups. Existing users need to be updated separately.

### Issue: Cannot invite team members after fix
**Check:**
1. Verify your role:
   ```sql
   SELECT email, role FROM users WHERE email = 'your@email.com';
   ```

2. Check Vercel deployment - may need to redeploy for code changes

3. Check browser console for API errors

## Files Modified

### Database
- `users` table - adds `role` column
- `public.handle_new_user()` function - updates to set owner role
- `on_auth_user_created` trigger - reinstalled with new function

### No Code Changes Needed!
The application code already supports roles. This fix just ensures the database assigns them correctly.

## Timeline

| Step | Time | Status |
|------|------|--------|
| Check staging state | 2 min | ⏳ Start here |
| Apply fix to staging | 5 min | ⏳ Next |
| Test staging | 10 min | ⏳ Important! |
| Apply to production | 5 min | ⏳ After testing |
| **Total** | **~20 min** | |

## Success Criteria

After applying the fix, you should see:
- ✅ New signups have 'owner' role
- ✅ Existing solo users promoted to 'owner'
- ✅ Team invitation feature works
- ✅ Settings page shows correct role
- ✅ No 403 errors when inviting

## Next Steps After Fix

1. **Update documentation** - Let users know they can invite team members
2. **Test subscription limits** - Verify team member limits work per plan
3. **Monitor for issues** - Check Vercel logs for 403 errors
4. **Consider notifications** - Add email notifications when invited to team

---

## Ready to Start?

1. Read: `APPLY-USER-ROLE-FIX-STAGING.md` for detailed instructions
2. Review: `USER-ROLE-FIX-IMPACT.md` to understand what changes
3. Run: `check-user-roles-staging.sql` to see current state
4. Apply: `FIX-USER-ROLE-STAGING.sql` to fix staging
5. Test thoroughly before touching production!

**Questions?** Check the detailed guides or run the diagnostic script first.

