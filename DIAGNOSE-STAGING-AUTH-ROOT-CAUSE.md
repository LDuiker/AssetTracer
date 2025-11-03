# 🔍 ROOT CAUSE ANALYSIS: Staging Auth Redirect

## What We Know
- ✅ Database is configured correctly (trigger, RLS, schema match)
- ❌ You're redirected to LOGIN page (not landing page)
- ✅ This worked in production before

## Key Difference: Login vs Landing Page Redirect

| Redirect To | Meaning | Root Cause |
|-------------|---------|------------|
| **Landing Page** | Authenticated, but no profile | Missing OAuth trigger or orphaned users |
| **Login Page** | NOT authenticated | Session not created, cookie issue, or wrong Supabase URL |

You're getting redirected to LOGIN page, which means **the session is never created**.

---

## 🎯 ROOT CAUSE POSSIBILITIES

### 1. **Testing Wrong URL** (Most Common)
**Problem**: You're testing on auto-generated Vercel URL, not your configured domain

**Check**: What URL are you actually visiting?
- ❌ Wrong: `https://asset-tracer-git-staging-xxxxx.vercel.app`
- ✅ Correct: `https://assettracer-staging.vercel.app`

**Fix**: Make sure you're testing on the exact domain configured in Supabase

---

### 2. **Vercel Deployed Old Code** (Your Production Issue!)
**Problem**: Staging branch has new commits but Vercel is serving an old build

**Check**: 
```
1. Go to Vercel Dashboard → Deployments
2. Look at latest staging deployment
3. Check the commit hash
4. Compare with: git log staging -1
```

**Fix**: Manual redeploy with "Use existing Build Cache" UNCHECKED

---

### 3. **Environment Variables Not Applied**
**Problem**: Vercel built with wrong Supabase URL (maybe production URL)

**Check in Vercel build logs**:
Look for "Polar Client initialized" - it should show:
```
Polar Client initialized: {
  hasApiKey: true,
  apiKeyPrefix: 'polar_oat_4wgNy',  // Sandbox key
  baseUrl: 'https://sandbox-api.polar.sh'
}
```

If it shows production Polar key, env vars are wrong.

**Fix**: Verify env vars are set to "Preview" environment, then redeploy

---

### 4. **Cookie Domain Mismatch**
**Problem**: Supabase auth cookie can't be set for the domain

**Check browser console** (F12) after OAuth redirect:
```javascript
// After redirect, check cookies
document.cookie.split(';').filter(c => c.includes('supabase'))
```

Should see Supabase auth cookies. If empty, cookie domain is wrong.

**Fix**: Verify `NEXT_PUBLIC_APP_URL` matches the exact domain you're visiting

---

## 🔧 COMPREHENSIVE FIX SCRIPT

Run this to check EVERYTHING:

1. **Check what URL you're actually testing**
2. **Check Vercel deployment commit hash**
3. **Check browser console for errors**
4. **Check network tab for which Supabase URL is being called**

---

## 📋 EXACT STEPS TO DEBUG

### Step 1: Verify URLs
```bash
# In terminal
git log staging -1 --oneline
# Note the commit hash

# Check Vercel Dashboard
# Compare commit hash with what's deployed
```

### Step 2: Check Browser Console
1. Open: https://assettracer-staging.vercel.app (EXACT URL)
2. Open Console (F12)
3. Before logging in, run:
```javascript
console.log('App URL:', window.location.origin);
// Should be: https://assettracer-staging.vercel.app
```

### Step 3: Try Login & Watch Network Tab
1. Open Network tab (F12)
2. Click "Continue with Google"
3. Watch the requests
4. Look for calls to Supabase
5. Note which Supabase URL is being called

**Expected**: `https://ougntjrrskfsuognjmcw.supabase.co`
**Problem**: If it's calling production Supabase URL, env vars are wrong

### Step 4: Check OAuth Callback
After Google login, you should see:
```
1. Redirect to: https://ougntjrrskfsuognjmcw.supabase.co/auth/v1/callback
2. Then to: https://assettracer-staging.vercel.app/auth/callback?code=...
3. Then to: https://assettracer-staging.vercel.app/dashboard
```

**If it fails at step 2**: Supabase Redirect URLs are wrong
**If it fails at step 3**: Auth callback route isn't working or session not created

---

## 🎯 MOST LIKELY ROOT CAUSES (Based on Production Experience)

### Cause 1: Vercel Serving Old Code
**Symptoms**: 
- Git shows latest code
- Vercel deployment shows old commit
- OAuth worked before, now doesn't

**Fix**: Force redeploy without cache

### Cause 2: Testing Wrong URL
**Symptoms**:
- assettracer-staging.vercel.app works
- But you're testing asset-tracer-git-staging-xxx.vercel.app

**Fix**: Use exact configured domain

### Cause 3: Environment Variables Not Set to Preview
**Symptoms**:
- Vars exist but set to "Production" instead of "Preview"
- Staging calls production Supabase

**Fix**: Change environment to "Preview" and redeploy

---

## 🚨 ACTION PLAN

**Tell me:**
1. What is the **exact URL** you're visiting?
2. What **commit hash** does Vercel show for latest staging deployment?
3. What does `git log staging -1` show?
4. Do you see **any errors** in browser console when trying to log in?

With these 4 answers, I can identify the exact root cause.

