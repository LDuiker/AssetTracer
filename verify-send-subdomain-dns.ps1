# Verify DNS Records for send.asset-tracer.com

Write-Host "`n=== Verifying DNS Records for send.asset-tracer.com ===" -ForegroundColor Cyan
Write-Host "This checks if the subdomain records are properly configured`n" -ForegroundColor Gray

# Check SPF (TXT) Record
Write-Host "1. Checking SPF (TXT) Record..." -ForegroundColor Yellow
Write-Host "   Looking for: v=spf1 include:amazonses.com ~all`n" -ForegroundColor Gray

try {
    $txtRecords = Resolve-DnsName -Name "send.asset-tracer.com" -Type TXT -ErrorAction Stop
    
    $spfFound = $false
    foreach ($record in $txtRecords) {
        if ($record.Strings -match "v=spf1 include:amazonses.com") {
            Write-Host "   ✓ SPF Record Found!" -ForegroundColor Green
            Write-Host "   Value: $($record.Strings)" -ForegroundColor White
            $spfFound = $true
        }
    }
    
    if (-not $spfFound) {
        Write-Host "   ✗ SPF Record NOT found" -ForegroundColor Red
        Write-Host "   Found these TXT records instead:" -ForegroundColor Yellow
        foreach ($record in $txtRecords) {
            Write-Host "   - $($record.Strings)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ✗ No TXT records found for send.asset-tracer.com" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Check MX Record
Write-Host "2. Checking MX Record..." -ForegroundColor Yellow
Write-Host "   Looking for: feedback-smtp.us-east-1.amazonses.com`n" -ForegroundColor Gray

try {
    $mxRecords = Resolve-DnsName -Name "send.asset-tracer.com" -Type MX -ErrorAction Stop
    
    $mxFound = $false
    foreach ($record in $mxRecords) {
        if ($record.NameExchange -match "amazonses.com") {
            Write-Host "   ✓ MX Record Found!" -ForegroundColor Green
            Write-Host "   Mail Server: $($record.NameExchange)" -ForegroundColor White
            Write-Host "   Priority: $($record.Preference)" -ForegroundColor White
            $mxFound = $true
        }
    }
    
    if (-not $mxFound) {
        Write-Host "   ✗ Correct MX Record NOT found" -ForegroundColor Red
        Write-Host "   Found these MX records instead:" -ForegroundColor Yellow
        foreach ($record in $mxRecords) {
            Write-Host "   - $($record.NameExchange) (Priority: $($record.Preference))" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ✗ No MX records found for send.asset-tracer.com" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "If both records show ✓, your DNS is correctly configured!" -ForegroundColor Green
Write-Host "If you see ✗, add the missing records in Namecheap." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Add missing records in Namecheap (see ADD-DNS-RECORDS-NAMECHEAP.md)" -ForegroundColor White
Write-Host "2. Wait 5-10 minutes for DNS propagation" -ForegroundColor White
Write-Host "3. Run this script again to verify" -ForegroundColor White
Write-Host "4. Check Resend dashboard for verification status" -ForegroundColor White
Write-Host ""

