# How to Get Yearly Price IDs from Polar Dashboard

## 📋 Product IDs You Have

- **Pro Yearly Product ID:** `6b702adf-253f-48b1-bd2b-66d5ed8e6fbe`
- **Business Yearly Product ID:** `2fc222e8-0e50-4eb7-beb3-ca28c4010d52`

## 🎯 Step-by-Step: Get Price IDs from Polar Dashboard

### Step 1: Go to Polar Dashboard

1. **For Staging (Sandbox):**
   - Go to: https://sandbox.polar.sh/dashboard
   - Login with your account

2. **For Production:**
   - Go to: https://polar.sh/dashboard
   - Login with your account

### Step 2: Find the Pro Yearly Product

1. Click **"Products"** in the sidebar
2. Look for the product with ID: `6b702adf-253f-48b1-bd2b-66d5ed8e6fbe`
   - OR search for "Pro Yearly" or similar name
3. **Click on the product name** to open it

### Step 3: Get the Price ID

1. On the product page, look for the **"Prices"** section
2. Find the price with:
   - **Interval:** `year` or `yearly`
   - **Amount:** Should be around $182.00 (for Pro)
3. **Copy the Price ID** (it looks like: `price_xxxxxxxxxxxxx` or a UUID)

### Step 4: Repeat for Business Yearly

1. Go back to Products
2. Find product ID: `2fc222e8-0e50-4eb7-beb3-ca28c4010d52`
3. Click on it
4. Find the yearly price (should be around $374.00)
5. **Copy the Price ID**

---

## 📝 Update .env.staging

Once you have the Price IDs, add them to your `.env.staging` file:

```env
# Yearly Subscription Price IDs (Staging)
POLAR_PRO_YEARLY_PRICE_ID=your_pro_yearly_price_id_here
POLAR_BUSINESS_YEARLY_PRICE_ID=your_business_yearly_price_id_here
```

**Example:**
```env
POLAR_PRO_YEARLY_PRICE_ID=price_1Abc2Def3Ghi4Jkl
POLAR_BUSINESS_YEARLY_PRICE_ID=price_5Mno6Pqr7Stu8Vwx
```

---

## 🔧 Also Add to Vercel

**Don't forget to add these to Vercel Staging Environment Variables:**

1. Go to: https://vercel.com/dashboard
2. Select your **staging** project
3. Go to: **Settings** → **Environment Variables**
4. Add:
   - `POLAR_PRO_YEARLY_PRICE_ID` = [Your Pro Yearly Price ID]
   - `POLAR_BUSINESS_YEARLY_PRICE_ID` = [Your Business Yearly Price ID]

---

## ⚠️ Important Notes

1. **Price IDs are different from Product IDs**
   - Product ID: `6b702adf-253f-48b1-bd2b-66d5ed8e6fbe` ❌ (This is what you have)
   - Price ID: `price_xxxxxxxxxxxxx` ✅ (This is what you need)

2. **Check the correct environment:**
   - Staging products → Use Sandbox dashboard
   - Production products → Use Production dashboard

3. **If you can't find yearly prices:**
   - The products might not have yearly prices created yet
   - You'll need to create them in Polar dashboard first
   - See: `MONTHLY-YEARLY-SUBSCRIPTION-SETUP.md` for instructions

---

## 🆘 Can't Find the Products?

If you can't find the products in Polar dashboard:

1. **Check if you're in the right environment** (Sandbox vs Production)
2. **Check if the Product IDs are correct**
3. **The products might need to be created first**

Let me know what you find, and I'll help you get the Price IDs!

