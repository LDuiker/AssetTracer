# Test Polar API Endpoints
# This script helps discover the correct Polar checkout endpoint

param(
    [string]$ApiKey = $env:POLAR_API_KEY,
    [string]$BaseUrl = "https://sandbox-api.polar.sh"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "    POLAR API ENDPOINT TESTER" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

if (-not $ApiKey) {
    Write-Host "❌ POLAR_API_KEY not found!" -ForegroundColor Red
    Write-Host "Set it with: `$env:POLAR_API_KEY='your_key'" -ForegroundColor Yellow
    exit 1
}

Write-Host "API Key: $($ApiKey.Substring(0, 20))..." -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type" = "application/json"
}

# Test different checkout endpoints
$endpoints = @(
    "/v1/checkouts",
    "/v1/checkout",
    "/v1/checkouts/custom",
    "/v1/checkout/custom",
    "/v1/checkout_links",
    "/v1/checkout-links",
    "/v1/products",
    "/v1/subscriptions",
    "/v1/customers"
)

Write-Host "Testing endpoints with GET requests...`n" -ForegroundColor Yellow

foreach ($endpoint in $endpoints) {
    $url = "$BaseUrl$endpoint"
    Write-Host "Testing: $endpoint" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -ErrorAction SilentlyContinue
        Write-Host "  ✅ Status: $($response.StatusCode) - Endpoint exists!" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Write-Host "  ❌ Status: 404 - Not Found" -ForegroundColor Red
        } elseif ($statusCode -eq 405) {
            Write-Host "  ⚠️  Status: 405 - Method Not Allowed (but endpoint exists!)" -ForegroundColor Yellow
        } elseif ($statusCode -eq 401) {
            Write-Host "  ⚠️  Status: 401 - Unauthorized (check API key)" -ForegroundColor Yellow
        } else {
            Write-Host "  ⚠️  Status: $statusCode - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Tip: Endpoints returning 405 exist but don't support GET" -ForegroundColor Cyan
Write-Host "Tip: Try POST requests on 405 endpoints`n" -ForegroundColor Cyan

