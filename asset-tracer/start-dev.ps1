# AssetTracer Development Server Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AssetTracer Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check current directory
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Yellow
Write-Host ""

# Verify required files
Write-Host "Verifying setup..." -ForegroundColor Yellow
$packageExists = Test-Path "package.json"
$envExists = Test-Path ".env.local"
$nodeModulesExists = Test-Path "node_modules"

Write-Host "  [$(if($packageExists){'✓'}else{'✗'})] package.json" -ForegroundColor $(if($packageExists){'Green'}else{'Red'})
Write-Host "  [$(if($envExists){'✓'}else{'✗'})] .env.local" -ForegroundColor $(if($envExists){'Green'}else{'Red'})
Write-Host "  [$(if($nodeModulesExists){'✓'}else{'✗'})] node_modules" -ForegroundColor $(if($nodeModulesExists){'Green'}else{'Red'})
Write-Host ""

if (-not $packageExists) {
    Write-Host "ERROR: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the asset-tracer directory" -ForegroundColor Red
    Write-Host ""
    Write-Host "Correct directory should be:" -ForegroundColor Yellow
    Write-Host "  C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer" -ForegroundColor Yellow
    pause
    exit 1
}

if (-not $envExists) {
    Write-Host "WARNING: .env.local not found!" -ForegroundColor Yellow
    Write-Host "The app may not work without environment variables" -ForegroundColor Yellow
    Write-Host ""
}

if (-not $nodeModulesExists) {
    Write-Host "ERROR: node_modules not found!" -ForegroundColor Red
    Write-Host "Run 'npm install' first" -ForegroundColor Red
    pause
    exit 1
}

# Start the server
Write-Host "Starting development server on port 3001..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev

