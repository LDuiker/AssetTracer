# Update .env.production with Yearly Price IDs
# Usage: .\update-env-production-yearly.ps1

$envPath = "asset-tracer\.env.production"

if (-not (Test-Path $envPath)) {
    Write-Host "[ERROR] .env.production not found at: $envPath" -ForegroundColor Red
    Write-Host "[INFO] Creating .env.production file..." -ForegroundColor Yellow
    # Create empty file
    New-Item -Path $envPath -ItemType File -Force | Out-Null
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   UPDATING .env.production WITH YEARLY PRICE IDs" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Yearly Price IDs from Polar Production
$proYearlyPriceId = "c170c022-d00b-49b1-831e-32d9ffd7ef8d"
$businessYearlyPriceId = "448dd67a-ebb6-47cd-b116-eb826baa6988"

Write-Host "Pro Yearly Price ID:     $proYearlyPriceId" -ForegroundColor Green
Write-Host "Business Yearly Price ID: $businessYearlyPriceId" -ForegroundColor Green
Write-Host ""

# Read the file
$content = Get-Content $envPath -Raw -ErrorAction SilentlyContinue
if (-not $content) {
    $content = ""
}

# Update or add POLAR_PRO_YEARLY_PRICE_ID
if ($content -match "POLAR_PRO_YEARLY_PRICE_ID=") {
    $content = $content -replace "POLAR_PRO_YEARLY_PRICE_ID=.*", "POLAR_PRO_YEARLY_PRICE_ID=$proYearlyPriceId"
    Write-Host "[UPDATED] POLAR_PRO_YEARLY_PRICE_ID" -ForegroundColor Yellow
} else {
    # Add it at the end
    if ($content -and -not $content.EndsWith("`n") -and -not $content.EndsWith("`r`n")) {
        $content += "`n"
    }
    $content += "POLAR_PRO_YEARLY_PRICE_ID=$proYearlyPriceId`n"
    Write-Host "[ADDED] POLAR_PRO_YEARLY_PRICE_ID" -ForegroundColor Green
}

# Update or add POLAR_BUSINESS_YEARLY_PRICE_ID
if ($content -match "POLAR_BUSINESS_YEARLY_PRICE_ID=") {
    $content = $content -replace "POLAR_BUSINESS_YEARLY_PRICE_ID=.*", "POLAR_BUSINESS_YEARLY_PRICE_ID=$businessYearlyPriceId"
    Write-Host "[UPDATED] POLAR_BUSINESS_YEARLY_PRICE_ID" -ForegroundColor Yellow
} else {
    # Add it after POLAR_PRO_YEARLY_PRICE_ID
    if ($content -match "POLAR_PRO_YEARLY_PRICE_ID=") {
        $content = $content -replace "(POLAR_PRO_YEARLY_PRICE_ID=.*)", "`$1`nPOLAR_BUSINESS_YEARLY_PRICE_ID=$businessYearlyPriceId"
    } else {
        if ($content -and -not $content.EndsWith("`n") -and -not $content.EndsWith("`r`n")) {
            $content += "`n"
        }
        $content += "POLAR_BUSINESS_YEARLY_PRICE_ID=$businessYearlyPriceId`n"
    }
    Write-Host "[ADDED] POLAR_BUSINESS_YEARLY_PRICE_ID" -ForegroundColor Green
}

# Write back to file
$content | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline

Write-Host "`n[SUCCESS] .env.production updated!" -ForegroundColor Green
Write-Host "   File: $envPath" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Don't forget to also add these to Vercel Production Environment Variables:" -ForegroundColor Yellow
Write-Host "   - POLAR_PRO_YEARLY_PRICE_ID = $proYearlyPriceId" -ForegroundColor White
Write-Host "   - POLAR_BUSINESS_YEARLY_PRICE_ID = $businessYearlyPriceId" -ForegroundColor White
Write-Host ""

