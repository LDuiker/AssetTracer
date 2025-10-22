# Google OAuth - Quick Reference Card

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| **Google Cloud Console** | https://console.cloud.google.com/ |
| **Supabase Dashboard** | https://supabase.com/dashboard |
| **Your Vercel App** | https://[your-app].vercel.app |

---

## 📝 Step-by-Step Checklist

### Part 1: Google Cloud Console

- [ ] **1.1** Go to https://console.cloud.google.com/
- [ ] **1.2** Create new project OR select existing
- [ ] **1.3** Enable Google+ API:
  - APIs & Services → Library
  - Search: "Google+ API"
  - Click Enable
- [ ] **1.4** Configure OAuth Consent Screen:
  - APIs & Services → OAuth consent screen
  - User Type: **External**
  - App name: **AssetTracer**
  - User support email: **[your-email]**
  - Authorized domains: **vercel.app**, **supabase.co**
  - Scopes: **email**, **profile**, **openid**
  - Save and Continue
- [ ] **1.5** Create OAuth Client ID:
  - APIs & Services → Credentials
  - Create Credentials → OAuth Client ID
  - Application type: **Web application**
  - Name: **AssetTracer Web Client**
  - Authorized JavaScript origins: **[leave empty or add Supabase URL]**
  - Authorized redirect URIs:
    ```
    https://[your-supabase-ref].supabase.co/auth/v1/callback
    ```
  - Click Create
- [ ] **1.6** **SAVE YOUR CREDENTIALS**:
  ```
  Client ID: ____________________________________________
  Client Secret: _________________________________________
  ```

---

### Part 2: Supabase Configuration

- [ ] **2.1** Go to https://supabase.com/dashboard
- [ ] **2.2** Select your **PRODUCTION** project
- [ ] **2.3** Get your Supabase Project URL:
  - Project Settings → API
  - Copy **Project URL**
  - Example: `https://abcdefghijk.supabase.co`
  - Your project ref: `________________`
- [ ] **2.4** Enable Google Provider:
  - Authentication → Providers
  - Find **Google**
  - Toggle **ON**
- [ ] **2.5** Enter credentials:
  - Client ID: [paste from Google Cloud]
  - Client Secret: [paste from Google Cloud]
- [ ] **2.6** Click **Save**
- [ ] **2.7** Copy the **Redirect URL** shown:
  ```
  Should be: https://[your-ref].supabase.co/auth/v1/callback
  ```

---

### Part 3: Verify Google Cloud Redirect URI

- [ ] **3.1** Go back to Google Cloud Console
- [ ] **3.2** APIs & Services → Credentials
- [ ] **3.3** Click on your OAuth Client
- [ ] **3.4** Verify **Authorized redirect URIs** includes:
  ```
  https://[your-supabase-ref].supabase.co/auth/v1/callback
  ```
- [ ] **3.5** If not, add it and click **Save**

---

### Part 4: Test

- [ ] **4.1** Go to your app: `https://[your-app].vercel.app`
- [ ] **4.2** You should see the **"Continue with Google"** button
- [ ] **4.3** Click the button
- [ ] **4.4** Select your Google account
- [ ] **4.5** First time: Click **Allow** on consent screen
- [ ] **4.6** You should be redirected and logged in ✅
- [ ] **4.7** Verify in Supabase:
  - Authentication → Users
  - Your account should appear with provider: **google**

---

## 🔑 Credential Template

Fill this out as you go:

```
===========================================
GOOGLE OAUTH CREDENTIALS
===========================================

Google Cloud Project Name: _________________

Client ID:
_____________________________________________

Client Secret:
_____________________________________________

Supabase Project URL:
https://__________.supabase.co

Supabase Redirect URI:
https://__________.supabase.co/auth/v1/callback

Vercel App URL:
https://__________.vercel.app

===========================================
✅ CHECKLIST
===========================================
[ ] Google+ API enabled
[ ] OAuth consent screen configured
[ ] OAuth Client created
[ ] Credentials saved
[ ] Google provider enabled in Supabase
[ ] Credentials entered in Supabase
[ ] Redirect URI matches
[ ] Tested and working
===========================================
```

---

## 🐛 Common Issues & Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| **"Redirect URI mismatch"** | Make sure the redirect URI in Google Cloud **exactly matches** the one shown in Supabase |
| **"Access blocked"** | Google Cloud Console → OAuth consent screen → Click "Publish App" |
| **"Invalid client_id"** | Double-check you copied the correct Client ID from Google Cloud |
| **Button not showing** | Your app already has it! Just make sure Google provider is enabled in Supabase |

---

## ⏱️ Estimated Time

- **Google Cloud Setup**: 10-15 minutes
- **Supabase Configuration**: 2-3 minutes
- **Testing**: 1-2 minutes
- **Total**: ~15-20 minutes

---

## 📞 Need Help?

If you get stuck:
1. Check `GOOGLE-OAUTH-SETUP.md` for detailed instructions
2. Make sure ALL fields match exactly (no extra spaces!)
3. Wait 5 minutes after saving in Google Cloud (changes need to propagate)
4. Try in an incognito window (clears cookies/cache)

---

**Last Updated**: October 22, 2025

