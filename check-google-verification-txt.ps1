# Check if Google verification TXT record is visible

Write-Host "`n=== Checking Google Verification TXT Record ===" -ForegroundColor Cyan
Write-Host "Domain: asset-tracer.com`n" -ForegroundColor Gray

try {
    $txtRecords = Resolve-DnsName -Name "asset-tracer.com" -Type TXT -ErrorAction Stop
    
    Write-Host "Found TXT records:" -ForegroundColor Yellow
    Write-Host ""
    
    $googleVerificationFound = $false
    
    foreach ($record in $txtRecords) {
        $recordValue = $record.Strings -join ""
        Write-Host "- $recordValue" -ForegroundColor White
        
        if ($recordValue -match "google-site-verification") {
            $googleVerificationFound = $true
            Write-Host "  ^ THIS IS YOUR GOOGLE VERIFICATION RECORD!" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    
    if ($googleVerificationFound) {
        Write-Host "SUCCESS! Google verification record is live!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Go back to Google Search Console" -ForegroundColor White
        Write-Host "2. Click 'Verify' button again" -ForegroundColor White
        Write-Host "3. It should work now!" -ForegroundColor White
    } else {
        Write-Host "NOT FOUND: Google verification record not visible yet" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "This means:" -ForegroundColor Cyan
        Write-Host "1. DNS is still propagating (wait 5-10 more minutes)" -ForegroundColor White
        Write-Host "2. OR record wasn't added correctly in Namecheap" -ForegroundColor White
        Write-Host ""
        Write-Host "Check Namecheap:" -ForegroundColor Cyan
        Write-Host "1. Go to Advanced DNS tab" -ForegroundColor White
        Write-Host "2. Look for TXT record with Host: @" -ForegroundColor White
        Write-Host "3. Value should start with: google-site-verification=" -ForegroundColor White
    }
    
} catch {
    Write-Host "ERROR: Could not check DNS records" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

