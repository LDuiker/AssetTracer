# Update .env.staging with Yearly Price IDs

## 📋 Product IDs Provided

- **Pro Yearly Product ID:** `6b702adf-253f-48b1-bd2b-66d5ed8e6fbe`
- **Business Yearly Product ID:** `2fc222e8-0e50-4eb7-beb3-ca28c4010d52`

## ⚠️ Issue: Products Not Found in Production API

The script tried to fetch these from the production API but got 404 errors. This means:
- These products might be in **Sandbox** (for staging)
- OR they might not exist yet
- OR the Product IDs are incorrect

## 🔧 Solution Options

### Option 1: Check if Products are in Sandbox

If these are staging products, they're likely in Polar Sandbox. You'll need to:

1. **Get your Sandbox API Key:**
   - Go to Polar.sh Dashboard
   - Switch to Sandbox/Test mode
   - Get your Sandbox API key

2. **Run the script with Sandbox API:**
   ```powershell
   .\get-yearly-price-ids.ps1 -PolarApiKey "your_sandbox_api_key" -ProProductId "6b702adf-253f-48b1-bd2b-66d5ed8e6fbe" -BusinessProductId "2fc222e8-0e50-4eb7-beb3-ca28c4010d52"
   ```

### Option 2: Get Price IDs Manually from Polar Dashboard

1. **Go to Polar.sh Dashboard:**
   - https://polar.sh
   - Make sure you're in the correct environment (Sandbox for staging)

2. **For Pro Yearly:**
   - Go to Products
   - Find the product with ID: `6b702adf-253f-48b1-bd2b-66d5ed8e6fbe`
   - Click on it
   - Look at the "Prices" section
   - Find the yearly price (interval = "year")
   - **Copy the Price ID** (starts with `price_`)

3. **For Business Yearly:**
   - Repeat the same steps for product ID: `2fc222e8-0e50-4eb7-beb3-ca28c4010d52`

### Option 3: Create Yearly Prices if They Don't Exist

If the products exist but don't have yearly prices:

1. **Go to Polar.sh Dashboard**
2. **For each product:**
   - Click on the product
   - Click "Add Price" or "Create Price"
   - Set:
     - Amount: `182.00` (Pro) or `374.00` (Business)
     - Currency: `USD`
     - Type: `Recurring`
     - Billing Period: `Yearly` (or Interval: `year`)
   - Save and copy the Price ID

---

## 📝 Once You Have the Price IDs

Add these to your `.env.staging` file:

```env
# Yearly Subscription Price IDs
POLAR_PRO_YEARLY_PRICE_ID=your_pro_yearly_price_id_here
POLAR_BUSINESS_YEARLY_PRICE_ID=your_business_yearly_price_id_here
```

**Also add them to Vercel Staging Environment Variables:**
- Go to Vercel Dashboard → Your Staging Project
- Settings → Environment Variables
- Add:
  - `POLAR_PRO_YEARLY_PRICE_ID`
  - `POLAR_BUSINESS_YEARLY_PRICE_ID`

---

## 🆘 If Products Don't Exist

If you get 404 errors, the products might not be created yet. You'll need to:

1. **Create the products in Polar.sh:**
   - Pro Yearly Product (ID: `6b702adf-253f-48b1-bd2b-66d5ed8e6fbe`)
   - Business Yearly Product (ID: `2fc222e8-0e50-4eb7-beb3-ca28c4010d52`)

2. **Add yearly prices to each product**

3. **Then run the script again to get the Price IDs**

---

**Let me know:**
1. Are these products in Sandbox or Production?
2. Do you have a Sandbox API key?
3. Or would you prefer to get the Price IDs manually from the Polar dashboard?

