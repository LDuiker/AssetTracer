# Google OAuth Setup Guide

## 🎯 Goal

Enable Google Sign-In for your AssetTracer production app by:
1. Creating OAuth credentials in Google Cloud Console
2. Configuring Google provider in Supabase
3. Testing the integration

---

## 📋 Prerequisites

- Google account (Gmail account)
- Access to your Supabase production project
- Your Vercel app URL

---

## PART 1: Create Google OAuth Credentials

### Step 1: Go to Google Cloud Console

1. Go to: **https://console.cloud.google.com/**
2. Sign in with your Google account

### Step 2: Create a New Project (or Select Existing)

**If you don't have a project yet:**

1. Click the project dropdown at the top (says "Select a project")
2. Click **"NEW PROJECT"** in the top right
3. Enter project details:
   - **Project name**: `AssetTracer` (or any name you prefer)
   - **Organization**: Leave as "No organization" (unless you have one)
4. Click **"CREATE"**
5. Wait for the project to be created (~30 seconds)
6. Click **"SELECT PROJECT"** when it appears

**If you already have a project:**
- Just select it from the dropdown

### Step 3: Enable Google+ API (Required for OAuth)

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. Search for: `Google+ API`
3. Click on **"Google+ API"**
4. Click **"ENABLE"**
5. Wait for it to enable (~10 seconds)

### Step 4: Configure OAuth Consent Screen

This is what users see when they click "Sign in with Google".

1. In the left sidebar, click **"APIs & Services"** → **"OAuth consent screen"**

2. **Choose User Type**:
   - Select **"External"** (allows anyone with a Gmail account)
   - Click **"CREATE"**

3. **App Information** (Page 1):
   ```
   App name: AssetTracer
   User support email: your-email@gmail.com (your email)
   App logo: (optional - skip for now)
   ```

4. **App Domain** (Optional):
   ```
   Application home page: https://your-app.vercel.app
   Privacy policy: https://your-app.vercel.app (or leave blank for now)
   Terms of service: https://your-app.vercel.app (or leave blank for now)
   ```

5. **Authorized Domains**:
   - Click **"ADD DOMAIN"**
   - Add: `vercel.app`
   - Add: `supabase.co`

6. **Developer Contact Information**:
   ```
   Email addresses: your-email@gmail.com
   ```

7. Click **"SAVE AND CONTINUE"**

8. **Scopes** (Page 2):
   - Click **"ADD OR REMOVE SCOPES"**
   - Check these scopes:
     - `email` (See your email address)
     - `profile` (See your personal info)
     - `openid` (Authenticate using OpenID Connect)
   - Click **"UPDATE"**
   - Click **"SAVE AND CONTINUE"**

9. **Test Users** (Page 3):
   - You can skip this for now (or add yourself for testing)
   - Click **"SAVE AND CONTINUE"**

10. **Summary** (Page 4):
    - Review everything
    - Click **"BACK TO DASHBOARD"**

### Step 5: Create OAuth 2.0 Credentials

Now we'll get the Client ID and Client Secret!

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**

2. Click **"+ CREATE CREDENTIALS"** at the top

3. Select **"OAuth client ID"**

4. **Application type**: Select **"Web application"**

5. **Name**: `AssetTracer Web Client`

6. **Authorized JavaScript origins**:
   - Click **"+ ADD URI"**
   - Add: `https://your-project-ref.supabase.co`
     (Replace `your-project-ref` with your actual Supabase project reference)
     You can find this in: Supabase Dashboard → Project Settings → API → Project URL

7. **Authorized redirect URIs**:
   - Click **"+ ADD URI"**
   - Add: `https://your-project-ref.supabase.co/auth/v1/callback`
     (Replace `your-project-ref` with your actual Supabase project reference)
   
   Example:
   ```
   If your Supabase URL is: https://abcdefghijk.supabase.co
   Then your redirect URI is: https://abcdefghijk.supabase.co/auth/v1/callback
   ```

8. Click **"CREATE"**

9. **Save Your Credentials** 🔑:
   A popup will show your credentials:
   ```
   Client ID: 1234567890-abcdefghijklmnop.apps.googleusercontent.com
   Client Secret: GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
   ```
   
   ⚠️ **IMPORTANT**: Copy both of these immediately!
   - You can click the copy icons next to each
   - Or click "DOWNLOAD JSON" to save them
   - Keep these SECRET - don't share them publicly

10. Click **"OK"**

---

## PART 2: Configure Google Provider in Supabase

### Step 1: Go to Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Select your **PRODUCTION** project

### Step 2: Enable Google Provider

1. Click **"Authentication"** in the left sidebar
2. Click **"Providers"**
3. Find **"Google"** in the list
4. Click on it to expand

### Step 3: Enter Google Credentials

1. Toggle **"Enable Sign in with Google"** to ON

2. Enter your credentials:
   ```
   Client ID: [Paste the Client ID from Google Cloud Console]
   Client Secret: [Paste the Client Secret from Google Cloud Console]
   ```

3. **Redirect URL** (shown on the page):
   - Copy this URL - you'll need it for Google Cloud Console
   - It looks like: `https://your-project.supabase.co/auth/v1/callback`
   - ⚠️ Make sure this MATCHES what you entered in Google Cloud Console (Step 5.7 above)

4. Click **"Save"**

### Step 4: Verify Redirect URL in Google Cloud Console

Go back to Google Cloud Console and verify:

1. **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click on your **"AssetTracer Web Client"**
3. Under **"Authorized redirect URIs"**, verify it shows:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
4. If not, click **"+ ADD URI"**, add it, and click **"SAVE"**

---

## PART 3: Update Your Application Code (Optional)

Your app should already have Google OAuth support, but let's verify the login page has the Google button.

The code should be in: `asset-tracer/app/(auth)/login/page.tsx`

Look for something like:
```typescript
// Google OAuth sign-in
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

If your login page doesn't have a Google button, let me know and I'll add it!

---

## PART 4: Test the Integration

### Step 1: Deploy to Vercel (if you made code changes)

If you updated any code:
```bash
git add .
git commit -m "Add Google OAuth support"
git push origin main
```

Wait for Vercel deployment to complete.

### Step 2: Test Google Sign-In

1. Go to your app: `https://your-app.vercel.app`
2. Click **"Sign in with Google"** button
3. You should see the Google account selection screen
4. Select your Google account
5. **First time only**: You'll see the consent screen:
   - It shows "AssetTracer wants to access your Google Account"
   - Click **"Allow"**
6. You should be redirected back to your app and logged in! ✅

### Step 3: Verify in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. You should see your Google account listed
3. The provider should show as `google`

---

## 🐛 Troubleshooting

### Error: "Redirect URI mismatch"

**Problem**: The redirect URI in Google Cloud Console doesn't match Supabase.

**Fix**:
1. Go to Supabase → Authentication → Providers → Google
2. Copy the **exact** redirect URL shown
3. Go to Google Cloud Console → Credentials → Your OAuth Client
4. Make sure the **Authorized redirect URIs** matches exactly
5. Click Save
6. Wait 5 minutes for Google to update
7. Try again

### Error: "Access blocked: AssetTracer has not completed Google verification"

**Problem**: Your app is in "Testing" mode and only allows test users.

**Fix**:
1. Google Cloud Console → APIs & Services → OAuth consent screen
2. Click **"PUBLISH APP"**
3. Confirm the popup
4. Note: For production apps, Google may require verification if you request sensitive scopes

### Error: "Invalid client_id"

**Problem**: The Client ID in Supabase doesn't match Google Cloud Console.

**Fix**:
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your OAuth Client
3. Copy the **Client ID** (starts with numbers, ends in `.apps.googleusercontent.com`)
4. Go to Supabase → Authentication → Providers → Google
5. Paste the correct Client ID
6. Click Save

### Google Sign-In button not showing

**Problem**: The button doesn't appear on the login page.

**Fix**: Let me know and I'll add the Google OAuth button to your login page!

### Users stuck after Google sign-in

**Problem**: After Google auth, users see a blank page or error.

**Fix**:
1. Check that `/auth/callback` route exists in your app
2. Verify Site URL in Supabase matches your Vercel URL
3. Check browser console for errors

---

## 📋 Checklist

- [ ] Google Cloud Project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Client ID and Client Secret copied
- [ ] Google provider enabled in Supabase
- [ ] Credentials entered in Supabase
- [ ] Redirect URIs match in both platforms
- [ ] App published (if needed)
- [ ] Tested Google sign-in successfully
- [ ] New user appears in Supabase Users table

---

## 🔒 Security Notes

1. **Keep Client Secret SECRET**:
   - Don't commit it to Git
   - Don't share it publicly
   - Only store it in Supabase (they handle it securely)

2. **Authorized Domains**:
   - Only add domains you control
   - Don't add random domains

3. **Redirect URIs**:
   - Only use HTTPS (not HTTP) for production
   - Keep the list minimal

4. **OAuth Scopes**:
   - Only request what you need (email, profile, openid)
   - Don't request sensitive scopes unless necessary

---

## 🎉 Success!

Once complete, your users can:
- ✅ Sign in with their Google accounts
- ✅ No need to remember another password
- ✅ Faster onboarding experience
- ✅ More secure (Google handles authentication)

---

## 📝 Quick Reference

**Google Cloud Console**: https://console.cloud.google.com/  
**Supabase Dashboard**: https://supabase.com/dashboard  

**Your Credentials** (keep these safe!):
```
Google Client ID: [Your Client ID]
Google Client Secret: [Your Client Secret]
Supabase Redirect URI: https://[your-project].supabase.co/auth/v1/callback
```

---

**Last Updated**: October 22, 2025  
**Status**: ⏳ Pending Google OAuth Setup

