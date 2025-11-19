# =====================================================
# Get Yearly Price IDs from Polar Product IDs
# =====================================================
# This fetches the yearly Price IDs from Polar API
# =====================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$PolarApiKey,
    
    [Parameter(Mandatory=$true)]
    [string]$ProProductId,
    
    [Parameter(Mandatory=$true)]
    [string]$BusinessProductId
)

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   POLAR YEARLY PRICE ID RETRIEVAL" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $PolarApiKey"
    "Content-Type" = "application/json"
}

# Try Sandbox first (for staging), then Production
$sandboxUrl = "https://sandbox-api.polar.sh"
$productionUrl = "https://api.polar.sh"

Write-Host "[INFO] Trying Sandbox API first (for staging)..." -ForegroundColor Yellow
Write-Host ""

# Function to get yearly price from product
function Get-YearlyPriceId {
    param(
        [string]$ProductId,
        [string]$ProductName,
        [string]$BaseUrl
    )
    
    Write-Host "[FETCHING] $ProductName Product: $ProductId..." -ForegroundColor Cyan
    Write-Host "  Using API: $BaseUrl" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/v1/products/$ProductId" -Headers $headers -Method Get
        
        Write-Host "  Product Name: $($response.name)" -ForegroundColor Gray
        Write-Host "  Product ID:   $ProductId" -ForegroundColor Gray
        Write-Host ""
        
        if ($response.prices -and $response.prices.Count -gt 0) {
            Write-Host "  Available Prices:" -ForegroundColor Green
            $yearlyPrice = $null
            
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
                
                # Find yearly price (not archived)
                if (-not $price.archived -and ($interval -eq "year" -or $interval -eq "yearly")) {
                    $yearlyPrice = $price
                }
            }
            
            if ($yearlyPrice) {
                $amount = $yearlyPrice.price_amount / 100
                Write-Host "================================================" -ForegroundColor Cyan
                Write-Host "   YEARLY PRICE ID FOUND" -ForegroundColor Green
                Write-Host "================================================" -ForegroundColor Cyan
                Write-Host "Price ID: $($yearlyPrice.id)" -ForegroundColor Green
                Write-Host "Amount:   $amount $($yearlyPrice.price_currency)/year" -ForegroundColor Gray
                Write-Host ""
                return $yearlyPrice.id
            } else {
                Write-Host "[WARNING] No active yearly price found!" -ForegroundColor Yellow
                return $null
            }
        } else {
            Write-Host "[ERROR] No prices found for this product" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "[ERROR] Failed to fetch product: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "[INFO] Check your API key." -ForegroundColor Yellow
        }
        return $null
    }
}

# Try Sandbox first, then Production
$proYearlyPriceId = $null
$businessYearlyPriceId = $null

# Try Sandbox
Write-Host "`n--- PRO YEARLY (Sandbox) ---" -ForegroundColor Cyan
$proYearlyPriceId = Get-YearlyPriceId -ProductId $ProProductId -ProductName "Pro Yearly" -BaseUrl $sandboxUrl

if (-not $proYearlyPriceId) {
    Write-Host "`n--- PRO YEARLY (Production) ---" -ForegroundColor Cyan
    $proYearlyPriceId = Get-YearlyPriceId -ProductId $ProProductId -ProductName "Pro Yearly" -BaseUrl $productionUrl
}

# Try Sandbox
Write-Host "`n--- BUSINESS YEARLY (Sandbox) ---" -ForegroundColor Cyan
$businessYearlyPriceId = Get-YearlyPriceId -ProductId $BusinessProductId -ProductName "Business Yearly" -BaseUrl $sandboxUrl

if (-not $businessYearlyPriceId) {
    Write-Host "`n--- BUSINESS YEARLY (Production) ---" -ForegroundColor Cyan
    $businessYearlyPriceId = Get-YearlyPriceId -ProductId $BusinessProductId -ProductName "Business Yearly" -BaseUrl $productionUrl
}

# Summary
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   SUMMARY" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "Add these to your .env.staging file:" -ForegroundColor Yellow
Write-Host ""

if ($proYearlyPriceId) {
    Write-Host "POLAR_PRO_YEARLY_PRICE_ID=$proYearlyPriceId" -ForegroundColor Green
} else {
    Write-Host "POLAR_PRO_YEARLY_PRICE_ID=[NOT FOUND]" -ForegroundColor Red
}

if ($businessYearlyPriceId) {
    Write-Host "POLAR_BUSINESS_YEARLY_PRICE_ID=$businessYearlyPriceId" -ForegroundColor Green
} else {
    Write-Host "POLAR_BUSINESS_YEARLY_PRICE_ID=[NOT FOUND]" -ForegroundColor Red
}

Write-Host "`n[DONE]`n" -ForegroundColor Green
