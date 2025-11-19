# 🔧 Fix: Google OAuth Still Shows Supabase Domain

## 🐛 The Problem

You updated the app name in Google Console, but users still see:
```
Choose account to continue to ftelnmursmitpjwjbyrw.supabase.co
```

Instead of:
```
Choose account to continue to AssetTracer
```

---

## ✅ Step-by-Step Fix

### Step 1: Find the Correct Google Cloud Project

**Method A: Get Client ID from Supabase**

1. Go to: **https://supabase.com/dashboard/project/ftelnmursmitpjwjbyrw/auth/providers**
2. Click on **"Google"** provider
3. **Copy the Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)

**Method B: Find Project in Google Cloud Console**

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. In the search box, paste the **Client ID** you copied
3. Click on the OAuth 2.0 Client ID that matches
4. **Note the Project name** at the top of the page

---

### Step 2: Update OAuth Consent Screen

1. In Google Cloud Console, make sure you're in the **correct project** (from Step 1)
2. Go to: **APIs & Services** → **OAuth consent screen**
3. **Check the current settings:**
   - What does "App name" show right now?
   - Is it actually "AssetTracer" or something else?

4. **Update these fields:**
   ```
   App name:                  AssetTracer
   User support email:        [YOUR EMAIL]
   Application home page:     https://www.asset-tracer.com
   ```

5. **Scroll down and click "SAVE AND CONTINUE"**
6. If there are more steps, continue through them and save

---

### Step 3: Verify It's Saved

1. **Refresh the OAuth consent screen page**
2. **Check again:** Does "App name" show "AssetTracer"?
3. If yes → Continue to Step 4
4. If no → The save didn't work, try again

---

### Step 4: Wait and Clear Cache

**Google can take 1-5 minutes to propagate changes.**

1. **Wait 2-3 minutes** after saving
2. **Clear your browser cache:**
   - Chrome: Ctrl+Shift+Delete → Clear cached images and files
   - Or use Incognito/Private window
3. **Sign out of Google completely**
4. **Try login again**

---

### Step 5: If Still Not Working

**Check if your app needs verification:**

1. On the OAuth consent screen page, look for:
   - **"Publishing status"** section
   - Does it say "Testing" or "In production"?

**If it says "Testing":**
- Only test users (up to 100) will see the app name
- Everyone else sees the domain
- **Solution:** Submit for verification (takes 1-2 weeks)

**If it says "In production" but still shows domain:**
- The changes might not have propagated yet
- Try waiting 10-15 minutes
- Or there might be multiple OAuth clients - check all of them

---

## 🔍 Debug Checklist

- [ ] Found the correct Google Cloud project (using Client ID from Supabase)
- [ ] Updated "App name" to "AssetTracer" in OAuth consent screen
- [ ] Clicked "SAVE AND CONTINUE" and completed all steps
- [ ] Verified the name is saved (refreshed page, still shows "AssetTracer")
- [ ] Waited 2-3 minutes after saving
- [ ] Cleared browser cache or used incognito window
- [ ] Signed out of Google completely
- [ ] Tried login again

---

## ⚠️ Important Notes

1. **Multiple Projects:** You might have multiple Google Cloud projects. Make sure you're updating the one that matches the Client ID in Supabase.

2. **Verification Required:** If your app is in "Testing" mode, only test users see the app name. For everyone else, Google shows the domain until the app is verified.

3. **Propagation Time:** Changes can take 1-5 minutes to appear. Sometimes up to 15 minutes.

4. **Browser Cache:** Google caches OAuth consent screen data. Always test in incognito or after clearing cache.

---

## 🆘 Still Not Working?

**Send me:**
1. The **Client ID** from Supabase (Google provider settings)
2. A screenshot of your **OAuth consent screen** showing the "App name" field
3. What the **"Publishing status"** says (Testing/In production)

**I'll help you debug further!**

