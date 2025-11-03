# ✅ Check & Clean Supabase Auth URLs

## 🔍 Go Check Your Supabase Auth Settings

**Open this URL:**
https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration

---

## 📋 What Should You See?

### ✅ CORRECT Site URL:
```
https://assettracer-staging.vercel.app
```

**NOT:**
- ❌ `https://assettracer-staging-git-main-larona-duikers-projects.vercel.app`
- ❌ Any URL with `git-main` in it
- ❌ Any URL with `git-staging` in it
- ❌ Any localhost URL

---

### ✅ CORRECT Redirect URLs:

**You should have ONLY these:**

```
https://assettracer-staging.vercel.app/**
https://assettracer-staging.vercel.app/auth/callback
http://localhost:3000/**
http://localhost:3000/auth/callback
```

---

### ❌ DELETE These URLs (If Present):

Look for and **DELETE** any URLs that contain:
- `git-main`
- `git-staging`
- Any old Vercel preview URLs
- Any temporary deployment URLs
- Duplicate entries

**Examples of URLs to DELETE:**
```
❌ https://assettracer-staging-git-main-larona-duikers-projects.vercel.app/**
❌ https://assettracer-staging-git-main-larona-duikers-projects.vercel.app/auth/callback
❌ https://assettracer-git-***.vercel.app
❌ Any other preview URLs
```

---

## 🔧 How to Clean Up

1. **Go to the Auth URL Configuration page** (link above)

2. **Look at each Redirect URL in the list**

3. **For each URL:**
   - If it contains `git-main` → Click **Delete** ❌
   - If it contains `git-staging` → Click **Delete** ❌
   - If it's an old preview URL → Click **Delete** ❌
   - If it matches the "CORRECT" list above → Keep it ✅

4. **After deleting old URLs, verify you have:**
   - ✅ The main staging URL with `/**`
   - ✅ The main staging URL with `/auth/callback`
   - ✅ Localhost URLs (for local development)
   - ✅ Nothing else!

5. **Click SAVE** at the bottom

---

## 📸 Visual Guide

Your redirect URLs list should look like this:

```
┌─────────────────────────────────────────────────────────────────┐
│ Redirect URLs                                                   │
├─────────────────────────────────────────────────────────────────┤
│ https://assettracer-staging.vercel.app/**                      │
│ https://assettracer-staging.vercel.app/auth/callback           │
│ http://localhost:3000/**                                        │
│ http://localhost:3000/auth/callback                            │
└─────────────────────────────────────────────────────────────────┘
```

**Should have exactly 4 URLs** (or 2 if you don't need localhost).

---

## ⚠️ Why This Matters

If old git-main preview URLs are still there:
- OAuth might redirect to a dead/old URL
- You'll get 404 errors
- Login will fail silently
- Users will be redirected to wrong page

**Clean redirect URLs = reliable OAuth flow!**

---

## 🎯 After Cleaning

Once you've cleaned up the URLs:

1. **Click SAVE** in Supabase

2. **Wait 30 seconds** for changes to propagate

3. **Open FRESH incognito window**

4. **Go to:** `https://assettracer-staging.vercel.app`

5. **Try signing in** - should work now!

---

## 🔍 How to Tell If You Have Old URLs

**Look for these patterns in your redirect URLs:**
- `git-main` in the URL
- `git-staging` in the URL  
- Long random deployment IDs in the URL
- URLs you don't recognize
- More than 4 redirect URLs listed

**If you see any of these → DELETE them!**

---

## ✅ Final Configuration

After cleanup, you should have:

**Site URL:**
```
https://assettracer-staging.vercel.app
```

**Redirect URLs (exactly 4):**
```
1. https://assettracer-staging.vercel.app/**
2. https://assettracer-staging.vercel.app/auth/callback
3. http://localhost:3000/**
4. http://localhost:3000/auth/callback
```

**Nothing else!**

---

## 📝 Verification Checklist

After making changes, verify:

- [ ] Site URL is the main staging URL (no git-main)
- [ ] Redirect URLs list has exactly 4 entries
- [ ] No git-main URLs present
- [ ] No git-staging URLs present
- [ ] No old preview URLs present
- [ ] `/auth/callback` is explicitly listed
- [ ] Clicked SAVE button
- [ ] Waited 30 seconds for propagation

---

## 🚀 Next Steps

After cleaning up:

1. **Delete orphaned user:** Run `DELETE-ORPHANED-USER-NOW.sql`
2. **Clear browser cache:** Use fresh incognito window
3. **Test login:** Should work perfectly now!

---

**Go check your Supabase Auth URLs now and report back what you see!** 🔍

