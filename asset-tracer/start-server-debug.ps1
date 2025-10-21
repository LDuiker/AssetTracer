Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Starting Development Server   " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current Directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host "Node Version: $(node --version 2>&1)" -ForegroundColor Yellow
Write-Host "NPM Version: $(npm --version 2>&1)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Checking .env.local..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local exists" -ForegroundColor Green
} else {
    Write-Host "✗ .env.local NOT FOUND!" -ForegroundColor Red
}
Write-Host ""
Write-Host "Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✓ package.json exists" -ForegroundColor Green
} else {
    Write-Host "✗ package.json NOT FOUND!" -ForegroundColor Red
    exit 1
}
Write-Host ""
Write-Host "Starting npm run dev..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

npm run dev

