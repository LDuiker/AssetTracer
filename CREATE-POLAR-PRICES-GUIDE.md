# Creating Prices in Polar - Step-by-Step Guide

**Problem**: You can only see Product IDs, not Price IDs
**Solution**: Create prices for your products!

---

## 📸 Visual Guide: Where to Find/Create Prices

### Step 1: Login to Polar Dashboard

1. Go to: **https://polar.sh**
2. Login with your account
3. Make sure you're in **Sandbox/Test mode**

---

### Step 2: Navigate to Products

```
Dashboard
  └── Products (click here)
      └── Your Products List
```

You should see:
- Pro Plan Monthly (if created)
- Business Plan Monthly (if created)

---

### Step 3: Open a Product

**Click on the product name** (e.g., "Pro Plan Monthly")

You'll see a screen with:
```
┌─────────────────────────────────┐
│ Pro Plan Monthly                │ ← Product Name
│                                 │
│ Product ID: 4bd7788b-d3dd...   │ ← This is what you see now
│                                 │
│ Description: ...                │
│                                 │
│ ┌─────────────────────────┐    │
│ │  Prices                 │    │ ← Look for this section!
│ │  ────────────────────   │    │
│ │  [Add Price] button     │    │ ← Click here if empty
│ │                         │    │
│ │  Or existing prices:    │    │
│ │  • $19/month           │    │
│ │    Price ID: price_xxx │    │ ← This is what you need!
│ └─────────────────────────┘    │
└─────────────────────────────────┘
```

---

### Step 4: Add a Price (If No Prices Exist)

If the "Prices" section is empty, click **"Add Price"** or **"Create Price"**

Fill in these details:

#### For Pro Plan ($19/month):
```
┌──────────────────────────────┐
│ Create Price                 │
├──────────────────────────────┤
│ Amount: 19.00                │
│ Currency: USD                │
│ Type: Recurring              │
│ Billing Period: Monthly      │
│ (or Interval: month)         │
└──────────────────────────────┘
         [Create]
```

#### For Business Plan ($39/month):
```
┌──────────────────────────────┐
│ Create Price                 │
├──────────────────────────────┤
│ Amount: 39.00                │
│ Currency: USD                │
│ Type: Recurring              │
│ Billing Period: Monthly      │
└──────────────────────────────┘
         [Create]
```

---

### Step 5: Copy the Price ID

After creating the price, you'll see:

```
Prices:
  ✓ $19.00 / month
    Price ID: price_1Abc2Def3Ghi4Jkl  ← COPY THIS!
    Created: 2025-10-20
    Status: Active
```

**Copy the entire Price ID!**

---

## 🔄 Alternative: If You Can't Find "Prices" Section

### Try These Locations:

1. **Product Details Page**
   - Click Product → Look for "Pricing" or "Prices" tab

2. **Separate Prices Menu**
   - Some Polar versions have: Dashboard → Prices (separate menu)
   - Lists all prices across all products

3. **Product Settings**
   - Click Product → Settings → Prices

4. **API Explorer**
   - Dashboard → API → Products → Select Product → View Prices

---

## 💡 What If Your Product Already Has Prices?

If your product was created with a price, it might be automatically generated:

1. Click on your product
2. Scroll down to find "Prices" or "Pricing" section
3. You should see at least one price listed
4. Click on it to see the Price ID

Common price display formats:
```
• $19.00 / month    [View Details]
  ↳ Click here to see Price ID

• $19.00 / month
  ID: price_xxxxx   ← Direct display
```

---

## 🛠️ Screenshot Locations to Check

### Location 1: Product Detail Page
```
https://polar.sh/dashboard/products/[your-product-id]

Look for:
- "Prices" heading
- "Add Price" button
- List of existing prices
```

### Location 2: Prices Section
```
https://polar.sh/dashboard/prices

This shows ALL prices across all products
Filter by product name to find yours
```

---

## 📝 What to Do After Getting Price IDs

### 1. Update Your Code

Open: `asset-tracer/app/api/subscription/upgrade/route.ts`

Find this section (around line 71-74):
```typescript
const productMapping: Record<string, string> = {
  pro: '4bd7788b-d3dd-4f17-837a-3a5a56341b05',     // OLD: Product ID
  business: 'bbb245ef-6915-4c75-b59f-f14d61abb414', // OLD: Product ID
};
```

Replace with your Price IDs:
```typescript
const productMapping: Record<string, string> = {
  pro: 'price_YOUR_PRO_PRICE_ID',           // NEW: Price ID
  business: 'price_YOUR_BUSINESS_PRICE_ID', // NEW: Price ID
};
```

### 2. Save the File

The server will automatically reload.

### 3. Test the Upgrade

1. Go to http://localhost:3000/settings
2. Click "Upgrade to Business"
3. Should now work!

---

## ❓ Still Can't Find Prices?

### Option A: Contact Polar Support

If the UI is different or you can't find prices:
- Email: support@polar.sh
- Discord: https://discord.gg/polar
- Docs: https://docs.polar.sh

### Option B: Use API to Create Prices

If you're comfortable with API calls:

```powershell
# Create a price via API
$headers = @{
    "Authorization" = "Bearer YOUR_API_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    product_id = "4bd7788b-d3dd-4f17-837a-3a5a56341b05"
    price_amount = 1900  # $19.00 in cents
    price_currency = "USD"
    type = "recurring"
    recurring_interval = "month"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://sandbox-api.polar.sh/v1/products/prices" `
    -Method POST `
    -Headers $headers `
    -Body $body

Write-Host "Price ID: $($response.id)"
```

### Option C: Alternative Integration

We can try using:
- Checkout Links (simpler, pre-created links)
- Direct subscription creation (skip checkout)
- Payment links

Let me know if you want to try an alternative approach!

---

## 🎯 Quick Checklist

Before you can proceed, make sure:

- [ ] You can see your products in Polar dashboard
- [ ] Each product has at least one price
- [ ] You can see the Price ID for each price
- [ ] Price IDs are copied correctly (usually start with `price_`)
- [ ] Prices are marked as "Active"
- [ ] Prices are "Recurring" with "Monthly" interval

---

## 🔍 Common Issues

### Issue: "I only see Product ID, nothing about prices"

**Solution**: Your products might not have prices yet. Click "Add Price" to create them.

### Issue: "Add Price button is grayed out"

**Solution**: 
- Make sure product status is "Active"
- Check if you have the right permissions
- Try refreshing the page

### Issue: "Price ID looks like a UUID, not price_xxx"

**Solution**: That's okay! Some Polar versions use UUIDs for Price IDs. Use whatever ID is shown in the Price details.

---

**Need more help?** Let me know what you see in your Polar dashboard and I can guide you further! 🚀

