# How to Find Your Polar Price IDs

**Current Issue**: Your checkout is failing because you're using **Product IDs** instead of **Price IDs**.

```
Error: "Price does not exist"
Input: "bbb245ef-6915-4c75-b59f-f14d61abb414"
```

---

## 🎯 Quick Fix Guide

### Step 1: Go to Your Polar Dashboard

1. Open your browser and go to: **https://polar.sh**
2. Login to your account
3. You should see your "Asset Tracer" organization

### Step 2: Navigate to Products

1. In the sidebar, click **"Products"**
2. You should see your created products (if any)

### Step 3: Find Your Price IDs

For each product (Pro and Business):

1. **Click on the product name**
2. Look for the **"Prices"** section
3. You'll see something like:

   ```
   Product: Pro Plan Monthly
   └── Price: $19.00/month
       Price ID: price_xxxxxxxxxxxxxxxxx
   ```

4. **Copy the Price ID** (starts with `price_` or similar)

### Step 4: Update Your Code

Open `asset-tracer/app/api/subscription/upgrade/route.ts` and update line 69-72:

**Current (Wrong - Using Product IDs)**:
```typescript
const productMapping: Record<string, string> = {
  pro: '4bd7788b-d3dd-4f17-837a-3a5a56341b05',        // ❌ Product ID
  business: 'bbb245ef-6915-4c75-b59f-f14d61abb414',   // ❌ Product ID
};
```

**Updated (Correct - Using Price IDs)**:
```typescript
const productMapping: Record<string, string> = {
  pro: 'YOUR_PRO_PRICE_ID_HERE',           // ✅ Price ID from Polar
  business: 'YOUR_BUSINESS_PRICE_ID_HERE', // ✅ Price ID from Polar
};
```

### Step 5: Save and Test

1. Save the file
2. The server will auto-reload
3. Try upgrading again!

---

## 📝 If You Don't Have Products Yet

If you don't see any products in your Polar dashboard:

### Create Products

1. Go to https://polar.sh
2. Click **"Products"** → **"Create Product"**

3. **Create Pro Plan**:
   ```
   Name: Pro Plan Monthly
   Description: Professional features for growing businesses
   Price: $19.00 USD
   Billing: Monthly
   Type: Recurring
   ```

4. **Create Business Plan**:
   ```
   Name: Business Plan Monthly
   Description: Advanced features for established businesses
   Price: $39.00 USD
   Billing: Monthly
   Type: Recurring
   ```

5. After creating each product, **click on it** and copy the **Price ID**

---

## 🔍 What's the Difference?

### Product vs Price

- **Product**: The thing you're selling (e.g., "Pro Plan")
  - Product ID: `4bd7788b-d3dd-4f17-837a-3a5a56341b05`

- **Price**: The specific pricing for that product (e.g., "$19/month")
  - Price ID: `price_abc123xyz...`

**Products can have multiple prices** (monthly, yearly, etc.), so Polar requires the specific Price ID for checkout.

---

## ✅ Expected Result

After updating with correct Price IDs:

1. Click "Upgrade to Business"
2. Should see:
   ```
   ✅ Customer found: 93853d15...
   ✅ Creating checkout with Price ID: price_xxx...
   ✅ Checkout session created
   ✅ Redirecting to: https://checkout.polar.sh/...
   ```

3. You'll be redirected to Polar checkout page
4. Complete payment with test card: `4242 4242 4242 4242`
5. Get redirected back with success!

---

## 🚨 Important Notes

1. **Price IDs are different from Product IDs**
   - Always use Price IDs for checkout
   - Product IDs are for reference only

2. **Each product can have multiple prices**
   - Monthly price
   - Yearly price
   - Different currencies
   - Each has its own Price ID

3. **Price IDs usually start with `price_`**
   - Format: `price_xxxxxxxxxxxxxxxx`
   - Different from Product IDs which use UUID format

---

## 💡 Quick Test

Once you have your Price IDs, you can test them:

### In PowerShell:
```powershell
# Set your variables
$apiKey = "your_api_key"
$priceId = "your_price_id"
$baseUrl = "https://sandbox-api.polar.sh"

# Test the price
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/v1/products/prices/$priceId" -Headers $headers
    Write-Host "✅ Price found:" -ForegroundColor Green
    Write-Host $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Price not found" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
```

---

## 📚 Additional Resources

- **Polar Products**: https://polar.sh (Dashboard → Products)
- **Polar API Docs**: https://docs.polar.sh/api
- **Polar Pricing Guide**: https://docs.polar.sh/products-and-pricing

---

**Once you have your Price IDs, update the code and try again!** 🚀

