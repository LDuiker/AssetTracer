# Update .env.staging with Yearly Price IDs
# Usage: .\update-env-staging-yearly.ps1

$envPath = "asset-tracer\.env.staging"

if (-not (Test-Path $envPath)) {
    Write-Host "[ERROR] .env.staging not found at: $envPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   UPDATING .env.staging WITH YEARLY PRICE IDs" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Yearly Price IDs from Polar Sandbox
$proYearlyPriceId = "f2a5d4a0-a680-48cc-a306-2e7c121245f6"
$businessYearlyPriceId = "ff388665-0141-4ebb-ba45-326a10e03681"

Write-Host "Pro Yearly Price ID:     $proYearlyPriceId" -ForegroundColor Green
Write-Host "Business Yearly Price ID: $businessYearlyPriceId" -ForegroundColor Green
Write-Host ""

# Read the file
$content = Get-Content $envPath -Raw

# Update or add POLAR_PRO_YEARLY_PRICE_ID
if ($content -match "POLAR_PRO_YEARLY_PRICE_ID=") {
    $content = $content -replace "POLAR_PRO_YEARLY_PRICE_ID=.*", "POLAR_PRO_YEARLY_PRICE_ID=$proYearlyPriceId"
    Write-Host "[UPDATED] POLAR_PRO_YEARLY_PRICE_ID" -ForegroundColor Yellow
} else {
    # Add it at the end of Polar section
    $content = $content + "`nPOLAR_PRO_YEARLY_PRICE_ID=$proYearlyPriceId"
    Write-Host "[ADDED] POLAR_PRO_YEARLY_PRICE_ID" -ForegroundColor Green
}

# Update or add POLAR_BUSINESS_YEARLY_PRICE_ID
if ($content -match "POLAR_BUSINESS_YEARLY_PRICE_ID=") {
    $content = $content -replace "POLAR_BUSINESS_YEARLY_PRICE_ID=.*", "POLAR_BUSINESS_YEARLY_PRICE_ID=$businessYearlyPriceId"
    Write-Host "[UPDATED] POLAR_BUSINESS_YEARLY_PRICE_ID" -ForegroundColor Yellow
} else {
    # Add it after POLAR_PRO_YEARLY_PRICE_ID
    $content = $content -replace "(POLAR_PRO_YEARLY_PRICE_ID=.*)", "`$1`nPOLAR_BUSINESS_YEARLY_PRICE_ID=$businessYearlyPriceId"
    Write-Host "[ADDED] POLAR_BUSINESS_YEARLY_PRICE_ID" -ForegroundColor Green
}

# Write back to file
$content | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline

Write-Host "`n[SUCCESS] .env.staging updated!" -ForegroundColor Green
Write-Host "   File: $envPath" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Don't forget to also add these to Vercel Staging Environment Variables:" -ForegroundColor Yellow
Write-Host "   - POLAR_PRO_YEARLY_PRICE_ID = $proYearlyPriceId" -ForegroundColor White
Write-Host "   - POLAR_BUSINESS_YEARLY_PRICE_ID = $businessYearlyPriceId" -ForegroundColor White
Write-Host ""

