# 🔧 FIX Google OAuth Branding - You're Using Production DB!

## 🚨 The Issue

You're seeing `ftelnmursmitpjwjbyrw.supabase.co` instead of "AssetTracer"

This means you're hitting the **PRODUCTION Supabase project**, which likely has different Google OAuth credentials!

---

## ✅ THE FIX

You need to update BOTH Google Cloud projects:

### Project 1: Production (ftelnmursmitpjwjbyrw)
### Project 2: Staging (ougntjrrskfsuognjmcw)

---

## 🎯 Step 1: Find Your Google Cloud Projects

**Open:** https://console.cloud.google.com/

**You likely have TWO OAuth clients:**
1. One for production Supabase
2. One for staging Supabase

**OR you're sharing ONE OAuth client for both (common setup)**

---

## 🔍 Step 2: Check Which OAuth Client You're Using

### In Production Supabase:
1. Go to: https://supabase.com/dashboard/project/ftelnmursmitpjwjbyrw/auth/providers
2. Click **Google**
3. **Copy the Client ID** (first 20 characters)
4. Note it down: `_____________________`

### In Staging Supabase:
1. Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/providers
2. Click **Google**
3. **Copy the Client ID** (first 20 characters)
4. Note it down: `_____________________`

---

## ⚠️ Are They The SAME?

**If Client IDs match:**
- You're using ONE OAuth app
- Update that ONE OAuth consent screen
- Both will show "AssetTracer"

**If Client IDs are DIFFERENT:**
- You have TWO separate OAuth apps
- Update BOTH consent screens
- More work, but better separation

---

## ✅ Step 3: Update Google Cloud Console

### Option A: Shared OAuth Client (Most Common)

**Go to:** https://console.cloud.google.com/

1. **Select your project** (the one with the OAuth credentials)

2. **APIs & Services** → **OAuth consent screen**

3. **Update:**
   ```
   App name:                  AssetTracer
   User support email:        [YOUR EMAIL]
   Application home page:     https://www.asset-tracer.com
   ```

4. **Save**

**Done!** Both production and staging will now show "AssetTracer"

---

### Option B: Separate OAuth Clients (Less Common)

**You need to update BOTH:**

#### OAuth Client 1 (Production):
1. Go to: https://console.cloud.google.com/
2. Select project → **APIs & Services** → **OAuth consent screen**
3. Update app name to "AssetTracer"
4. Save

#### OAuth Client 2 (Staging):
1. Go to: https://console.cloud.google.com/
2. Select project → **APIs & Services** → **OAuth consent screen**
3. Update app name to "AssetTracer Staging"
4. Save

---

## 🔍 Step 4: Find Which Google Cloud Project

**If you're not sure which Google Cloud project has your OAuth:**

1. **In Supabase** → Google provider settings
2. **Copy the Client ID**
3. **Go to:** https://console.cloud.google.com/apis/credentials
4. **Search** for that Client ID
5. **Find which project** it's in
6. **Update that project's consent screen**

---

## ⚡ QUICKEST FIX

**Just try this:**

1. Open: https://console.cloud.google.com/
2. Look at all your projects
3. **For EACH project:**
   - Click it
   - Go to: **APIs & Services** → **OAuth consent screen**
   - Check the Client IDs listed
   - If ANY match your Supabase Client IDs, update that consent screen

**Repeat until you find the right one(s)!**

---

## 🧪 Test

After updating:

1. **Wait 2 minutes**
2. **Clear browser cache**
3. **Go to:** www.asset-tracer.com/login
4. **Click:** "Continue with Google"
5. **Should see:** "Continue to AssetTracer" ✅

---

## 🆘 Still See Supabase URL?

**Possible reasons:**

1. **Browser cache** - Clear it completely
2. **Using different Google account** - Try incognito with different account
3. **Google hasn't updated yet** - Wait 5-10 minutes
4. **Wrong OAuth client** - Check you updated the correct one

---

## 📞 Tell Me

**Come back and say:**
1. Are your production and staging Client IDs the same?
2. Which Google Cloud project did you update?
3. Are you STILL seeing the Supabase URL?

---

**The key:** You might have **TWO** Google OAuth clients, one for each Supabase project!

