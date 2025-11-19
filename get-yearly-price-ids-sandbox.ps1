# =====================================================
# Get Yearly Price IDs from Polar Sandbox Product IDs
# =====================================================
# Usage: .\get-yearly-price-ids-sandbox.ps1 -PolarApiKey "your_sandbox_api_key" -ProProductId "product_id" -BusinessProductId "product_id"
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
Write-Host "   POLAR SANDBOX YEARLY PRICE ID RETRIEVAL" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $PolarApiKey"
    "Content-Type" = "application/json"
}

# Use SANDBOX API for staging
# Check if API key indicates sandbox (polar_oat_ prefix) or use sandbox URL
$baseUrl = if ($PolarApiKey -like "polar_oat_*") {
    "https://sandbox-api.polar.sh"
} else {
    "https://sandbox-api.polar.sh"  # Default to sandbox for staging
}

Write-Host "[INFO] Using SANDBOX API: $baseUrl`n" -ForegroundColor Yellow
Write-Host "[INFO] API Key prefix: $($PolarApiKey.Substring(0, [Math]::Min(20, $PolarApiKey.Length)))..." -ForegroundColor Gray
Write-Host ""

# Function to get yearly price from product
function Get-YearlyPriceId {
    param(
        [string]$ProductId,
        [string]$ProductName
    )
    
    Write-Host "[FETCHING] $ProductName Product: $ProductId..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/v1/products/$ProductId" -Headers $headers -Method Get
        
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
                
                # Find yearly price (not archived, interval = year)
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
                Write-Host "Make sure the product has a price with interval='year' or 'yearly'" -ForegroundColor Yellow
                return $null
            }
        } else {
            Write-Host "[ERROR] No prices found for this product" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "[ERROR] Failed to fetch product: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "[INFO] Check your Sandbox API key. Get it from: https://sandbox.polar.sh/settings" -ForegroundColor Yellow
        } elseif ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "[INFO] Product not found. Check if the Product ID is correct." -ForegroundColor Yellow
        }
        return $null
    }
}

# Get Pro Yearly Price ID
Write-Host "--- PRO YEARLY ---" -ForegroundColor Cyan
$proYearlyPriceId = Get-YearlyPriceId -ProductId $ProProductId -ProductName "Pro Yearly"

# Get Business Yearly Price ID
Write-Host "`n--- BUSINESS YEARLY ---" -ForegroundColor Cyan
$businessYearlyPriceId = Get-YearlyPriceId -ProductId $BusinessProductId -ProductName "Business Yearly"

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

Write-Host ""
Write-Host "Also add these to Vercel Staging Environment Variables!" -ForegroundColor Yellow
Write-Host "`n[DONE]`n" -ForegroundColor Green

