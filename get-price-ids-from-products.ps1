# =====================================================
# Get Price IDs from Product IDs
# =====================================================

Write-Host ""
Write-Host "Fetching Price IDs from your products..." -ForegroundColor Cyan
Write-Host ""

# Product IDs
$businessProductId = "6e9beea5-1818-4246-84aa-bb2807e96255"
$proProductId = "d0ef8f7a-657b-4115-8fb2-7bdfd4af3b18"

# Prompt for LIVE API key
Write-Host "Enter your LIVE Polar API key (starts with polar_sk_live_):" -ForegroundColor Yellow
$apiKey = Read-Host

Write-Host ""
Write-Host "Fetching prices..." -ForegroundColor Cyan
Write-Host ""

# Headers
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Accept" = "application/json"
}

try {
    # Fetch Pro product prices
    Write-Host "Fetching Pro Plan prices..." -ForegroundColor Yellow
    $proUrl = "https://api.polar.sh/v1/products/$proProductId"
    $proProduct = Invoke-RestMethod -Uri $proUrl -Method Get -Headers $headers
    
    # Fetch Business product prices
    Write-Host "Fetching Business Plan prices..." -ForegroundColor Yellow
    $businessUrl = "https://api.polar.sh/v1/products/$businessProductId"
    $businessProduct = Invoke-RestMethod -Uri $businessUrl -Method Get -Headers $headers
    
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host "PRICE IDs FOUND:" -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host ""
    
    # Display Pro prices
    Write-Host "PRO PLAN:" -ForegroundColor Yellow
    if ($proProduct.prices -and $proProduct.prices.Count -gt 0) {
        foreach ($price in $proProduct.prices) {
            $amount = $price.price_amount / 100
            $currency = $price.price_currency
            $interval = if ($price.recurring_interval) { $price.recurring_interval } else { "one-time" }
            
            Write-Host "  Price ID: $($price.id)" -ForegroundColor Cyan
            Write-Host "    Amount: $currency $amount / $interval" -ForegroundColor Gray
            Write-Host ""
        }
        
        # Get the first recurring price for Pro
        $proRecurringPrice = $proProduct.prices | Where-Object { $_.recurring_interval -ne $null } | Select-Object -First 1
        if ($proRecurringPrice) {
            $proPriceId = $proRecurringPrice.id
        }
    } else {
        Write-Host "  No prices found!" -ForegroundColor Red
        Write-Host ""
    }
    
    # Display Business prices
    Write-Host "BUSINESS PLAN:" -ForegroundColor Yellow
    if ($businessProduct.prices -and $businessProduct.prices.Count -gt 0) {
        foreach ($price in $businessProduct.prices) {
            $amount = $price.price_amount / 100
            $currency = $price.price_currency
            $interval = if ($price.recurring_interval) { $price.recurring_interval } else { "one-time" }
            
            Write-Host "  Price ID: $($price.id)" -ForegroundColor Cyan
            Write-Host "    Amount: $currency $amount / $interval" -ForegroundColor Gray
            Write-Host ""
        }
        
        # Get the first recurring price for Business
        $businessRecurringPrice = $businessProduct.prices | Where-Object { $_.recurring_interval -ne $null } | Select-Object -First 1
        if ($businessRecurringPrice) {
            $businessPriceId = $businessRecurringPrice.id
        }
    } else {
        Write-Host "  No prices found!" -ForegroundColor Red
        Write-Host ""
    }
    
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host "COPY THESE TO .env.production:" -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host ""
    
    if ($proPriceId) {
        Write-Host "NEXT_PUBLIC_POLAR_PRO_PRICE_ID=$proPriceId" -ForegroundColor Cyan
    } else {
        Write-Host "# Could not find Pro price ID - check above" -ForegroundColor Red
    }
    
    if ($businessPriceId) {
        Write-Host "NEXT_PUBLIC_POLAR_BUSINESS_PRICE_ID=$businessPriceId" -ForegroundColor Cyan
    } else {
        Write-Host "# Could not find Business price ID - check above" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host ""
    
    # Copy to clipboard if both found
    if ($proPriceId -and $businessPriceId) {
        $clipboardText = "NEXT_PUBLIC_POLAR_PRO_PRICE_ID=$proPriceId`nNEXT_PUBLIC_POLAR_BUSINESS_PRICE_ID=$businessPriceId"
        Set-Clipboard -Value $clipboardText
        Write-Host "Price IDs copied to clipboard!" -ForegroundColor Green
        Write-Host ""
    }
    
} catch {
    Write-Host ""
    Write-Host "Error fetching from Polar API:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -match "401") {
        Write-Host "Authentication failed. Make sure you're using your LIVE API key!" -ForegroundColor Yellow
    }
    Write-Host ""
}

