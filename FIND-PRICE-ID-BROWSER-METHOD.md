# Find Price IDs Using Browser Developer Tools

Since you can only see Product IDs in the Polar UI, let's use your browser to find the Price IDs!

## 🔧 Method: Browser Network Inspector

### Step 1: Open Developer Tools

1. Go to https://polar.sh and login
2. Press **F12** (or right-click → Inspect)
3. Click the **"Network"** tab at the top

### Step 2: Load Your Product

1. Click on **"Products"** in Polar sidebar
2. Click on **"Business Plan"**
3. In the Network tab, look for requests (lots of them will appear)

### Step 3: Find the Product API Call

1. In the Network tab's filter box, type: `products`
2. Look for a request that shows your product ID
3. Click on that request
4. Click the **"Response"** or **"Preview"** tab

### Step 4: Find Price IDs in the Response

You should see JSON data like this:

```json
{
  "id": "bbb245ef-6915-4c75-b59f-f14d61abb414",  // Product ID
  "name": "Business Plan",
  "prices": [                                     // ← Look here!
    {
      "id": "price_xxx_or_some_uuid",           // ← THIS IS IT!
      "price_amount": 3900,                       // $39.00
      "price_currency": "USD",
      "type": "recurring",
      "recurring_interval": "month"
    }
  ]
}
```

**The `prices[0].id` is your Price ID!**

### Step 5: Copy Both Price IDs

Repeat for Pro Plan to get both:
- Business Price ID from the Business product
- Pro Price ID from the Pro product

---

## 🎯 Quick PowerShell Method

Or run this PowerShell command to fetch them directly:

```powershell
# Get your API key from .env.local
$apiKey = (Get-Content ".env.local" | Select-String "POLAR_API_KEY" | ForEach-Object { $_ -replace 'POLAR_API_KEY=', '' }).ToString().Trim()

# Business Plan
$businessProduct = "bbb245ef-6915-4c75-b59f-f14d61abb414"
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://sandbox-api.polar.sh/v1/products/$businessProduct" -Headers $headers
    
    Write-Host "`nBusiness Plan Price IDs:" -ForegroundColor Green
    foreach ($price in $response.prices) {
        Write-Host "  Price ID: $($price.id)" -ForegroundColor Cyan
        Write-Host "  Amount: `$$($price.price_amount / 100) $($price.price_currency)" -ForegroundColor White
        Write-Host "  Interval: $($price.recurring_interval)" -ForegroundColor White
        Write-Host ""
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Pro Plan  
$proProduct = "4bd7788b-d3dd-4f17-837a-3a5a56341b05"

try {
    $response = Invoke-RestMethod -Uri "https://sandbox-api.polar.sh/v1/products/$proProduct" -Headers $headers
    
    Write-Host "Pro Plan Price IDs:" -ForegroundColor Green
    foreach ($price in $response.prices) {
        Write-Host "  Price ID: $($price.id)" -ForegroundColor Cyan
        Write-Host "  Amount: `$$($price.price_amount / 100) $($price.price_currency)" -ForegroundColor White
        Write-Host "  Interval: $($price.recurring_interval)" -ForegroundColor White
        Write-Host ""
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
```

Save this as `get-price-ids.ps1` and run it!

---

## ✅ What You'll Get

The script will output something like:

```
Business Plan Price IDs:
  Price ID: 01234567-89ab-cdef-0123-456789abcdef
  Amount: $39 USD
  Interval: month

Pro Plan Price IDs:
  Price ID: fedcba98-7654-3210-fedc-ba9876543210
  Amount: $19 USD
  Interval: month
```

**Copy those Price IDs** and use them in your code!

---

## 🔄 Update Your Code

Once you have the Price IDs, update:

**File**: `asset-tracer/app/api/subscription/upgrade/route.ts` (line 71-74)

```typescript
const productMapping: Record<string, string> = {
  pro: 'THE_PRO_PRICE_ID_FROM_ABOVE',           // ✅
  business: 'THE_BUSINESS_PRICE_ID_FROM_ABOVE', // ✅
};
```

Then try upgrading again!

