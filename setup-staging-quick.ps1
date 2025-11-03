# =====================================================
# QUICK STAGING SETUP SCRIPT
# =====================================================
# This script helps you clone production to staging
# Run this in PowerShell from the project root
# =====================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 AssetTracer Staging Setup Assistant" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Confirm deletion
Write-Host "⚠️  WARNING: This will set up a FRESH staging database" -ForegroundColor Yellow
Write-Host "   All existing staging data will be kept if tables exist" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Setup cancelled" -ForegroundColor Red
    exit
}
Write-Host ""

# Step 2: Get Supabase staging info
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📋 Step 1: Supabase Staging Project Info" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please provide your STAGING Supabase project details:" -ForegroundColor White
Write-Host ""

$stagingProjectRef = Read-Host "Staging Project Reference (e.g., ougntjrrskfsuognjmcw)"
$stagingUrl = "https://$stagingProjectRef.supabase.co"
Write-Host ""
Write-Host "✅ Staging URL: $stagingUrl" -ForegroundColor Green
Write-Host ""

# Step 3: Instructions for SQL script
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📝 Step 2: Run SQL Setup Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now you need to run the setup SQL script in Supabase:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to: https://supabase.com/dashboard/project/$stagingProjectRef/sql" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Open the file: SETUP-STAGING-FROM-PRODUCTION.sql" -ForegroundColor Yellow
Write-Host "   Location: $PWD\SETUP-STAGING-FROM-PRODUCTION.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Copy ALL contents of the file (Ctrl+A, Ctrl+C)" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Paste into Supabase SQL Editor" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Click 'RUN' button" -ForegroundColor Yellow
Write-Host ""
Write-Host "6. Wait for green checkmark ✓" -ForegroundColor Yellow
Write-Host ""

# Open the SQL file for easy copying
$setupSqlPath = Join-Path $PWD "SETUP-STAGING-FROM-PRODUCTION.sql"
if (Test-Path $setupSqlPath) {
    Write-Host "📂 Opening SQL file for you..." -ForegroundColor Cyan
    Start-Process notepad.exe $setupSqlPath
}

Write-Host ""
$sqlDone = Read-Host "Have you run the SQL script successfully? (yes/no)"
if ($sqlDone -ne "yes") {
    Write-Host "❌ Please run the SQL script first, then run this script again" -ForegroundColor Red
    exit
}
Write-Host ""

# Step 4: Verify with verification script
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🔍 Step 3: Verify Database Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Let's verify the database was set up correctly:" -ForegroundColor White
Write-Host ""
Write-Host "1. In Supabase SQL Editor (same tab)" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Open the file: VERIFY-STAGING-SCHEMA.sql" -ForegroundColor Yellow
Write-Host "   Location: $PWD\VERIFY-STAGING-SCHEMA.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Copy and paste into SQL Editor" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Click 'RUN' and check results" -ForegroundColor Yellow
Write-Host ""

# Open verification file
$verifySqlPath = Join-Path $PWD "VERIFY-STAGING-SCHEMA.sql"
if (Test-Path $verifySqlPath) {
    Write-Host "📂 Opening verification SQL file..." -ForegroundColor Cyan
    Start-Process notepad.exe $verifySqlPath
}

Write-Host ""
$verifyDone = Read-Host "Did all checks pass? (yes/no)"
if ($verifyDone -ne "yes") {
    Write-Host ""
    Write-Host "⚠️  Some checks failed. Please:" -ForegroundColor Yellow
    Write-Host "   1. Check the Supabase SQL Editor results" -ForegroundColor Yellow
    Write-Host "   2. Fix any missing tables or triggers" -ForegroundColor Yellow
    Write-Host "   3. Run VERIFY-STAGING-SCHEMA.sql again" -ForegroundColor Yellow
    Write-Host ""
    exit
}
Write-Host ""

# Step 5: Configure Supabase Auth URLs
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🔐 Step 4: Configure Supabase Auth" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configure authentication URLs in Supabase:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to: https://supabase.com/dashboard/project/$stagingProjectRef/auth/url-configuration" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Set Site URL to:" -ForegroundColor Yellow
Write-Host "   https://assettracer-staging.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Add Redirect URLs:" -ForegroundColor Yellow
Write-Host "   https://assettracer-staging.vercel.app/**" -ForegroundColor Cyan
Write-Host "   https://assettracer-staging.vercel.app/auth/callback" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/**" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/auth/callback" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Save changes" -ForegroundColor Yellow
Write-Host ""

# Open Supabase dashboard
Write-Host "📂 Opening Supabase Auth Settings..." -ForegroundColor Cyan
Start-Process "https://supabase.com/dashboard/project/$stagingProjectRef/auth/url-configuration"

Write-Host ""
$authDone = Read-Host "Have you configured the Auth URLs? (yes/no)"
if ($authDone -ne "yes") {
    Write-Host "⚠️  Please configure Auth URLs before continuing" -ForegroundColor Yellow
    exit
}
Write-Host ""

# Step 6: Get Vercel project info
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "⚡ Step 5: Update Vercel Environment Variables" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need to update environment variables in Vercel:" -ForegroundColor White
Write-Host ""

$vercelProject = Read-Host "What is your Vercel staging project name? (e.g., assettracer-staging)"
Write-Host ""
Write-Host "1. Go to: https://vercel.com/$vercelProject/settings/environment-variables" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Update these variables:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   NEXT_PUBLIC_SUPABASE_URL = $stagingUrl" -ForegroundColor Cyan
Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY = [Get from Supabase > Settings > API]" -ForegroundColor Cyan
Write-Host "   SUPABASE_SERVICE_ROLE_KEY = [Get from Supabase > Settings > API]" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Save changes" -ForegroundColor Yellow
Write-Host ""

# Open Vercel settings
Write-Host "📂 Opening Vercel Settings..." -ForegroundColor Cyan
Start-Process "https://vercel.com"

Write-Host ""
$vercelDone = Read-Host "Have you updated Vercel environment variables? (yes/no)"
if ($vercelDone -ne "yes") {
    Write-Host "⚠️  Please update Vercel variables before continuing" -ForegroundColor Yellow
    exit
}
Write-Host ""

# Step 7: Redeploy instructions
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 Step 6: Redeploy Vercel" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Force a fresh deployment in Vercel:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to Vercel Dashboard > Deployments" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Click on latest deployment" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Click '...' menu > 'Redeploy'" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. ⚠️  IMPORTANT: UNCHECK 'Use existing Build Cache'" -ForegroundColor Red
Write-Host ""
Write-Host "5. Click 'Redeploy'" -ForegroundColor Yellow
Write-Host ""
Write-Host "6. Wait for deployment to complete (~2-3 minutes)" -ForegroundColor Yellow
Write-Host ""
$deployDone = Read-Host "Is deployment complete? (yes/no)"
if ($deployDone -ne "yes") {
    Write-Host "⏳ Please wait for deployment to finish" -ForegroundColor Yellow
    exit
}
Write-Host ""

# Step 8: Test
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🧪 Step 7: Test Your Staging Environment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Final step - test that everything works:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open an INCOGNITO/PRIVATE browser window" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Go to: https://assettracer-staging.vercel.app" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Click 'Sign in with Google'" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Expected behavior:" -ForegroundColor Yellow
Write-Host "   ✅ Redirects to Google" -ForegroundColor Green
Write-Host "   ✅ Redirects back to staging" -ForegroundColor Green
Write-Host "   ✅ Creates user automatically" -ForegroundColor Green
Write-Host "   ✅ Shows dashboard" -ForegroundColor Green
Write-Host ""

# Open staging site
Write-Host "📂 Opening staging site..." -ForegroundColor Cyan
Start-Process "https://assettracer-staging.vercel.app"

Write-Host ""
$testDone = Read-Host "Did the sign-in work correctly? (yes/no)"
Write-Host ""

if ($testDone -eq "yes") {
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "✅ STAGING SETUP COMPLETE!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your staging environment is now:" -ForegroundColor White
    Write-Host "  ✅ Cloned from production schema" -ForegroundColor Green
    Write-Host "  ✅ OAuth trigger installed" -ForegroundColor Green
    Write-Host "  ✅ RLS policies configured" -ForegroundColor Green
    Write-Host "  ✅ Auth URLs configured" -ForegroundColor Green
    Write-Host "  ✅ Vercel deployed" -ForegroundColor Green
    Write-Host "  ✅ Fully functional" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 You can now test features in staging!" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "❌ TROUBLESHOOTING NEEDED" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "The sign-in didn't work. Common issues:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Check Supabase Auth URLs are correct" -ForegroundColor Yellow
    Write-Host "2. Check Vercel environment variables" -ForegroundColor Yellow
    Write-Host "3. Check Vercel deployment shows latest commit" -ForegroundColor Yellow
    Write-Host "4. Run VERIFY-STAGING-SCHEMA.sql to check database" -ForegroundColor Yellow
    Write-Host "5. Check browser console for errors (F12)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For detailed troubleshooting, see:" -ForegroundColor Yellow
    Write-Host "  - STAGING-FIX-CHECKLIST.md" -ForegroundColor Cyan
    Write-Host "  - CLONE-PRODUCTION-TO-STAGING.md" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

