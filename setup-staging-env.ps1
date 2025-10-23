# =====================================================
# Setup Staging Environment Variables
# =====================================================
# This script helps you create .env.staging file
# Run this in PowerShell from the project root
# =====================================================

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   ASSET TRACER - STAGING ENVIRONMENT SETUP" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "asset-tracer")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "   Expected: C:\Users\...\AssetTracer" -ForegroundColor Yellow
    exit 1
}

# Check if .env.staging already exists
$envStagingPath = "asset-tracer\.env.staging"
if (Test-Path $envStagingPath) {
    Write-Host "⚠️  Warning: .env.staging already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (yes/no)"
    if ($overwrite -ne "yes") {
        Write-Host "`n✅ Cancelled. Existing file preserved." -ForegroundColor Green
        exit 0
    }
}

Write-Host "📋 Creating .env.staging file...`n" -ForegroundColor Green

# Generate CRON_SECRET
Write-Host "🔐 Generating CRON_SECRET..." -ForegroundColor Cyan
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$cronSecret = [System.Convert]::ToBase64String($bytes)
Write-Host "   Generated: $cronSecret`n" -ForegroundColor Gray

# Prompt for values
Write-Host "Please provide the following values:" -ForegroundColor Yellow
Write-Host "(Press Enter to use default value if shown)`n" -ForegroundColor Gray

# Supabase
$supabaseUrl = Read-Host "Supabase URL [https://ougntjrrskfsuognjmcw.supabase.co]"
if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    $supabaseUrl = "https://ougntjrrskfsuognjmcw.supabase.co"
}

Write-Host "`n📝 Supabase Anon Key:" -ForegroundColor Cyan
Write-Host "   Get from: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/settings/api" -ForegroundColor Gray
$supabaseAnonKey = Read-Host "Supabase Anon Key"

Write-Host "`n🔑 Supabase Service Role Key:" -ForegroundColor Cyan
Write-Host "   Get from: Supabase Dashboard → Settings → API → service_role" -ForegroundColor Gray
$supabaseServiceKey = Read-Host "Supabase Service Role Key"

# Resend
Write-Host "`n📧 Resend API Key:" -ForegroundColor Cyan
Write-Host "   Get from: https://resend.com/api-keys" -ForegroundColor Gray
$resendKey = Read-Host "Resend API Key (or press Enter to add later)"

# Polar
Write-Host "`n💳 Polar API Key (SANDBOX):" -ForegroundColor Cyan
Write-Host "   Get from: https://sandbox.polar.sh/settings" -ForegroundColor Gray
Write-Host "   ⚠️  Use SANDBOX for staging!" -ForegroundColor Yellow
$polarKey = Read-Host "Polar API Key (or press Enter to add later)"

Write-Host "`n💰 Polar Price IDs:" -ForegroundColor Cyan
Write-Host "   Get from: https://sandbox.polar.sh/dashboard/products" -ForegroundColor Gray
$polarProPrice = Read-Host "Polar Pro Price ID (or press Enter to add later)"
$polarBusinessPrice = Read-Host "Polar Business Price ID (or press Enter to add later)"

# App URL
Write-Host "`n🌐 Staging App URL:" -ForegroundColor Cyan
$appUrl = Read-Host "App URL [http://localhost:3000]"
if ([string]::IsNullOrWhiteSpace($appUrl)) {
    $appUrl = "http://localhost:3000"
}

# Create .env.staging content
$envContent = @"
# =====================================================
# STAGING ENVIRONMENT VARIABLES
# =====================================================
# Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# DO NOT commit this file to git
# =====================================================

# =====================================================
# SUPABASE CONFIGURATION (Staging Project)
# =====================================================
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey
SUPABASE_SERVICE_ROLE_KEY=$supabaseServiceKey

# =====================================================
# RESEND EMAIL SERVICE
# =====================================================
RESEND_API_KEY=$resendKey

# =====================================================
# POLAR SUBSCRIPTION SERVICE (Sandbox)
# =====================================================
POLAR_API_KEY=$polarKey
POLAR_PRO_PRICE_ID=$polarProPrice
POLAR_BUSINESS_PRICE_ID=$polarBusinessPrice

# =====================================================
# CRON JOB AUTHENTICATION
# =====================================================
CRON_SECRET=$cronSecret

# =====================================================
# APPLICATION CONFIGURATION
# =====================================================
NEXT_PUBLIC_APP_URL=$appUrl
NODE_ENV=staging

# =====================================================
# OPTIONAL: ANALYTICS & MONITORING
# =====================================================
# NEXT_PUBLIC_GA_ID=
# SENTRY_DSN=
# SENTRY_ENVIRONMENT=staging
"@

# Write to file
try {
    $envContent | Out-File -FilePath $envStagingPath -Encoding UTF8 -Force
    Write-Host "`n✅ SUCCESS: .env.staging file created!" -ForegroundColor Green
    Write-Host "   Location: $envStagingPath`n" -ForegroundColor Gray
    
    # Show summary
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   CONFIGURATION SUMMARY" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Supabase URL:        $supabaseUrl" -ForegroundColor Gray
    Write-Host "Supabase Anon Key:   $(if ($supabaseAnonKey) { '✅ Set' } else { '⚠️  Missing' })" -ForegroundColor Gray
    Write-Host "Service Role Key:    $(if ($supabaseServiceKey) { '✅ Set' } else { '⚠️  Missing' })" -ForegroundColor Gray
    Write-Host "Resend API Key:      $(if ($resendKey) { '✅ Set' } else { '⚠️  Missing' })" -ForegroundColor Gray
    Write-Host "Polar API Key:       $(if ($polarKey) { '✅ Set' } else { '⚠️  Missing' })" -ForegroundColor Gray
    Write-Host "Polar Pro Price:     $(if ($polarProPrice) { '✅ Set' } else { '⚠️  Missing' })" -ForegroundColor Gray
    Write-Host "Polar Business:      $(if ($polarBusinessPrice) { '✅ Set' } else { '⚠️  Missing' })" -ForegroundColor Gray
    Write-Host "CRON Secret:         ✅ Generated" -ForegroundColor Gray
    Write-Host "App URL:             $appUrl" -ForegroundColor Gray
    Write-Host "================================================`n" -ForegroundColor Cyan
    
    # Show next steps
    Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Review the .env.staging file and fill in any missing values" -ForegroundColor White
    Write-Host "2. For Vercel deployment, copy these to:" -ForegroundColor White
    Write-Host "   Vercel Dashboard → Settings → Environment Variables" -ForegroundColor Gray
    Write-Host "3. Set environment to 'Staging' for these variables" -ForegroundColor White
    Write-Host "4. Test locally first: cd asset-tracer && npm run dev" -ForegroundColor White
    Write-Host "5. Deploy to staging: git push (or Vercel CLI)`n" -ForegroundColor White
    
    Write-Host "⚠️  IMPORTANT REMINDERS:" -ForegroundColor Red
    Write-Host "   - Use Polar SANDBOX for staging (not production)" -ForegroundColor Yellow
    Write-Host "   - Never commit .env.staging to git" -ForegroundColor Yellow
    Write-Host "   - Keep your service role key secret" -ForegroundColor Yellow
    Write-Host "   - Test everything in staging before production`n" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n❌ ERROR: Failed to create .env.staging file" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Cyan
"@

