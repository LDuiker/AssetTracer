# 🔍 Google Analytics Troubleshooting Guide

## Issue: No "gtag" or "analytics" requests in Network tab

This means Google Analytics isn't loading. Here's how to fix it:

---

## ✅ **STEP 1: Verify Environment Variable in Vercel**

1. **Go to:** https://vercel.com/dashboard
2. **Select:** Your AssetTracer project
3. **Go to:** Settings → Environment Variables
4. **Check:**
   - Variable name: `NEXT_PUBLIC_GA_TRACKING_ID` (must be EXACT)
   - Value: `G-D9GZGDY9J0` (your Measurement ID)
   - **Environment:** Must be set for **Production** (since you're deploying from `main` branch)

**⚠️ CRITICAL:** If you added the variable AFTER the last deployment, it won't be available until you redeploy!

---

## ✅ **STEP 2: Check Deployment Environment Variables**

1. **Go to:** Vercel → Deployments
2. **Click** on your latest production deployment
3. **Scroll down** to "Environment Variables" section
4. **Look for:** `NEXT_PUBLIC_GA_TRACKING_ID`

**What to check:**
- [ ] Does it show `NEXT_PUBLIC_GA_TRACKING_ID = G-D9GZGDY9J0`? ✅
- [ ] Does it show a different value? ❌
- [ ] Does it NOT show the variable at all? ❌

**If it's missing or wrong, that's the problem!**

---

## ✅ **STEP 3: Force Redeploy (REQUIRED)**

After adding or changing environment variables, you MUST redeploy:

### Option 1: Redeploy from Vercel Dashboard (Recommended)

1. **Go to:** Vercel → Deployments
2. **Click** "..." (three dots) on your latest deployment
3. **Click:** "Redeploy"
4. **⚠️ UNCHECK** "Use existing Build Cache" ← **CRITICAL!**
5. **Click:** "Redeploy"
6. **Wait** 2-3 minutes for deployment to complete

### Option 2: Push Empty Commit

```powershell
git checkout main
git commit --allow-empty -m "chore: Trigger redeploy for GA tracking"
git push origin main
```

---

## ✅ **STEP 4: Verify After Redeploy**

1. **Wait** for deployment to complete (check Vercel dashboard)
2. **Visit:** https://www.asset-tracer.com
3. **Open DevTools** (F12)
4. **Go to:** Console tab
5. **Check for errors:**
   - If you see `[GA Debug] NEXT_PUBLIC_GA_TRACKING_ID is not set` → Variable not loaded
   - If no error → Variable is loaded, check Network tab

6. **Go to:** Network tab
7. **Filter by:** "gtag" or "googletagmanager"
8. **You should see:**
   - `gtag/js?id=G-D9GZGDY9J0`
   - Requests to `googletagmanager.com`

---

## 🔍 **Common Issues**

### Issue 1: Variable Not Set for Correct Environment

**Problem:** Variable is set for "Preview" but you're deploying from "main" branch

**Fix:** 
- Go to Vercel → Settings → Environment Variables
- Edit `NEXT_PUBLIC_GA_TRACKING_ID`
- Make sure "Production" is checked
- Save and redeploy

### Issue 2: Variable Added After Build

**Problem:** You added the variable but didn't redeploy

**Fix:** 
- Redeploy (see Step 3 above)
- Make sure to uncheck "Use existing Build Cache"

### Issue 3: Typo in Variable Name

**Problem:** Variable name is slightly wrong

**Fix:**
- Check it's exactly: `NEXT_PUBLIC_GA_TRACKING_ID`
- No extra spaces, no typos
- Case-sensitive

### Issue 4: Ad Blocker Blocking GA

**Problem:** Browser extension is blocking Google Analytics

**Fix:**
- Disable ad blocker temporarily
- Test in incognito mode
- Check if requests appear

---

## ✅ **Quick Test Script**

Open browser console (F12) and run:

```javascript
// Check if GA is loaded
if (typeof window.gtag === 'function') {
  console.log('✅ Google Analytics is loaded');
  console.log('DataLayer:', window.dataLayer);
} else {
  console.log('❌ Google Analytics is NOT loaded');
  console.log('Check if NEXT_PUBLIC_GA_TRACKING_ID is set');
}

// Check environment variable (only works in dev)
if (process?.env?.NEXT_PUBLIC_GA_TRACKING_ID) {
  console.log('✅ Variable exists:', process.env.NEXT_PUBLIC_GA_TRACKING_ID);
} else {
  console.log('❌ Variable not found');
}
```

---

## 📋 **Checklist**

- [ ] Environment variable added to Vercel
- [ ] Variable set for "Production" environment
- [ ] Variable name is exactly: `NEXT_PUBLIC_GA_TRACKING_ID`
- [ ] Variable value is: `G-D9GZGDY9J0`
- [ ] Redeployed after adding variable
- [ ] "Use existing Build Cache" was UNCHECKED during redeploy
- [ ] Deployment shows variable in "Environment Variables" section
- [ ] Network tab shows `gtag` requests after visiting site

---

## 🆘 **Still Not Working?**

If after all these steps it's still not working:

1. **Check Vercel build logs:**
   - Go to Deployment → Build Logs
   - Look for any errors related to environment variables

2. **Verify the Measurement ID:**
   - Go to Google Analytics
   - Admin → Data Streams → Web
   - Confirm the ID is `G-D9GZGDY9J0`

3. **Test locally:**
   - Create `.env.local` file
   - Add: `NEXT_PUBLIC_GA_TRACKING_ID=G-D9GZGDY9J0`
   - Run: `npm run dev`
   - Visit: `http://localhost:3000`
   - Check Network tab for `gtag` requests

---

**Most likely issue:** Environment variable was added but deployment hasn't picked it up yet. **Redeploy with cache unchecked!**

