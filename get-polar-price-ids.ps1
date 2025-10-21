# =====================================================
# Get Polar Price IDs for Production
# =====================================================
# This script retrieves your LIVE Polar price IDs
# =====================================================

Write-Host ""
Write-Host "Fetching Polar Price IDs..." -ForegroundColor Cyan
Write-Host ""

# Your organization ID
$orgId = "d5fdc147-60aa-40db-9ee5-b12e94557f2b"

# Prompt for LIVE API key
Write-Host "Enter your LIVE Polar API key (starts with polar_sk_live_):" -ForegroundColor Yellow
Write-Host "(You can find this at: https://polar.sh/settings)" -ForegroundColor Gray
$apiKey = Read-Host

Write-Host ""
Write-Host "Fetching products and prices..." -ForegroundColor Cyan
Write-Host ""

# API endpoint
$url = "https://api.polar.sh/v1/products?organization_id=$orgId"

# Headers
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Accept" = "application/json"
}

try {
    # Make API request
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host "POLAR PRODUCTS & PRICE IDs:" -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host ""
    
    # Display each product with its prices
    foreach ($product in $response.items) {
        Write-Host "Product: $($product.name)" -ForegroundColor Yellow
        Write-Host "  ID: $($product.id)" -ForegroundColor Gray
        
        if ($product.prices -and $product.prices.Count -gt 0) {
            foreach ($price in $product.prices) {
                $amount = $price.price_amount / 100
                $currency = $price.price_currency
                $interval = if ($price.recurring_interval) { "/$($price.recurring_interval)" } else { "" }
                
                Write-Host "  Price ID: $($price.id)" -ForegroundColor Cyan
                Write-Host "    Amount: $currency $amount$interval" -ForegroundColor Gray
                Write-Host "    Type: $($price.type)" -ForegroundColor Gray
                Write-Host ""
            }
        } else {
            Write-Host "  No prices found" -ForegroundColor Red
            Write-Host ""
        }
    }
    
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host "COPY THESE TO YOUR .env.production:" -ForegroundColor White
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host ""
    
    # Try to identify Pro and Business plans
    $proPrice = $null
    $businessPrice = $null
    
    foreach ($product in $response.items) {
        if ($product.name -match "Pro" -and $product.prices -and $product.prices.Count -gt 0) {
            $proPrice = $product.prices[0].id
            Write-Host "NEXT_PUBLIC_POLAR_PRO_PRICE_ID=$proPrice" -ForegroundColor Cyan
        }
        if ($product.name -match "Business" -and $product.prices -and $product.prices.Count -gt 0) {
            $businessPrice = $product.prices[0].id
            Write-Host "NEXT_PUBLIC_POLAR_BUSINESS_PRICE_ID=$businessPrice" -ForegroundColor Cyan
        }
    }
    
    if (-not $proPrice -or -not $businessPrice) {
        Write-Host ""
        Write-Host "Note: Could not auto-detect Pro/Business plans." -ForegroundColor Yellow
        Write-Host "Please copy the correct price IDs from the list above." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "Error fetching from Polar API:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host "MANUAL METHOD:" -ForegroundColor Yellow
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host ""
    Write-Host "1. Go to: https://polar.sh/dashboard/d5fdc147-60aa-40db-9ee5-b12e94557f2b/products" -ForegroundColor White
    Write-Host "2. Click on your Pro plan product" -ForegroundColor White
    Write-Host "3. Copy the Price ID (starts with 'price_')" -ForegroundColor White
    Write-Host "4. Repeat for Business plan" -ForegroundColor White
    Write-Host ""
}

