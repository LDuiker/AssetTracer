# =====================================================
# Auto-fetch Price IDs from Polar (No interaction needed)
# =====================================================

Write-Host ""
Write-Host "Auto-fetching Price IDs from Polar..." -ForegroundColor Cyan
Write-Host ""

# Read API key from .env.local
$envPath = "asset-tracer\.env.local"
if (Test-Path $envPath) {
    Write-Host "Reading API key from .env.local..." -ForegroundColor Gray
    $content = Get-Content $envPath -Raw
    if ($content -match 'POLAR_API_KEY=([^\r\n]+)') {
        $apiKey = $matches[1].Trim()
        Write-Host "API key found!" -ForegroundColor Green
    } else {
        Write-Host "No POLAR_API_KEY found in .env.local" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please add your LIVE API key to .env.local:" -ForegroundColor Yellow
        Write-Host "POLAR_API_KEY=polar_sk_live_xxxxxxxxxx" -ForegroundColor Cyan
        Write-Host ""
        exit
    }
} else {
    Write-Host ".env.local not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create asset-tracer\.env.local with:" -ForegroundColor Yellow
    Write-Host "POLAR_API_KEY=polar_sk_live_xxxxxxxxxx" -ForegroundColor Cyan
    Write-Host ""
    exit
}

# Product IDs
$businessProductId = "6e9beea5-1818-4246-84aa-bb2807e96255"
$proProductId = "d0ef8f7a-657b-4115-8fb2-7bdfd4af3b18"

# Headers
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Accept" = "application/json"
}

Write-Host ""

try {
    # Fetch Pro product
    Write-Host "Fetching Pro Plan..." -ForegroundColor Yellow
    $proUrl = "https://api.polar.sh/v1/products/$proProductId"
    $proProduct = Invoke-RestMethod -Uri $proUrl -Method Get -Headers $headers
    
    # Fetch Business product
    Write-Host "Fetching Business Plan..." -ForegroundColor Yellow
    $businessUrl = "https://api.polar.sh/v1/products/$businessProductId"
    $businessProduct = Invoke-RestMethod -Uri $businessUrl -Method Get -Headers $headers
    
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host "PRICE IDs FOUND!" -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host ""
    
    # Get Pro price
    $proPriceId = $null
    if ($proProduct.prices -and $proProduct.prices.Count -gt 0) {
        $proPriceId = $proProduct.prices[0].id
        $proAmount = $proProduct.prices[0].price_amount / 100
        Write-Host "Pro Plan:" -ForegroundColor Yellow
        Write-Host "  Price ID: $proPriceId" -ForegroundColor Cyan
        Write-Host "  Amount: `$$proAmount/month" -ForegroundColor Gray
        Write-Host ""
    }
    
    # Get Business price
    $businessPriceId = $null
    if ($businessProduct.prices -and $businessProduct.prices.Count -gt 0) {
        $businessPriceId = $businessProduct.prices[0].id
        $businessAmount = $businessProduct.prices[0].price_amount / 100
        Write-Host "Business Plan:" -ForegroundColor Yellow
        Write-Host "  Price ID: $businessPriceId" -ForegroundColor Cyan
        Write-Host "  Amount: `$$businessAmount/month" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host "ADD TO .env.production:" -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host ""
    
    if ($proPriceId) {
        Write-Host "NEXT_PUBLIC_POLAR_PRO_PRICE_ID=$proPriceId" -ForegroundColor Cyan
    }
    
    if ($businessPriceId) {
        Write-Host "NEXT_PUBLIC_POLAR_BUSINESS_PRICE_ID=$businessPriceId" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Gray
    Write-Host ""
    
    # Copy to clipboard
    if ($proPriceId -and $businessPriceId) {
        $clipboardText = "NEXT_PUBLIC_POLAR_PRO_PRICE_ID=$proPriceId`nNEXT_PUBLIC_POLAR_BUSINESS_PRICE_ID=$businessPriceId"
        Set-Clipboard -Value $clipboardText
        Write-Host "Copied to clipboard!" -ForegroundColor Green
        Write-Host ""
    }
    
} catch {
    Write-Host ""
    Write-Host "Error fetching from Polar API:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -match "401") {
        Write-Host "Make sure your POLAR_API_KEY in .env.local is a LIVE key!" -ForegroundColor Yellow
        Write-Host "(Should start with: polar_sk_live_)" -ForegroundColor Yellow
    }
    Write-Host ""
}

