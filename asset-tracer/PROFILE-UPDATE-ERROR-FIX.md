# Profile Update Error - Troubleshooting Guide

## 🐛 Error: "Failed to update profile"

If you're seeing this error when trying to save your profile in Settings, follow these steps:

---

## 🔧 Quick Fix

### Run This SQL Script in Supabase

**File**: `supabase/FIX-USER-PROFILE-UPDATES.sql`

**What it does**:
1. ✅ Adds `phone` column to users table (if missing)
2. ✅ Enables Row Level Security (RLS)
3. ✅ Creates policy for users to read their own record
4. ✅ Creates policy for users to update their own record
5. ✅ Verifies the setup

---

## 🎯 Most Likely Causes

### 1. Missing Phone Column
**Symptom**: Error mentions "column 'phone' does not exist"  
**Fix**: Run `FIX-USER-PROFILE-UPDATES.sql`

### 2. RLS Policy Missing
**Symptom**: "Failed to update profile" without specific column error  
**Fix**: Run `FIX-USER-PROFILE-UPDATES.sql`

### 3. No User Record
**Symptom**: "User not found"  
**Fix**: Ensure you're logged in and user exists in users table

---

## 📊 Step-by-Step Fix

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run Fix Script
1. Copy contents of `supabase/FIX-USER-PROFILE-UPDATES.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Wait for success messages

### Step 3: Verify Success
Look for these messages:
```
✅ Added phone column to users table (or already exists)
✅ User profile update fix completed successfully!
```

### Step 4: Test Profile Update
1. Go back to your application
2. Open Settings → Profile tab
3. Change your name or phone
4. Click "Save Changes"
5. ✅ Should work now!

---

## 🔍 Detailed Error Logging

The app now includes better error logging. Check your browser console for:

### Frontend Console
```javascript
// On success:
"Profile updated successfully: { user: {...}, message: '...' }"

// On error:
"Profile update failed: { error: '...', details: '...' }"
```

### Server Console (Terminal)
```javascript
// On error:
"Error updating profile: { message: '...', code: '...' }"
"Update data: { name: '...', phone: '...' }"
"User ID: '...'"
```

---

## 📋 Common Error Messages

### "column 'phone' does not exist"
**Cause**: Phone column not added to database  
**Fix**: Run migration script

### "Failed to update profile"
**Cause**: RLS policy blocking update  
**Fix**: Run RLS policy creation script

### "Unauthorized"
**Cause**: Not logged in or session expired  
**Fix**: Log out and log back in

### "Validation failed"
**Cause**: Name less than 2 characters  
**Fix**: Enter a valid name (2+ characters)

---

## ✅ Verification Checklist

After running the fix script:

**Database Verification**:
- [ ] Phone column exists in users table
- [ ] RLS is enabled on users table
- [ ] "users_select_own" policy exists
- [ ] "users_update_own" policy exists

**Application Testing**:
- [ ] Settings page loads without errors
- [ ] Profile data displays correctly
- [ ] Can edit name field
- [ ] Can edit phone field
- [ ] Save button works
- [ ] Success toast appears
- [ ] Changes persist after refresh

---

## 🚀 Alternative Fix (Manual)

If you prefer to run commands manually:

### 1. Add Phone Column
```sql
ALTER TABLE users ADD COLUMN phone TEXT;
```

### 2. Enable RLS
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 3. Create Read Policy
```sql
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid() = id);
```

### 4. Create Update Policy
```sql
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

## 💡 Understanding RLS Policies

### What They Do
- **Row Level Security (RLS)**: Database-level access control
- **Policy**: Rules that determine who can read/write specific rows
- **USING**: Condition to select rows
- **WITH CHECK**: Condition to allow updates

### Our Policies
**users_select_own**:
- Users can read their own record
- Matches: `auth.uid() = id` (current user's ID = row's ID)

**users_update_own**:
- Users can update their own record
- Same matching condition
- Prevents users from updating other users' data

---

## 🎉 Expected Behavior After Fix

### Profile Load
```
Settings page opens
    ↓
Fetch /api/user/profile (GET)
    ↓
RLS allows: auth.uid() matches user ID ✅
    ↓
Profile data displays
```

### Profile Save
```
User clicks Save Changes
    ↓
PATCH /api/user/profile
    ↓
RLS allows: auth.uid() matches user ID ✅
    ↓
Update users table
    ↓
Success toast appears
    ↓
Data refreshes
```

---

## 🛡️ Security Notes

### Why RLS Policies Are Important
- ✅ **User Privacy**: Users can only see their own data
- ✅ **Data Security**: Users can't modify other users' profiles
- ✅ **Multi-tenancy**: Enforces data isolation
- ✅ **Database Level**: Security at the database, not just app level

### What's Protected
- ✅ Users can only read their own profile
- ✅ Users can only update their own name and phone
- ✅ Users cannot change their email or organization_id
- ✅ Users cannot see other users' data

---

## 📞 Still Having Issues?

### Check Server Logs
Look in your terminal where `npm run dev` is running for:
```
Error updating profile: { message: '...', code: '...' }
Update data: { name: '...', phone: '...' }
User ID: '...'
```

### Check Browser Console
Look for detailed error information:
```
Profile update failed: { error: '...', details: '...' }
```

### Common Issues
1. **Migration not run**: Run `FIX-USER-PROFILE-UPDATES.sql`
2. **Logged out**: Log out and log back in
3. **Cache issue**: Hard refresh browser (Ctrl+Shift+R)
4. **RLS conflict**: Drop and recreate policies

---

## 🎯 Summary

**Problem**: Can't save profile changes  
**Root Cause**: Missing phone column or RLS policies  
**Solution**: Run `FIX-USER-PROFILE-UPDATES.sql`  
**Expected Result**: Profile saves successfully  

---

**🚀 Run the fix script and your profile updates will work!** ✨
