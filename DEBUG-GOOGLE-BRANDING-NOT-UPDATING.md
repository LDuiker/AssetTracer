# 🔍 Google OAuth Branding Not Updating - Debug Steps

## Problem
You updated the consent screen in Google Cloud Console, but still seeing `ftelnmursmitpjwjbyrw.supabase.co` instead of "AssetTracer".

---

## ✅ Common Reasons

### Reason 1: Wrong OAuth Client Updated

**Check this:**

1. Go to: https://supabase.com/dashboard/project/ftelnmursmitpjwjbyrw/auth/providers
2. Click **Google**
3. **Copy the Client ID** (the full long ID)

4. Go to: https://console.cloud.google.com/apis/credentials
5. **Click on your Client ID**
6. Check what **Project** it's in (shown at top)

7. Go to that project → OAuth consent screen
8. **Did you update THAT consent screen?**

**If you updated a different project/client ID, that's the issue!**

---

### Reason 2: Changes Not Saved

**Check:**
1. Go back to: OAuth consent screen
2. Does it still show "AssetTracer" as the app name?
3. If it changed back, save it again

---

### Reason 3: Testing on Staging vs Production

**Question:** Are you testing on staging or production?

**Check which Supabase project you're actually using:**

1. **Open browser DevTools** (F12)
2. Go to **Network** tab
3. Try signing in
4. Look for requests to `supabase.co`
5. **Which project?** `ftelnmursmitpjwjbyrw` (production) or `ougntjrrskfsuognjmcw` (staging)?

**If staging:** You might have DIFFERENT OAuth credentials for staging!

---

### Reason 4: Google Hasn't Propagated Yet

**Try:**
1. Wait **5-10 minutes** (not 1-2 minutes)
2. Sign out of ALL Google accounts
3. Use completely fresh incognito
4. Try again

---

### Reason 5: Using Different Google Account

**Check:**
1. What Google account are you testing with?
2. Is it a test user you added?
3. Or is it the same account you use for Google Cloud Console?

**Test users** sometimes see cached branding for longer.

---

## 🔍 Diagnostic Steps

### Step 1: Verify What You Updated

**In Google Cloud Console:**
1. Go to: **APIs & Services** → **OAuth consent screen**
2. **Take a screenshot** or tell me:
   - What's the "App name" showing now?
   - Is it "AssetTracer" or still something else?

---

### Step 2: Get Your Client ID

**In Supabase:**
1. Production: https://supabase.com/dashboard/project/ftelnmursmitpjwjbyrw/auth/providers
2. Click **Google**
3. **Copy the FULL Client ID**
4. Send it to me (just first 20 characters is fine)

**I'll help you verify it matches what you updated.**

---

### Step 3: Check Multiple Browsers

**Try:**
1. Firefox (if you tested in Chrome)
2. Or Chrome (if you tested in Edge)
3. Or Edge (if you tested in Firefox)

**Branding might be cached differently per browser.**

---

### Step 4: Check OAuth Client Settings

**In Google Cloud Console:**
1. **APIs & Services** → **Credentials**
2. Click on your OAuth Client ID
3. Check these settings:

**Application type:** Should be "Web application"

**Name:** What does this say?

**Authorized redirect URIs:** Should include:
```
https://ftelnmursmitpjwjbyrw.supabase.co/auth/v1/callback
```

**Authorized JavaScript origins:** Should include:
```
https://ftelnmursmitpjwjbyrw.supabase.co
```

---

## 🚨 Common Mistakes

### Mistake 1: Updated Wrong Project
- Multiple Google Cloud projects
- Updated the wrong one

**Fix:** Find the project that matches your Client ID from Supabase

---

### Mistake 2: Updated OAuth Client but Not Consent Screen
- These are TWO different things in Google Cloud

**OAuth Client:** The credentials (Client ID, Client Secret)
**OAuth Consent Screen:** The branding users see

**You need to update the CONSENT SCREEN, not the client!**

---

### Mistake 3: Different OAuth Clients for Prod/Stag
- Staging uses different Client ID than production
- Only updated one, testing the other

**Fix:** Check which Supabase project you're hitting, update that one's OAuth consent screen

---

## 📋 Tell Me

**Send me:**
1. **What "App name" shows** in OAuth consent screen right now
2. **First 20 characters** of your Client ID from Supabase
3. **Which Google Cloud project** you updated
4. **Are you testing on staging or production** Supabase

**I'll help you figure out what's wrong!**

---

## ⚡ Quick Test

**Try this:**

1. In incognito window
2. Go to: https://accounts.google.com/signin/oauth
3. Try to sign in with Google to ANY OAuth app
4. Sign out
5. Now go to your app and try signing in
6. Check branding

**This forces Google to refresh OAuth branding cache.**

---

**No deployment needed - this is 100% Google-side issue!**

