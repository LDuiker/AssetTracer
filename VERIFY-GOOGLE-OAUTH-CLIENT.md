# 🔍 Verify Which Google OAuth Client Is Being Used

## The Problem

You've updated the app name to "AssetTracer" in Google Cloud Console, but users still see `ftelnmursmitpjwjbyrw.supabase.co`.

---

## ✅ Step 1: Get the Exact Client ID from Supabase

1. Go to: **https://supabase.com/dashboard/project/ftelnmursmitpjwjbyrw/auth/providers**
2. Click on **"Google"**
3. **Copy the EXACT Client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

**Write it down here:** `_________________________________`

---

## ✅ Step 2: Find This Client in Google Cloud Console

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. In the search box at the top, paste your Client ID
3. Click on the OAuth 2.0 Client ID that appears
4. **Check:**
   - Does the "Name" field match what you expect?
   - What project is this in? (shown at the top of the page)

---

## ✅ Step 3: Verify OAuth Consent Screen

1. In the same Google Cloud project (from Step 2), go to:
   - **APIs & Services** → **OAuth consent screen**

2. **Check these fields:**
   - **App name:** Should be "AssetTracer"
   - **Publishing status:** What does it say?
     - "Testing" = Only test users see the name
     - "In production" = All users should see the name

3. **If it says "Testing":**
   - Scroll down to "Test users" section
   - Is your email added as a test user?
   - If not, add it and save

---

## ✅ Step 4: Check if App Needs Publishing

**If Publishing Status = "Testing":**

1. Scroll to the bottom of the OAuth consent screen
2. Look for a button: **"PUBLISH APP"** or **"BACK TO EDITING"**
3. If you see "PUBLISH APP":
   - Click it
   - Confirm the warning
   - This makes the app name visible to ALL users (not just test users)

**Important:** Publishing doesn't require verification for basic OAuth. It just makes your branding visible to everyone.

---

## ✅ Step 5: Wait and Test Properly

**After publishing (if needed):**

1. **Wait 5-10 minutes** for changes to propagate
2. **Use Incognito/Private window** (or clear cache)
3. **Sign out of Google completely:**
   - Go to: https://myaccount.google.com/
   - Sign out
4. **Go to your login page**
5. **Click "Continue with Google"**
6. **Check what it says**

---

## 🔍 Common Issues

### Issue 1: Multiple OAuth Clients

You might have created multiple OAuth clients. Make sure you're updating the one that Supabase is actually using.

**To verify:**
- The Client ID in Supabase must match the Client ID in Google Cloud Console
- If they don't match, you're updating the wrong client!

### Issue 2: App Still in Testing Mode

If your app is in "Testing" mode:
- Only users added to "Test users" list will see "AssetTracer"
- Everyone else sees the domain
- **Solution:** Click "PUBLISH APP" (doesn't require verification for basic OAuth)

### Issue 3: Changes Not Propagated

Google can take 5-15 minutes to update OAuth consent screens.

**Test properly:**
- Wait at least 10 minutes
- Use incognito window
- Sign out of Google completely
- Try again

---

## 🆘 Still Not Working?

**Send me:**
1. The **Client ID** from Supabase (Google provider)
2. A screenshot of the **OAuth consent screen** showing:
   - App name field
   - Publishing status
3. Whether you clicked "PUBLISH APP" or not

**I'll help you debug further!**

