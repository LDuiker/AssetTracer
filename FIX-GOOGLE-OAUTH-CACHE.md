# Fix Google OAuth Cache Issue

## Problem
When you click "Sign in with Google", it automatically signs you in with the wrong account (mrlduiker@gmail.com) instead of letting you choose which account to use.

## Why This Happens
Google OAuth remembers your last choice and auto-selects that account. This is by design for convenience, but causes issues when you want to use a different account.

---

## ✅ Solution 1: Force Google Account Chooser (Recommended)

### Option A: Use Incognito/Private Window
1. **Open a new Incognito/Private window**:
   - Chrome: `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
   - Edge: `Ctrl+Shift+N`
   - Firefox: `Ctrl+Shift+P`

2. **Go to your site**: https://www.asset-tracer.com

3. **Click "Sign in with Google"**

4. **Google will prompt you to choose an account** (not auto-select)

### Option B: Use a Different Browser
- If you use Chrome normally, try Edge or Firefox
- Google won't have cached credentials in a different browser

### Option C: Clear Google Session
1. Go to: https://accounts.google.com/Logout
2. Wait for logout to complete
3. Go back to: https://www.asset-tracer.com
4. Click "Sign in with Google"
5. You'll be prompted to sign in fresh

---

## ✅ Solution 2: Add Account Prompt to Sign-In Button

I can update your login page to **force** Google to show the account chooser every time.

**Update this in your code:**

```typescript
// In app/(auth)/login/page.tsx
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: callbackUrl,
    queryParams: {
      prompt: 'select_account', // Forces account selection
    },
  },
});
```

This forces Google to ALWAYS show the account picker, even if you've used Google OAuth before.

---

## ✅ Solution 3: Sign Out from Google (Nuclear Option)

1. Go to: https://accounts.google.com
2. Click your profile picture (top right)
3. Click "Sign out"
4. Go to: https://www.asset-tracer.com
5. Click "Sign in with Google"
6. Sign in with your desired account

---

## 🔧 Quick Fix Right Now

**Do this RIGHT NOW to sign in with a different account:**

1. **Open Incognito Window** (`Ctrl+Shift+N`)
2. Go to: https://www.asset-tracer.com
3. Click "Sign in with Google"
4. **Choose the email you want to use** (NOT mrlduiker@gmail.com)
5. Complete sign-in

---

## 🗑️ Delete the Old User First

Before trying to sign in with a different account, **completely delete** the mrlduiker@gmail.com user:

1. Run `CLEAN-DELETE-USER-FINAL.sql` in Supabase SQL Editor
2. Manually delete mrlduiker@gmail.com from Supabase Dashboard → Authentication → Users
3. Verify deletion by re-running the verification query

---

## 📝 Permanent Fix (Update Code)

I'll update your login page to always show the account chooser, so this never happens again.

