# 🔍 Find Your Actual Staging URL

## The Problem

Vercel preview deployments don't use custom domains automatically. They use auto-generated URLs like:
```
https://assettracer-[git-branch]-[team-name].vercel.app
```

Your Supabase OAuth might be configured for `https://assettracer-staging.vercel.app`, but Vercel is serving at a different URL.

---

## ✅ **Step 1: Find Your Actual Deployment URL**

### Via Vercel Dashboard:
1. Go to: **Vercel Dashboard → Your Project → Deployments**
2. Find the latest **staging branch** deployment
3. Click on it
4. Copy the **actual URL** (it will be something like):
   ```
   https://asset-tracer-git-staging-[your-username].vercel.app
   ```

---

## ✅ **Step 2: Update Supabase OAuth URLs**

Once you have the **actual URL**, update Supabase:

Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration

### Update Site URL:
```
[Your actual Vercel URL from step 1]
```

### Update Redirect URLs (add all):
```
[Your actual Vercel URL]/auth/callback
[Your actual Vercel URL]/*
https://assettracer-staging.vercel.app/auth/callback
https://assettracer-staging.vercel.app/*
http://localhost:3000/auth/callback
http://localhost:3000/*
```

---

## ✅ **Step 3: Update NEXT_PUBLIC_APP_URL**

In **Vercel Dashboard → Settings → Environment Variables**:

Update `NEXT_PUBLIC_APP_URL` to match your **actual deployment URL**:
```
NEXT_PUBLIC_APP_URL=[Your actual Vercel URL from step 1]
```

Then **redeploy**.

---

## 🎯 **Alternative: Use Custom Domain**

If you want to use `assettracer-staging.vercel.app`:

### In Vercel Dashboard:
1. Go to: **Settings → Domains**
2. Click **Add Domain**
3. Enter: `assettracer-staging.vercel.app`
4. Assign to: **staging branch**
5. Wait for DNS to propagate

Then Vercel will serve staging at that exact URL.

---

## 🧪 **Quick Test**

To verify the URL mismatch is the issue:

1. **Open browser console** (F12) on your staging site
2. **Click "Continue with Google"**
3. **Watch the redirect URL** in the address bar
4. **After Google auth**, it should redirect to: `[your-url]/auth/callback?code=...`
5. **If the URL doesn't match** what's in Supabase, you'll get redirected to login

---

## 📋 **Summary**

The issue is:
- ❌ Supabase expects: `https://assettracer-staging.vercel.app/auth/callback`
- ✅ Vercel serves at: `https://asset-tracer-git-staging-username.vercel.app`
- 🔧 **Fix**: Update Supabase with the actual Vercel URL

---

**Find your actual Vercel deployment URL first, then update Supabase!**

