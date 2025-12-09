# 🔔 TODO: Set Up Google Analytics

**Priority:** Medium  
**Status:** ⏳ Pending  
**Created:** 2025-11-25

---

## 📋 Task

Set up Google Analytics 4 (GA4) for Asset Tracer to track:
- Website traffic
- User behavior
- Page views
- Conversion events
- User engagement metrics

---

## ✅ What's Already Prepared

1. **CSP Configuration** ✅
   - `next.config.ts` and `middleware.ts` already allow:
     - `https://www.googletagmanager.com`
     - `https://www.google-analytics.com`

2. **Environment Variable Template** ✅
   - Template exists: `NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX`
   - Currently commented out in production/staging env templates

---

## 🔧 Implementation Steps

### Step 1: Create Google Analytics 4 Property

1. Go to: https://analytics.google.com/
2. Sign in with your Google account
3. Click "Admin" (gear icon)
4. Create a new property:
   - Property name: "Asset Tracer"
   - Time zone: Your timezone
   - Currency: USD (or your preference)
5. Get your Measurement ID (format: `G-XXXXXXXXXX`)

### Step 2: Add Tracking Code

**File to modify:** `asset-tracer/app/layout.tsx`

Add Google Analytics Script component:

```typescript
import Script from 'next/script';

// In RootLayout component, add before </body>:
{process.env.NEXT_PUBLIC_GA_TRACKING_ID && (
  <>
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_TRACKING_ID}`}
      strategy="afterInteractive"
    />
    <Script id="google-analytics" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${process.env.NEXT_PUBLIC_GA_TRACKING_ID}', {
          page_path: window.location.pathname,
        });
      `}
    </Script>
  </>
)}
```

### Step 3: Add Environment Variable

**Vercel Production:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_GA_TRACKING_ID` = `G-XXXXXXXXXX` (your actual ID)
3. Apply to: Production

**Vercel Staging:**
1. Same process, but apply to: Preview/Staging
2. Can use same ID or create separate property for staging

### Step 4: Test

1. Deploy to staging first
2. Visit staging site
3. Check browser DevTools → Network tab for requests to `googletagmanager.com`
4. Check Google Analytics Real-Time reports to see if visits are tracked
5. Once verified, deploy to production

---

## 📊 Optional: Custom Events

Consider tracking:
- User sign-ups
- Quotation creation
- Invoice generation
- Asset creation
- Feature usage

These can be added later as custom events.

---

## 🔗 Resources

- [Google Analytics 4 Setup Guide](https://support.google.com/analytics/answer/9304153)
- [Next.js Script Component](https://nextjs.org/docs/app/api-reference/components/script)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)

---

## ✅ Completion Checklist

- [ ] Create GA4 property
- [ ] Get Measurement ID
- [ ] Add tracking code to `layout.tsx`
- [ ] Add environment variable to Vercel (staging)
- [ ] Test on staging
- [ ] Add environment variable to Vercel (production)
- [ ] Verify tracking in production
- [ ] Set up custom events (optional)

---

**Note:** This is a reminder file. Delete after Google Analytics is set up.

