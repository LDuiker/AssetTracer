# DNS Records Checker for Resend Email
# Simple version without special characters

param(
    [string]$Domain = "asset-tracer.com"
)

Write-Host ""
Write-Host "================================================"
Write-Host "  DNS RECORDS CHECKER FOR RESEND EMAIL"
Write-Host "================================================"
Write-Host "Domain: $Domain"
Write-Host ""

# Check TXT Records (SPF)
Write-Host "1. Checking SPF Records..." -ForegroundColor Yellow
Write-Host "------------------------------------------------"

try {
    $txtRecords = Resolve-DnsName -Name $Domain -Type TXT -ErrorAction Stop
    $spfRecords = $txtRecords | Where-Object { $_.Strings -like "v=spf1*" }
    
    if ($spfRecords.Count -eq 0) {
        Write-Host "[ERROR] No SPF record found" -ForegroundColor Red
        Write-Host "  Add: v=spf1 include:resend.com ~all" -ForegroundColor Gray
    } elseif ($spfRecords.Count -gt 1) {
        Write-Host "[ERROR] Multiple SPF records found!" -ForegroundColor Red
        Write-Host "  You have $($spfRecords.Count) SPF records:" -ForegroundColor Yellow
        foreach ($record in $spfRecords) {
            Write-Host "  - $($record.Strings)" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "  SOLUTION: Combine them into ONE record" -ForegroundColor Cyan
        Write-Host "  Example: v=spf1 include:resend.com include:other.com ~all" -ForegroundColor Cyan
    } else {
        $spfValue = $spfRecords[0].Strings
        Write-Host "  Current SPF: $spfValue" -ForegroundColor Cyan
        
        if ($spfValue -like "*include:resend.com*") {
            Write-Host "[OK] SPF includes Resend" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] SPF does NOT include Resend" -ForegroundColor Red
            Write-Host "  Add: include:resend.com to your SPF record" -ForegroundColor Gray
        }
        
        if ($spfValue -like "*~all" -or $spfValue -like "*-all") {
            Write-Host "[OK] SPF has proper ending" -ForegroundColor Green
        } else {
            Write-Host "[WARN] SPF should end with ~all or -all" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "[ERROR] Could not resolve TXT records" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Check DKIM
Write-Host "2. Checking DKIM Record..." -ForegroundColor Yellow
Write-Host "------------------------------------------------"

try {
    $dkimDomain = "resend._domainkey.$Domain"
    $dkimRecords = Resolve-DnsName -Name $dkimDomain -Type TXT -ErrorAction Stop
    
    if ($dkimRecords) {
        $dkimValue = $dkimRecords[0].Strings -join ""
        if ($dkimValue -like "p=*") {
            Write-Host "[OK] DKIM record found" -ForegroundColor Green
            Write-Host "  At: resend._domainkey" -ForegroundColor Gray
        } else {
            Write-Host "[WARN] DKIM found but format looks wrong" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "[ERROR] DKIM record not found" -ForegroundColor Red
    Write-Host "  Add TXT record at: resend._domainkey" -ForegroundColor Gray
    Write-Host "  Get value from: https://resend.com/domains" -ForegroundColor Cyan
}

Write-Host ""

# Check MX
Write-Host "3. Checking MX Records..." -ForegroundColor Yellow
Write-Host "------------------------------------------------"

try {
    $mxRecords = Resolve-DnsName -Name $Domain -Type MX -ErrorAction Stop
    $resendMX = $mxRecords | Where-Object { $_.NameExchange -like "*amazonses.com*" }
    
    if ($resendMX) {
        Write-Host "[OK] Resend MX record found" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Resend MX record not found (optional)" -ForegroundColor Yellow
        Write-Host "  Add: feedback-smtp.us-east-1.amazonses.com Priority: 10" -ForegroundColor Gray
    }
} catch {
    Write-Host "[WARN] No MX records found (optional for Resend)" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "4. Summary..." -ForegroundColor Yellow
Write-Host "------------------------------------------------"

$issues = @()

$spfRecords = Resolve-DnsName -Name $Domain -Type TXT -ErrorAction SilentlyContinue | 
              Where-Object { $_.Strings -like "v=spf1*" }

if ($spfRecords.Count -eq 0) {
    $issues += "Missing SPF record"
} elseif ($spfRecords.Count -gt 1) {
    $issues += "Multiple SPF records (combine into one)"
} elseif ($spfRecords[0].Strings -notlike "*include:resend.com*") {
    $issues += "SPF does not include Resend"
}

try {
    $dkimCheck = Resolve-DnsName -Name "resend._domainkey.$Domain" -Type TXT -ErrorAction Stop
    if (-not $dkimCheck) {
        $issues += "Missing DKIM record"
    }
} catch {
    $issues += "Missing DKIM record"
}

if ($issues.Count -eq 0) {
    Write-Host "[SUCCESS] All DNS records look good!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Go to: https://resend.com/domains"
    Write-Host "  2. Click Verify button"
    Write-Host "  3. Wait for green checkmarks"
} else {
    Write-Host "[ISSUES] Found $($issues.Count) problem(s):" -ForegroundColor Red
    Write-Host ""
    foreach ($issue in $issues) {
        Write-Host "  - $issue" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "See: FIX-RESEND-SPF-RECORDS.md for help" -ForegroundColor Cyan
}

Write-Host ""

# Show recommended SPF
Write-Host "5. Recommended SPF Record..." -ForegroundColor Yellow
Write-Host "------------------------------------------------"
Write-Host ""
Write-Host "Type: TXT"
Write-Host "Name: @ (or leave blank)"

$currentSPF = ""
if ($spfRecords.Count -gt 0) {
    $currentSPF = $spfRecords[0].Strings
}

if ($currentSPF -like "*include:render.com*") {
    Write-Host "Value: v=spf1 include:render.com include:resend.com ~all" -ForegroundColor Green
    Write-Host "  (Combines Render + Resend)" -ForegroundColor Gray
} elseif ($currentSPF -like "*include:_spf.google.com*") {
    Write-Host "Value: v=spf1 include:resend.com include:_spf.google.com ~all" -ForegroundColor Green
    Write-Host "  (Combines Resend + Google)" -ForegroundColor Gray
} else {
    Write-Host "Value: v=spf1 include:resend.com ~all" -ForegroundColor Green
    Write-Host "  (Resend only)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================"
Write-Host ""

# Offer to open browser
$response = Read-Host "Open Resend dashboard? (y/n)"
if ($response -eq "y") {
    Start-Process "https://resend.com/domains"
}

