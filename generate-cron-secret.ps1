# =====================================================
# Generate CRON_SECRET for Production
# =====================================================
# Run this to generate a secure random secret for CRON_SECRET
# =====================================================

Write-Host ""
Write-Host "Generating Secure CRON_SECRET..." -ForegroundColor Cyan
Write-Host ""

# Generate a secure random string (32 bytes, base64 encoded)
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)

Write-Host "===============================================================" -ForegroundColor Gray
Write-Host "Your CRON_SECRET:" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Gray
Write-Host ""

Write-Host $secret -ForegroundColor Yellow

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Gray
Write-Host "NEXT STEPS:" -ForegroundColor White
Write-Host "  1. Copy this value to your .env.production file" -ForegroundColor Gray
Write-Host "  2. Also add it to Vercel Environment Variables" -ForegroundColor Gray
Write-Host "===============================================================" -ForegroundColor Gray
Write-Host ""

# Copy to clipboard
Set-Clipboard -Value $secret
Write-Host "Secret has been copied to clipboard!" -ForegroundColor Green
Write-Host ""

