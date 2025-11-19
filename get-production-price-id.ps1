# =====================================================
# Get Production Price ID from Product ID
# =====================================================
# This fetches the active Price ID from Polar PRODUCTION API
# =====================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$PolarApiKey,
    
    [Parameter(Mandatory=$true)]
    [string]$ProductId
)

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   POLAR PRODUCTION PRICE ID RETRIEVAL" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $PolarApiKey"
    "Content-Type" = "application/json"
}

# Use PRODUCTION API
$baseUrl = "https://api.polar.sh"

Write-Host "[INFO] Using PRODUCTION API: $baseUrl`n" -ForegroundColor Yellow

try {
    Write-Host "[FETCHING] Product: $ProductId..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/v1/products/$ProductId" -Headers $headers -Method Get
    
    Write-Host "  Product Name: $($response.name)" -ForegroundColor Gray
    Write-Host "  Product ID:   $ProductId" -ForegroundColor Gray
    Write-Host ""
    
    if ($response.prices -and $response.prices.Count -gt 0) {
        Write-Host "  Active Prices:" -ForegroundColor Green
        foreach ($price in $response.prices) {
            $amount = $price.price_amount / 100
            $currency = $price.price_currency
            $interval = $price.recurring_interval
            $isArchived = if ($price.archived) { "ARCHIVED" } else { "ACTIVE" }
            
            Write-Host "    Price ID:     $($price.id)" -ForegroundColor $(if ($price.archived) { "Red" } else { "Green" })
            Write-Host "    Amount:       $amount $currency" -ForegroundColor Gray
            Write-Host "    Interval:     $interval" -ForegroundColor Gray
            Write-Host "    Status:       $isArchived" -ForegroundColor $(if ($price.archived) { "Red" } else { "Green" })
            Write-Host ""
            
            # Return the first ACTIVE price
            if (-not $price.archived) {
                Write-Host "================================================" -ForegroundColor Cyan
                Write-Host "   ACTIVE PRICE ID FOUND" -ForegroundColor Green
                Write-Host "================================================" -ForegroundColor Cyan
                Write-Host "Price ID: $($price.id)" -ForegroundColor Green
                Write-Host "Amount:   $amount $currency/$interval" -ForegroundColor Gray
                Write-Host ""
                Write-Host "Update this in Vercel Production Environment Variables:" -ForegroundColor Yellow
                Write-Host "  NEXT_PUBLIC_POLAR_PRO_PRICE_ID = $($price.id)" -ForegroundColor White
                Write-Host ""
                return $price.id
            }
        }
        
        Write-Host "[WARNING] No active (non-archived) prices found!" -ForegroundColor Yellow
        Write-Host "All prices are archived. You may need to create a new price." -ForegroundColor Yellow
    } else {
        Write-Host "[ERROR] No prices found for this product" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Failed to fetch product: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[INFO] This might be a sandbox API key. Use your PRODUCTION API key." -ForegroundColor Yellow
    }
}

Write-Host "`n[DONE]`n" -ForegroundColor Green

