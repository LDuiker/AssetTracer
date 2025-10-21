# Get Polar Price IDs
# This script fetches your products and their price IDs from Polar

param(
    [string]$ApiKey = $env:POLAR_API_KEY,
    [string]$BaseUrl = "https://sandbox-api.polar.sh"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "    POLAR PRICE ID FINDER" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

if (-not $ApiKey) {
    # Try to load from .env.local
    if (Test-Path ".env.local") {
        $ApiKey = (Get-Content ".env.local" | Select-String "POLAR_API_KEY" | ForEach-Object { $_ -replace 'POLAR_API_KEY=', '' }).ToString().Trim()
    }
}

if (-not $ApiKey) {
    Write-Host "❌ POLAR_API_KEY not found!" -ForegroundColor Red
    exit 1
}

Write-Host "API Key: $($ApiKey.Substring(0, 20))..." -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type" = "application/json"
}

try {
    Write-Host "Fetching products...`n" -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/v1/products" -Method GET -Headers $headers
    
    if ($response.items.Count -eq 0) {
        Write-Host "⚠️  No products found!" -ForegroundColor Yellow
        Write-Host "`nYou need to create products in your Polar dashboard:" -ForegroundColor Yellow
        Write-Host "1. Go to https://polar.sh" -ForegroundColor Cyan
        Write-Host "2. Navigate to Products" -ForegroundColor Cyan
        Write-Host "3. Create your Pro and Business products`n" -ForegroundColor Cyan
        exit 0
    }
    
    Write-Host "✅ Found $($response.items.Count) product(s):`n" -ForegroundColor Green
    
    foreach ($product in $response.items) {
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "Product: $($product.name)" -ForegroundColor Yellow
        Write-Host "Product ID: $($product.id)" -ForegroundColor White
        
        if ($product.prices -and $product.prices.Count -gt 0) {
            Write-Host "`nPrices:" -ForegroundColor Green
            foreach ($price in $product.prices) {
                $amount = $price.price_amount / 100
                Write-Host "  ✅ Price ID: $($price.id)" -ForegroundColor Cyan
                Write-Host "     Amount: `$$amount $($price.price_currency)" -ForegroundColor White
                Write-Host "     Type: $($price.type)" -ForegroundColor White
                if ($price.recurring_interval) {
                    Write-Host "     Interval: $($price.recurring_interval)" -ForegroundColor White
                }
                Write-Host ""
            }
        } else {
            Write-Host "  ⚠️  No prices found for this product!" -ForegroundColor Yellow
            Write-Host "     You need to add a price in the Polar dashboard`n" -ForegroundColor Yellow
        }
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Copy the Price IDs (not Product IDs) from above" -ForegroundColor White
    Write-Host "2. Update your code in:" -ForegroundColor White
    Write-Host "   app/api/subscription/upgrade/route.ts" -ForegroundColor Cyan
    Write-Host "3. Replace the productMapping IDs with the Price IDs" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "Error fetching products:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "Tip: Check your API key is correct" -ForegroundColor Yellow
    }
}

