# Check Vercel Deployment Status
Write-Host "`n🔍 Checking Vercel Deployment..." -ForegroundColor Cyan

Write-Host "`nLatest commits:" -ForegroundColor Yellow
git log --oneline -5

Write-Host "`n✅ Latest commit pushed:" -ForegroundColor Green
git log -1 --pretty=format:"%h - %s (%cr)" --color=always

Write-Host "`n`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Check if deployment is complete" -ForegroundColor White
Write-Host "3. Look for commit: 'fix: Force Google account chooser on login'" -ForegroundColor White

Write-Host "`n⏱️  Deployment usually takes 2-5 minutes" -ForegroundColor Cyan
Write-Host "`n"

