# 🔧 Fix: Google OAuth Shows "Continue to [Supabase ID]" Instead of Your Domain

## 🐛 The Problem

When users click "Continue with Google" and land on Google's OAuth page, it says:

**WRONG:**
```
Continue to ougntjrrskfsuognjmcw.supabase.co
```

**What you want:**
```
Continue to AssetTracer
```
or
```
Continue to www.asset-tracer.com
```

---

## 🎯 Root Cause

The **OAuth Consent Screen** in Google Cloud Console is not configured with your app name. Google is showing the Supabase project reference instead of your branding.

---

## ✅ THE FIX

### Step 1: Go to Google Cloud Console

1. Go to: **https://console.cloud.google.com/**
2. Sign in with your Google account
3. Select your project (the one you're using for OAuth)

---

### Step 2: Update OAuth Consent Screen

1. In the left sidebar, click **"APIs & Services"** → **"OAuth consent screen"**

2. **You should see:** Your current consent screen configuration

3. **Update these fields:**

#### **App Information Section:**

**App name:** 
```
AssetTracer
```

**User support email:**
```
your-business-email@yourdomain.com
```

**App logo:** (Optional but recommended)
- Upload your AssetTracer logo
- Should be square (at least 120x120 pixels)
- PNG or JPG format
- Will show on the Google OAuth screen

**Developer contact information:**
```
your-business-email@yourdomain.com
```

---

#### **App Domain Section:**

**Application home page:**
```
https://www.asset-tracer.com
```

**Application privacy policy link:**
```
https://www.asset-tracer.com/privacy
```
(or leave blank if you don't have one yet)

**Application terms of service link:**
```
https://www.asset-tracer.com/terms
```
(or leave blank if you don't have one yet)

---

### Step 3: Save and Submit

1. Scroll to the bottom
2. Click **"SAVE AND CONTINUE"**
3. If prompted for verification, you may need to wait for Google to review

**Note:** If your app is in "Testing" mode, only test users will see the updated branding immediately. For production, you'll need to submit for verification.

---

## 🔍 Verify the Fix

### For Testing (Unverified Apps)

If your OAuth app is still in "Testing" mode:

1. Add yourself as a test user:
   - Go to OAuth consent screen → Test users section
   - Click "ADD USERS"
   - Add your email address
   - Save

2. **Sign out** of your Google account or use incognito mode

3. Go to your login page and click "Continue with Google"

4. **Expected result:** You should now see:
   ```
   AssetTracer wants to access your Google Account
   ```

   Instead of:
   ```
   ougntjrrskfsuognjmcw.supabase.co wants to access your Google Account
   ```

---

## 📋 Quick Checklist

After updating:

- [ ] App name is "AssetTracer" (not default or Supabase ID)
- [ ] Support email is your business email
- [ ] Home page URL is correct
- [ ] Logo uploaded (optional but recommended)
- [ ] Test user added (if in testing mode)
- [ ] All changes saved

---

## 🚀 For Production (Publish Your App)

If you want ALL users (not just test users) to see your branding:

### Step 1: Fill Out Required Fields

Complete ALL sections in OAuth consent screen:
- ✅ App Information (name, logo, email)
- ✅ App Domain (home page, privacy policy, terms)
- ✅ Authorized Domains
- ✅ Developer Contact Info

### Step 2: Add Scopes

Make sure these scopes are listed:
- `email` - See your email address
- `profile` - See your personal info  
- `openid` - Authenticate using OpenID Connect

### Step 3: Submit for Verification

1. In the OAuth consent screen, you'll see a button: **"PUBLISH APP"**

2. Click it

3. **Warning message:** Google will warn that your app is unverified. That's OK for most use cases!

4. Click **"CONFIRM"**

---

## ⚠️ Important Notes

### About Unverified Apps

Even if you publish, Google will show an "unverified app" warning to users. This is NORMAL for small apps and not a problem:

- ✅ Users can still click "Continue" to use your app
- ✅ Your branding will show correctly
- ✅ OAuth will work perfectly

### Getting Verified (Optional)

To remove the "unverified" warning, you need to:
1. Have significant user usage (thousands of users)
2. Complete Google's verification process
3. Provide detailed information about your app

**Most apps operate fine as "unverified"** - it's not necessary unless you're a large company.

---

## 🔍 Test Different Users

To truly test the branding:

### Test as Admin:
- You should see the updated branding immediately after saving

### Test as Regular User:
- Incognito window
- Different Google account (or sign out)
- Try signing in

**Expected:** See "AssetTracer" instead of Supabase ID

---

## 📊 Before vs After

### Before (WRONG):
```
Google Sign-In Screen:

  ougntjrrskfsuognjmcw.supabase.co
  wants to access your Google Account
  
  Continue to ougntjrrskfsuognjmcw.supabase.co
```

### After (CORRECT):
```
Google Sign-In Screen:

  AssetTracer
  wants to access your Google Account
  
  Continue to AssetTracer
```

---

## 🎯 Additional Branding (Optional)

### Add Logo to Supabase OAuth

You can also add branding directly to Supabase:

1. Go to: **Supabase Dashboard** → **Authentication** → **Providers** → **Google**

2. Look for any branding or logo fields

3. Upload your AssetTracer logo there too

This ensures branding shows up in all OAuth flows.

---

## ✅ Quick Test

After saving changes in Google Cloud Console:

1. **Wait 1-2 minutes** for changes to propagate
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. Go to your login page
4. Click "Continue with Google"
5. **Check the branding** - should show "AssetTracer"

---

## 🔗 Important Links

- **Google Cloud Console:** https://console.cloud.google.com/
- **OAuth Consent Screen:** Direct link after selecting your project
- **Your App:** https://www.asset-tracer.com (or staging URL)

---

**After fixing, users will see "Continue to AssetTracer" instead of the Supabase ID!** 🎉

