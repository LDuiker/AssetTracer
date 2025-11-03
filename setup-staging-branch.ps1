# =====================================================
# CREATE STAGING BRANCH FOR PROPER WORKFLOW
# =====================================================
# This creates a separate staging branch for your staging environment
# Run this in PowerShell from the project root
# =====================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🌿 Create Staging Branch" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Yellow
Write-Host ""

# Check if staging branch already exists
$stagingExists = git branch --list staging
if ($stagingExists) {
    Write-Host "✅ Staging branch already exists" -ForegroundColor Green
    Write-Host ""
    $recreate = Read-Host "Do you want to recreate it from main? (yes/no)"
    if ($recreate -eq "yes") {
        Write-Host "Deleting old staging branch..." -ForegroundColor Yellow
        git branch -D staging
        git push origin --delete staging
    } else {
        Write-Host "Keeping existing staging branch" -ForegroundColor Green
        exit
    }
}

Write-Host "Creating staging branch from main..." -ForegroundColor Cyan
Write-Host ""

# Ensure we have latest main
Write-Host "1. Fetching latest changes..." -ForegroundColor Yellow
git fetch origin

# Checkout main
Write-Host "2. Checking out main branch..." -ForegroundColor Yellow
git checkout main

# Pull latest
Write-Host "3. Pulling latest main..." -ForegroundColor Yellow
git pull origin main

# Create staging branch
Write-Host "4. Creating staging branch..." -ForegroundColor Yellow
git checkout -b staging

# Push to remote
Write-Host "5. Pushing staging branch to GitHub..." -ForegroundColor Yellow
git push -u origin staging

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "✅ Staging branch created successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Branch structure:" -ForegroundColor White
Write-Host "  main    → Production environment" -ForegroundColor Cyan
Write-Host "  staging → Staging environment" -ForegroundColor Cyan
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📝 NEXT STEPS - IMPORTANT!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Configure Vercel Staging Project:" -ForegroundColor Yellow
Write-Host "   a. Go to: https://vercel.com" -ForegroundColor White
Write-Host "   b. Select your STAGING project" -ForegroundColor White
Write-Host "   c. Go to Settings → Git" -ForegroundColor White
Write-Host "   d. Set 'Production Branch' to: staging" -ForegroundColor Cyan
Write-Host "   e. Save" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  Configure Vercel Production Project:" -ForegroundColor Yellow
Write-Host "   a. Select your PRODUCTION project" -ForegroundColor White
Write-Host "   b. Go to Settings → Git" -ForegroundColor White
Write-Host "   c. Set 'Production Branch' to: main" -ForegroundColor Cyan
Write-Host "   d. Save" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  Update Supabase Auth URLs:" -ForegroundColor Yellow
Write-Host "   STAGING: Site URL = https://assettracer-staging.vercel.app" -ForegroundColor White
Write-Host "   PRODUCTION: Site URL = https://www.asset-tracer.com" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣  Test the workflow:" -ForegroundColor Yellow
Write-Host "   # Make a change on staging" -ForegroundColor White
Write-Host "   git checkout staging" -ForegroundColor Cyan
Write-Host "   # ... make changes ..." -ForegroundColor Gray
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m 'Test change'" -ForegroundColor Cyan
Write-Host "   git push origin staging" -ForegroundColor Cyan
Write-Host "   # → Auto-deploys to staging only" -ForegroundColor Gray
Write-Host ""
Write-Host "   # After testing, promote to production" -ForegroundColor White
Write-Host "   git checkout main" -ForegroundColor Cyan
Write-Host "   git merge staging" -ForegroundColor Cyan
Write-Host "   git push origin main" -ForegroundColor Cyan
Write-Host "   # → Auto-deploys to production" -ForegroundColor Gray
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Offer to open Vercel
$openVercel = Read-Host "Open Vercel dashboard now? (yes/no)"
if ($openVercel -eq "yes") {
    Start-Process "https://vercel.com/dashboard"
}

Write-Host ""
Write-Host "✅ Done! Your staging branch is ready." -ForegroundColor Green
Write-Host ""

