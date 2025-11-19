# Monthly & Yearly Subscription Setup Guide

## ✅ What Was Added

### 1. Billing Interval Toggle on Landing Page
- Added a toggle switch to choose between Monthly and Yearly billing
- Shows "Save 17%" badge when yearly is selected
- Dynamically updates pricing display

### 2. Updated Pricing Display
- **Monthly Prices:**
  - Pro: $19/month
  - Business: $39/month
  
- **Yearly Prices (20% savings):**
  - Pro: $182/year ($19/month billed annually)
  - Business: $374/year ($39/month billed annually)

### 3. Updated Upgrade API Route
- Now accepts `interval` parameter (`monthly` or `yearly`)
- Supports both monthly and yearly Price IDs from environment variables

---

## 🔧 Environment Variables Needed

You need to add these environment variables in **Vercel** (staging and production):

### Monthly Price IDs (Already Set)
- `POLAR_PRO_PRICE_ID` or `NEXT_PUBLIC_POLAR_PRO_PRICE_ID` ✅
- `POLAR_BUSINESS_PRICE_ID` or `NEXT_PUBLIC_POLAR_BUSINESS_PRICE_ID` ✅

### Yearly Price IDs (NEW - Need to Add)
- `POLAR_PRO_YEARLY_PRICE_ID` or `NEXT_PUBLIC_POLAR_PRO_YEARLY_PRICE_ID` ❌
- `POLAR_BUSINESS_YEARLY_PRICE_ID` or `NEXT_PUBLIC_POLAR_BUSINESS_YEARLY_PRICE_ID` ❌

---

## 📝 Steps to Complete Setup

### Step 1: Create Yearly Prices in Polar.sh

1. **Go to Polar.sh Dashboard:**
   - https://polar.sh
   - Navigate to your organization

2. **For Pro Plan:**
   - Go to Products → Find "Pro Plan Monthly"
   - Click "Add Price" or "Create Price"
   - Set:
     - Amount: `182.00`
     - Currency: `USD`
     - Type: `Recurring`
     - Billing Period: `Yearly` (or Interval: `year`)
   - **Copy the Price ID** (starts with `price_`)

3. **For Business Plan:**
   - Go to Products → Find "Business Plan Monthly"
   - Click "Add Price" or "Create Price"
   - Set:
     - Amount: `374.00`
     - Currency: `USD`
     - Type: `Recurring`
     - Billing Period: `Yearly` (or Interval: `year`)
   - **Copy the Price ID** (starts with `price_`)

### Step 2: Add Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your **staging** project

2. **Go to Settings → Environment Variables**

3. **Add these variables:**
   ```
   POLAR_PRO_YEARLY_PRICE_ID = [Your Pro Yearly Price ID]
   POLAR_BUSINESS_YEARLY_PRICE_ID = [Your Business Yearly Price ID]
   ```

4. **Repeat for Production:**
   - Switch to production project
   - Add the same environment variables

### Step 3: Redeploy

After adding environment variables:
- Vercel will automatically redeploy
- Or manually trigger a redeploy

---

## 🧪 Testing

### Test Monthly Subscription:
1. Go to landing page
2. Toggle should be on "Monthly"
3. Click "Get Started" on Pro or Business plan
4. Should use monthly Price ID

### Test Yearly Subscription:
1. Go to landing page
2. Toggle to "Yearly"
3. Should see:
   - Updated prices ($182/year, $374/year)
   - "Save 20%" badge
   - "$19/month billed annually" text
4. Click "Get Started" on Pro or Business plan
5. Should use yearly Price ID

---

## 📊 Pricing Calculation

**Yearly Pricing (20% savings):**
- Pro Monthly: $19 × 12 = $228
- Pro Yearly: $228 × 0.8 = **$182** (Save $46 = 20%)
- Business Monthly: $39 × 12 = $468
- Business Yearly: $468 × 0.8 = **$374** (Save $94 = 20%)

---

## ⚠️ Important Notes

1. **Yearly Price IDs are required** for yearly subscriptions to work
2. If yearly Price IDs are not set, the system will fall back to monthly
3. The toggle will still work on the frontend, but checkout will use monthly prices if yearly Price IDs are missing
4. Make sure to create yearly prices in **both** Polar sandbox (for staging) and production (for production)

---

## 🆘 Troubleshooting

### Issue: Yearly subscription uses monthly price
**Solution:** Check that yearly Price IDs are set in Vercel environment variables

### Issue: Toggle doesn't update prices
**Solution:** Clear browser cache or hard refresh (Ctrl+Shift+R)

### Issue: "Price does not exist" error
**Solution:** Verify the yearly Price IDs in Polar.sh match the environment variables

---

## ✅ Checklist

- [ ] Created yearly prices in Polar.sh (sandbox for staging)
- [ ] Created yearly prices in Polar.sh (production)
- [ ] Added `POLAR_PRO_YEARLY_PRICE_ID` to Vercel staging
- [ ] Added `POLAR_BUSINESS_YEARLY_PRICE_ID` to Vercel staging
- [ ] Added `POLAR_PRO_YEARLY_PRICE_ID` to Vercel production
- [ ] Added `POLAR_BUSINESS_YEARLY_PRICE_ID` to Vercel production
- [ ] Tested monthly subscription on staging
- [ ] Tested yearly subscription on staging
- [ ] Verified prices display correctly with toggle

