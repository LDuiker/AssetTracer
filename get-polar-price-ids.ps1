# =====================================================
# Get Polar Price IDs from Product IDs
# =====================================================
# Polar Dashboard only shows Product IDs, not Price IDs
# This script fetches the Price IDs via API
# =====================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$PolarApiKey,
    
    [string]$ProductIdPro = "4bd7788b-d3dd-4f17-837a-3a5a56341b05",
    [string]$ProductIdBusiness = "bbb245ef-6915-4c75-b59f-f14d61abb414"
)

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   POLAR PRICE ID RETRIEVAL" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $PolarApiKey"
    "Content-Type" = "application/json"
}

# Determine if sandbox or production based on API key
$baseUrl = if ($PolarApiKey -like "polar_oat_*") {
    "https://sandbox-api.polar.sh"
} else {
    "https://api.polar.sh"
}

Write-Host "[INFO] Using API: $baseUrl`n" -ForegroundColor Gray

# Function to get product details including prices
function Get-PolarProductPrices {
    param([string]$ProductId, [string]$ProductName)
    
    Write-Host "[FETCHING] $ProductName..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/v1/products/$ProductId" -Headers $headers -Method Get
        
        if ($response.prices -and $response.prices.Count -gt 0) {
            Write-Host "  Product Name: $($response.name)" -ForegroundColor Gray
            Write-Host "  Product ID:   $ProductId" -ForegroundColor Gray
            
            foreach ($price in $response.prices) {
                Write-Host "  Price ID:     $($price.id)" -ForegroundColor Green
                Write-Host "  Amount:       $($price.price_amount / 100) $($price.price_currency)" -ForegroundColor Gray
                Write-Host "  Type:         $($price.type)" -ForegroundColor Gray
                Write-Host "  Recurring:    $($price.recurring_interval)" -ForegroundColor Gray
                Write-Host "" -ForegroundColor Gray
                
                return $price.id
            }
        } else {
            Write-Host "  [WARNING] No prices found for this product" -ForegroundColor Yellow
            return $null
        }
    } catch {
        Write-Host "  [ERROR] Failed to fetch product: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Get Price IDs
Write-Host "Fetching Price IDs from Polar API...`n" -ForegroundColor Yellow

$proPriceId = Get-PolarProductPrices -ProductId $ProductIdPro -ProductName "Pro Monthly"
$businessPriceId = Get-PolarProductPrices -ProductId $ProductIdBusiness -ProductName "Business Monthly"

# Summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   SUMMARY" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

if ($proPriceId) {
    Write-Host "[OK] Pro Price ID:      $proPriceId" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Pro Price ID:    Not found" -ForegroundColor Red
}

if ($businessPriceId) {
    Write-Host "[OK] Business Price ID: $businessPriceId" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Business Price ID: Not found" -ForegroundColor Red
}

Write-Host "================================================`n" -ForegroundColor Cyan

# Ask to update .env.staging
if ($proPriceId -and $businessPriceId) {
    $update = Read-Host "Update .env.staging with these Price IDs? (yes/no)"
    
    if ($update -eq "yes") {
        $envPath = "asset-tracer\.env.staging"
        
        if (Test-Path $envPath) {
            $content = Get-Content $envPath -Raw
            
            # Replace the placeholder values
            $content = $content -replace "POLAR_PRO_PRICE_ID=.*", "POLAR_PRO_PRICE_ID=$proPriceId"
            $content = $content -replace "POLAR_BUSINESS_PRICE_ID=.*", "POLAR_BUSINESS_PRICE_ID=$businessPriceId"
            
            # Also update the API key if needed
            $content = $content -replace "POLAR_API_KEY=YOUR_STAGING_POLAR_SANDBOX_KEY_HERE", "POLAR_API_KEY=$PolarApiKey"
            
            $content | Out-File -FilePath $envPath -Encoding UTF8 -Force
            
            Write-Host "`n[SUCCESS] .env.staging updated!" -ForegroundColor Green
            Write-Host "   File: $envPath" -ForegroundColor Gray
        } else {
            Write-Host "`n[ERROR] .env.staging not found at: $envPath" -ForegroundColor Red
        }
    }
} else {
    Write-Host "`n[ERROR] Could not retrieve all Price IDs" -ForegroundColor Red
}

Write-Host "`n[DONE] Script complete`n" -ForegroundColor Green
