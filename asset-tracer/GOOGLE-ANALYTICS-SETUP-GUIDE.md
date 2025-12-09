# 📊 Google Analytics Setup Guide

**Status:** ✅ Code implemented - Ready for Measurement ID

---

## ✅ What's Done

1. **Tracking Code Added** ✅
   - Added to `app/layout.tsx`
   - Uses Next.js Script component for optimal loading
   - Only loads when `NEXT_PUBLIC_GA_TRACKING_ID` is set

2. **CSP Configuration** ✅
   - Already allows `https://www.googletagmanager.com`
   - Already allows `https://www.google-analytics.com`

---

## 🔧 Next Steps: Get Your Measurement ID

### Step 1: Create Google Analytics 4 Property

1. **Go to:** https://analytics.google.com/
2. **Sign in** with your Google account
3. **Click "Admin"** (gear icon, bottom left)
4. **Create Property:**
   - Click "Create Property"
   - Property name: **"Asset Tracer"**
   - Reporting time zone: Your timezone
   - Currency: USD (or your preference)
   - Click "Next"
5. **Business Information:**
   - Industry: Business Software / SaaS
   - Business size: Small/Medium
   - Click "Create"
6. **Get Measurement ID:**
   - After creating, you'll see "Data Streams"
   - Click "Add stream" → "Web"
   - Website URL: `https://www.asset-tracer.com`
   - Stream name: "Asset Tracer Production"
   - Click "Create stream"
   - **Copy your Measurement ID** (format: `G-XXXXXXXXXX`)

---

## 🔑 Step 2: Add Environment Variable to Vercel

### For Production:

1. **Go to:** https://vercel.com/dashboard
2. **Select:** Your AssetTracer project
3. **Go to:** Settings → Environment Variables
4. **Add New Variable:**
   - **Key:** `NEXT_PUBLIC_GA_TRACKING_ID`
   - **Value:** `G-XXXXXXXXXX` (your actual Measurement ID)
   - **Environment:** Select **Production**
   - Click **Save**

### For Staging (Optional):

You can use the same Measurement ID or create a separate property:

1. **Same as above**, but:
   - **Environment:** Select **Preview** (for staging branch)
   - **Value:** Same ID or create separate property for staging

---

## ✅ Step 3: Verify It's Working

### After Deployment:

1. **Wait 2-3 minutes** for Vercel to deploy
2. **Visit your site:** https://www.asset-tracer.com
3. **Open Browser DevTools** (F12)
4. **Check Network tab:**
   - Look for requests to `googletagmanager.com`
   - Should see requests like: `gtag/js?id=G-XXXXXXXXXX`
5. **Check Google Analytics:**
   - Go to: https://analytics.google.com/
   - Navigate to: Reports → Realtime
   - Visit your site again
   - You should see yourself as an active user within 30 seconds

---

## 📊 What Gets Tracked

By default, Google Analytics will track:
- ✅ Page views
- ✅ User sessions
- ✅ Traffic sources
- ✅ Device types
- ✅ Geographic location
- ✅ Bounce rate
- ✅ Session duration

---

## 🎯 Optional: Custom Events (Future)

You can add custom event tracking later for:
- User sign-ups
- Quotation creation
- Invoice generation
- Asset creation
- Feature usage

Example:
```typescript
// Track custom event
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'quotation_created', {
    event_category: 'engagement',
    event_label: 'User created quotation',
  });
}
```

---

## 🔍 Troubleshooting

### Not seeing data?

1. **Check environment variable:**
   - Vercel Dashboard → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_GA_TRACKING_ID` is set
   - Verify it's set for the correct environment (Production/Preview)

2. **Check browser console:**
   - Open DevTools → Console
   - Look for any errors related to Google Analytics

3. **Check network requests:**
   - DevTools → Network tab
   - Filter by "gtag" or "analytics"
   - Should see requests to googletagmanager.com

4. **Verify Measurement ID:**
   - Make sure it starts with `G-`
   - No extra spaces or characters
   - Copy-paste directly from Google Analytics

5. **Ad blockers:**
   - Some ad blockers block Google Analytics
   - Test in incognito mode or disable ad blocker

---

## ✅ Completion Checklist

- [x] Tracking code added to `layout.tsx`
- [ ] Create GA4 property
- [ ] Get Measurement ID
- [ ] Add `NEXT_PUBLIC_GA_TRACKING_ID` to Vercel (Production)
- [ ] Add `NEXT_PUBLIC_GA_TRACKING_ID` to Vercel (Preview/Staging - optional)
- [ ] Deploy and verify tracking works
- [ ] Check Real-Time reports in Google Analytics

---

**Once you have your Measurement ID, add it to Vercel and redeploy!**

