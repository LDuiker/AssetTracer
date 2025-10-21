# Get Price IDs from Your Products
# This fetches the Price IDs for your existing products

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "    GETTING YOUR PRICE IDs" -ForegroundColor White  
Write-Host "========================================`n" -ForegroundColor Cyan

# Get API key from .env.local
$apiKey = (Get-Content ".env.local" | Select-String "POLAR_API_KEY" | ForEach-Object { $_ -replace 'POLAR_API_KEY=', '' }).ToString().Trim()

if (-not $apiKey) {
    Write-Host "Error: Could not find POLAR_API_KEY" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

# Your Product IDs
$businessProductId = "bbb245ef-6915-4c75-b59f-f14d61abb414"
$proProductId = "4bd7788b-d3dd-4f17-837a-3a5a56341b05"

Write-Host "Fetching Business Plan ($39/month)..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "https://sandbox-api.polar.sh/v1/products/$businessProductId" -Headers $headers
    
    if ($response.prices -and $response.prices.Count -gt 0) {
        Write-Host "SUCCESS! Found prices:" -ForegroundColor Green
        foreach ($price in $response.prices) {
            $amount = $price.price_amount / 100
            Write-Host "`n  Price ID: " -NoNewline -ForegroundColor Cyan
            Write-Host "$($price.id)" -ForegroundColor White
            Write-Host "  Amount: `$$amount $($price.price_currency)" -ForegroundColor White
            if ($price.recurring_interval) {
                Write-Host "  Interval: $($price.recurring_interval)" -ForegroundColor White
            }
        }
        $businessPriceId = $response.prices[0].id
    } else {
        Write-Host "WARNING: No prices found for Business Plan!" -ForegroundColor Yellow
        Write-Host "You need to add a price in Polar dashboard" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error fetching Business Plan: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
Write-Host "Fetching Pro Plan ($19/month)..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "https://sandbox-api.polar.sh/v1/products/$proProductId" -Headers $headers
    
    if ($response.prices -and $response.prices.Count -gt 0) {
        Write-Host "SUCCESS! Found prices:" -ForegroundColor Green
        foreach ($price in $response.prices) {
            $amount = $price.price_amount / 100
            Write-Host "`n  Price ID: " -NoNewline -ForegroundColor Cyan
            Write-Host "$($price.id)" -ForegroundColor White
            Write-Host "  Amount: `$$amount $($price.price_currency)" -ForegroundColor White
            if ($price.recurring_interval) {
                Write-Host "  Interval: $($price.recurring_interval)" -ForegroundColor White
            }
        }
        $proPriceId = $response.prices[0].id
    } else {
        Write-Host "WARNING: No prices found for Pro Plan!" -ForegroundColor Yellow
        Write-Host "You need to add a price in Polar dashboard" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error fetching Pro Plan: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "    SUMMARY" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

if ($businessPriceId -and $proPriceId) {
    Write-Host "Copy these Price IDs to your code:" -ForegroundColor Green
    Write-Host ""
    Write-Host "const productMapping: Record<string, string> = {" -ForegroundColor White
    Write-Host "  pro: '$proPriceId'," -ForegroundColor Cyan
    Write-Host "  business: '$businessPriceId'," -ForegroundColor Cyan
    Write-Host "};" -ForegroundColor White
    Write-Host ""
    Write-Host "Update this in: app/api/subscription/upgrade/route.ts (line 71-74)" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "Could not fetch all Price IDs." -ForegroundColor Red
    Write-Host "Please check your products in Polar dashboard" -ForegroundColor Yellow
    Write-Host "Make sure each product has a price configured" -ForegroundColor Yellow
}

