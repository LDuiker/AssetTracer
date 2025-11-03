# 🚨 Fix Vercel 404: DEPLOYMENT_NOT_FOUND Error

## Error Details
```
404: NOT_FOUND
Code: DEPLOYMENT_NOT_FOUND
ID: cpt1::fkvh2-1761316619952-b3ba05a6892f
```

This error appears when trying to sign in/login.

---

## 🎯 Root Cause

This happens when:
1. **Domain points to wrong deployment** - URL is referencing a deleted deployment
2. **Branch deployment deleted** - The git-main preview was removed
3. **Project misconfigured** - Vercel project settings are wrong
4. **OAuth callback URL mismatch** - Supabase redirect URL doesn't match actual Vercel URL

---

## ✅ Solution Steps

### Step 1: Find Your Actual Staging URL

**Go to Vercel Dashboard:**
1. https://vercel.com/dashboard
2. Click your staging project
3. Go to **Deployments** tab
4. Find the LATEST successful deployment
5. Click on it to see the URL

**Your REAL staging URL should be ONE of these:**
- ✅ `https://assettracer-staging.vercel.app` (main project URL)
- ⚠️ `https://assettracer-staging-git-staging-...vercel.app` (branch preview)
- ❌ `https://assettracer-staging-git-main-...vercel.app` (preview - might be deleted)

---

### Step 2: Check Domain Configuration

**In Vercel Project:**

1. Go to **Settings** → **Domains**

2. You should see your domain listed

3. **If domain is missing or shows error:**
   - Click **"Add"**
   - Add: `assettracer-staging.vercel.app`
   - Save

4. **If domain shows as "Invalid" or "Error":**
   - Remove it
   - Re-add it

---

### Step 3: Check Which Branch is Deploying

**In Vercel Project:**

1. Go to **Settings** → **Git**

2. Check **"Production Branch"**: Should be `staging`

3. If it's still `main`, change it to `staging` and save

4. **Trigger new deployment:**
   - Go to **Deployments** tab
   - Click latest deployment
   - Click **"..."** → **Redeploy**
   - UNCHECK "Use existing Build Cache"
   - Click **Redeploy**

---

### Step 4: Get Your Correct Staging URL

After the deployment completes:

**The correct URL will be shown at the top of the deployment page.**

**Common patterns:**
- If production branch is `staging`: `https://[project-name].vercel.app`
- If it's a preview: `https://[project-name]-git-staging-[username].vercel.app`

**Copy this URL - you'll need it for Supabase!**

---

### Step 5: Update Supabase Auth URLs

This is CRITICAL - Supabase needs the EXACT URL:

1. Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration

2. Set **Site URL** to your ACTUAL staging URL from Step 4:
   ```
   https://[your-actual-staging-url].vercel.app
   ```

3. Set **Redirect URLs** to include:
   ```
   https://[your-actual-staging-url].vercel.app/**
   https://[your-actual-staging-url].vercel.app/auth/callback
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

4. **IMPORTANT**: Remove any OLD/INVALID URLs that no longer work

5. **Save**

---

### Step 6: Clear Cache and Test

1. **Clear browser cache** or use **fresh incognito window**

2. Go to your CORRECT staging URL (from Step 4)

3. Try signing in

4. Should work now! ✅

---

## 🔧 Alternative: Create Fresh Vercel Deployment

If the above doesn't work, your deployment might be corrupted. Create a fresh one:

### Option A: Force New Deployment

```bash
# In your project directory
git checkout staging
git commit --allow-empty -m "Force fresh Vercel deployment"
git push origin staging
```

Then wait 2-3 minutes for Vercel to deploy.

### Option B: Redeploy from Vercel Dashboard

1. Go to Vercel → Your staging project → **Deployments**
2. Find ANY successful deployment (even old ones)
3. Click **"..."** → **"Redeploy"**
4. UNCHECK "Use existing Build Cache"
5. Click **Redeploy**

---

## 🆘 Common Issues & Fixes

### Issue: "I don't see my staging project in Vercel"

**Fix:**
- You might only have one project
- Create a second project for staging (see below)

### Issue: "All my URLs give 404 errors"

**Fix:**
- Project might be deleted
- Create new Vercel project and reconnect

### Issue: "OAuth redirect still fails"

**Fix:**
- Check Supabase redirect URLs match EXACTLY
- No trailing slashes
- Use HTTPS (not HTTP)

---

## 📝 Create Second Vercel Project (If Needed)

If you don't have a dedicated staging project:

1. Go to: https://vercel.com/new

2. **Import your repository**: `AssetTracer`

3. **Name it**: `assettracer-staging`

4. **Root Directory**: `./asset-tracer` (if not at root)

5. **Add Environment Variables** (BEFORE deploying):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-staging-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[your-staging-service-role-key]
   NEXT_PUBLIC_POLAR_SANDBOX=true
   NEXT_PUBLIC_ENV=staging
   ```

6. **Deploy**

7. After deployment:
   - Go to **Settings** → **Git**
   - Set **Production Branch** to: `staging`
   - Save

8. **Copy the deployment URL** and update Supabase

---

## ✅ Final Checklist

After fixing:

- [ ] Vercel deployment is successful (green checkmark)
- [ ] You have the CORRECT staging URL
- [ ] Supabase Site URL matches Vercel URL exactly
- [ ] Supabase Redirect URLs include staging URL
- [ ] Tested in fresh incognito window
- [ ] Can access landing page (no 404)
- [ ] Can click "Sign in with Google" (no 404)

---

## 🎯 What URLs Should You Use?

| Purpose | URL | Where to Set |
|---------|-----|--------------|
| **Access Staging** | `https://assettracer-staging.vercel.app` | Browser |
| **Supabase Site URL** | Same as above | Supabase Auth Settings |
| **Supabase Redirect** | `https://assettracer-staging.vercel.app/auth/callback` | Supabase Auth Settings |

**Never use:**
- ❌ git-main preview URLs (they're temporary)
- ❌ Old deployment URLs
- ❌ Localhost in production settings

---

## 🚀 Quick Actions RIGHT NOW

**1. Check your Vercel deployment:**
```
Go to: https://vercel.com/dashboard
Find: Your staging project
Check: Latest deployment status
Copy: The actual URL
```

**2. Update Supabase:**
```
Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration
Set: Site URL to your actual Vercel URL
Add: Redirect URLs
Save: Changes
```

**3. Test:**
```
Open: Fresh incognito window
Go to: Your actual staging URL
Try: Sign in with Google
```

---

**Tell me:**
1. What is your actual staging URL from Vercel?
2. Is the deployment showing as "Ready" (green)?
3. How many Vercel projects do you have?

