# User Role Fix - Impact Analysis

## Problem Summary
Currently, when users sign up for AssetTracer, they are assigned the 'member' role instead of 'owner'. This prevents them from accessing critical admin features like team management, invitations, and member removal.

## What Gets Fixed

### 1. **New User Signups**
**Before:**
```
User signs up → Gets 'member' role → Cannot invite team members ❌
```

**After:**
```
User signs up → Gets 'owner' role → Full admin access ✅
```

### 2. **Existing Users**
Users who are the only member of their organization will automatically be promoted to 'owner' role when you run the fix script.

## Features Enabled by Owner/Admin Role

### Team Management Permissions

| Feature | Member | Admin | Owner |
|---------|--------|-------|-------|
| View team members | ✅ | ✅ | ✅ |
| Invite new members | ❌ | ✅ | ✅ |
| Remove members | ❌ | ✅ | ✅ |
| Update member roles | ❌ | ✅ | ✅ |
| Cancel invitations | ❌ | ✅ | ✅ |
| Remove self (owner) | ❌ | ❌ | ❌ |

### Code References

#### 1. Team Invitation API
**File:** `asset-tracer/app/api/team/invite/route.ts`

```typescript
// Only owners and admins can invite
if (userData.role !== 'owner' && userData.role !== 'admin') {
  return NextResponse.json(
    { error: 'Only owners and admins can invite team members' },
    { status: 403 }
  );
}
```

**Impact:** Without owner/admin role, users cannot send team invitations.

#### 2. Member Management API
**File:** `asset-tracer/app/api/team/members/[id]/route.ts`

```typescript
// Check permissions - only owners and admins can update/remove members
if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
  return NextResponse.json(
    { error: 'Only owners and admins can modify team members' },
    { status: 403 }
  );
}
```

**Impact:** Cannot update member roles or remove team members.

#### 3. Team Section UI
**File:** `asset-tracer/components/settings/TeamSection.tsx`

- Shows different badge colors for owner/admin vs member
- Hides action buttons (remove, change role) for non-owner/admin users
- Owner cannot be removed (protection)

```typescript
{member.role !== 'owner' && member.id !== currentUserId && (
  <DropdownMenu>
    {/* Remove/Update options only shown for owner/admin */}
  </DropdownMenu>
)}
```

#### 4. Settings Page
**File:** `asset-tracer/app/(dashboard)/settings/page.tsx`

Shows user's role in profile section:
```typescript
role: userData.user.role || 'User'
```

## Role Hierarchy

### Owner
- **Who:** Person who created the organization
- **Permissions:** Full control over everything
- **Cannot:** Be removed from the organization
- **Count:** Typically 1 per organization

### Admin
- **Who:** Trusted team members promoted by owner
- **Permissions:** Can manage team, settings, invite members
- **Cannot:** Remove the owner
- **Count:** Can have multiple admins

### Member
- **Who:** Default role for invited team members
- **Permissions:** Can create and edit resources (assets, invoices, etc.)
- **Cannot:** Manage team, invite others, change settings
- **Count:** Unlimited (based on subscription plan)

### Viewer
- **Who:** Read-only users (e.g., accountants, auditors)
- **Permissions:** View-only access to data
- **Cannot:** Edit anything, manage team
- **Count:** Unlimited (based on subscription plan)

## Testing Checklist

After applying the fix to staging, test these scenarios:

### ✅ New User Signup
1. Open incognito browser
2. Sign up with new email
3. After signup, go to Settings → Team
4. Verify you can see "Invite Team Member" button
5. Try inviting someone → Should work ✅

### ✅ Team Invitation Flow
1. As owner, invite a new member
2. New member accepts invitation
3. They should have 'member' role (not owner)
4. Verify they CANNOT invite others
5. Verify owner CAN change their role to admin

### ✅ Role-Based UI
1. Check Settings → Team section
2. Owner should see action buttons on all members
3. Members should only see their own info
4. Role badges should show correct colors

### ✅ API Permissions
1. Try inviting as owner → Should work
2. Login as member
3. Try accessing `/api/team/invite` → Should get 403 error
4. Try accessing `/api/team/members/[id]` to update → Should get 403 error

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  organization_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  -- ... other columns
);
```

### Organization Members Table (Optional)
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

**Note:** AssetTracer tracks roles in BOTH places for flexibility. The fix updates both.

## Common Issues This Prevents

### Issue 1: "Cannot Invite Team Members"
**Symptom:** User creates account, goes to Settings → Team, but "Invite" button is disabled or shows permission error.

**Cause:** User has 'member' role instead of 'owner'

**Fixed by:** This update ✅

### Issue 2: "Organization Creator Cannot Manage Team"
**Symptom:** The person who paid and created the organization cannot remove inactive members or promote admins.

**Cause:** OAuth trigger doesn't set owner role

**Fixed by:** This update ✅

### Issue 3: "All Users Have Same Permissions"
**Symptom:** No role hierarchy, everyone is a member

**Cause:** Role column exists but is never set

**Fixed by:** This update ✅

## Files Modified by This Fix

1. **Database Trigger:** `public.handle_new_user()` function
   - Now sets `role = 'owner'` on user creation
   - Creates entry in `organization_members` table with owner role

2. **Users Table:** Adds `role` column if missing
   - Includes CHECK constraint for valid roles
   - Indexed for performance

3. **Existing Users:** Automatically promoted to owner if they're solo

## Rollback Plan

If something goes wrong, you can rollback by:

```sql
-- Revert all users to member
UPDATE users SET role = 'member';

-- Reinstall the old trigger without role
-- (See INSTALL-OAUTH-TRIGGER-NOW.sql original version)
```

But this shouldn't be necessary - the fix is carefully designed to be safe.

## Next Steps

1. ✅ **Run on Staging:** `FIX-USER-ROLE-STAGING.sql`
2. ✅ **Test thoroughly:** Use checklist above
3. ✅ **Monitor for issues:** Check Vercel logs for 403 errors
4. ✅ **Apply to Production:** Same script on production database
5. ✅ **Update documentation:** Let users know about team features

## Support Impact

This fix will reduce support requests about:
- "Why can't I invite team members?"
- "I'm the owner but have no admin access"
- "Team management features not working"

## Security Notes

✅ **Safe:** Owner role is only assigned to users who CREATE an organization
✅ **Protected:** Owners cannot be removed or demoted
✅ **Audited:** All role changes are logged in database triggers
✅ **Validated:** Role column has CHECK constraint preventing invalid values

---

**Ready to apply?** Follow the instructions in `APPLY-USER-ROLE-FIX-STAGING.md`

