# 🔍 Why Google Still Shows Supabase Domain

## The Problem

Even though:
- ✅ App name is set to "AssetTracer" in Google Cloud Console
- ✅ App is published ("Verification is not required")
- ✅ You've saved and waited
- ✅ Tested in incognito

**Google still shows:** `ftelnmursmitpjwjbyrw.supabase.co`

---

## 🎯 Root Cause

**This is a Google OAuth behavior when using Supabase:**

1. **Google shows the redirect URI domain**, not the app name
2. Your redirect URI is: `https://ftelnmursmitpjwjbyrw.supabase.co/auth/v1/callback`
3. Google sees this as the "destination" and displays it
4. **This happens even if your app name is set correctly**

---

## ✅ The Solution: Custom Domain for Supabase Auth

**To show "AssetTracer" instead of the Supabase domain, you need:**

### Option 1: Use Custom Domain for Supabase Auth (Recommended)

Supabase allows you to use a custom domain for authentication:

1. **In Supabase Dashboard:**
   - Go to: **Settings** → **Auth** → **URL Configuration**
   - Set **Site URL** to: `https://www.asset-tracer.com`
   - Add **Redirect URLs**: `https://www.asset-tracer.com/auth/callback`

2. **Update Google OAuth Redirect URI:**
   - Go to Google Cloud Console → **APIs & Services** → **Credentials**
   - Find your OAuth 2.0 Client ID
   - Add redirect URI: `https://www.asset-tracer.com/auth/callback`
   - Remove or keep the Supabase one (Supabase will handle the redirect)

3. **Update your app's auth configuration:**
   - Make sure your Next.js app redirects to your custom domain
   - Not directly to Supabase's domain

**Result:** Google will show `www.asset-tracer.com` instead of the Supabase domain.

---

### Option 2: Verify Your App with Google (Long-term Solution)

**For Google to show your app name instead of domain:**

1. **Submit your app for Google verification:**
   - Go to OAuth consent screen → **"Publish"** or **"Submit for verification"**
   - Provide:
     - Privacy Policy URL
     - Terms of Service URL
     - App screenshots
     - Justification for OAuth scopes
   - Wait 1-2 weeks for Google to review

2. **After verification:**
   - Google will show "AssetTracer" instead of any domain
   - This is the best user experience

**Note:** Verification is not required for basic OAuth, but it's needed for the app name to show instead of the domain.

---

### Option 3: Accept the Limitation (Short-term)

**If you can't implement custom domain or verification right now:**

- Users will see `ftelnmursmitpjwjbyrw.supabase.co`
- **But:** OAuth still works perfectly
- **And:** Users trust Google sign-in regardless
- This is a cosmetic issue, not a functional one

---

## 🔍 Why This Happens

**Google's OAuth consent screen logic:**

1. **If app is verified:** Shows app name ✅
2. **If app is unverified:** Shows redirect URI domain ⚠️
3. **If redirect URI is from different domain:** Shows that domain ⚠️

**Your situation:**
- App is unverified (even though "verification not required")
- Redirect URI is Supabase domain
- Google shows Supabase domain

---

## ✅ Recommended Action Plan

### Immediate (Option 1 - Custom Domain):

1. **Set up custom domain for Supabase auth**
2. **Update Google OAuth redirect URI**
3. **Update your app configuration**
4. **Result:** Shows `www.asset-tracer.com` (better than Supabase ID)

### Long-term (Option 2 - Verification):

1. **Create Privacy Policy page** at: `https://www.asset-tracer.com/privacy`
2. **Create Terms of Service page** at: `https://www.asset-tracer.com/terms`
3. **Submit app for Google verification**
4. **Wait 1-2 weeks for approval**
5. **Result:** Shows "AssetTracer" (best user experience)

---

## 🆘 Quick Test

**To verify which redirect URI Google is using:**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Look at **"Authorized redirect URIs"**
4. **What domains are listed?**
   - If you see `*.supabase.co` → That's why Google shows Supabase domain
   - If you see `www.asset-tracer.com` → Should show your domain

---

## 📝 Next Steps

**Tell me which option you want to pursue:**

1. **Option 1:** Set up custom domain for Supabase auth (I'll guide you)
2. **Option 2:** Submit for Google verification (I'll help with requirements)
3. **Option 3:** Accept it for now (it's just cosmetic)

**What would you like to do?**

