# =============================================================================
# Check DNS Records for Resend Email Configuration
# =============================================================================
# This script checks your domain's DNS records for email configuration issues
# =============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Domain = "asset-tracer.com"
)

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  DNS RECORDS CHECKER FOR RESEND EMAIL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Domain: $Domain" -ForegroundColor White
Write-Host ""

# Function to format results
function Show-Result {
    param($Status, $Message, $Details)
    
    if ($Status -eq "OK") {
        Write-Host "✅ " -ForegroundColor Green -NoNewline
    } elseif ($Status -eq "WARNING") {
        Write-Host "⚠️  " -ForegroundColor Yellow -NoNewline
    } else {
        Write-Host "❌ " -ForegroundColor Red -NoNewline
    }
    
    Write-Host $Message -ForegroundColor White
    if ($Details) {
        Write-Host "   $Details" -ForegroundColor Gray
    }
}

# =============================================================================
# 1. CHECK TXT RECORDS (SPF and DKIM)
# =============================================================================
Write-Host "1. Checking TXT Records (SPF)..." -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Gray

try {
    $txtRecords = Resolve-DnsName -Name $Domain -Type TXT -ErrorAction Stop
    
    # Filter for SPF records
    $spfRecords = $txtRecords | Where-Object { $_.Strings -like "v=spf1*" }
    
    if ($spfRecords.Count -eq 0) {
        Show-Result "ERROR" "No SPF record found" "You need to add: v=spf1 include:resend.com ~all"
    } elseif ($spfRecords.Count -gt 1) {
        Show-Result "ERROR" "Multiple SPF records found (only 1 allowed)"
        Write-Host ""
        Write-Host "   Found $($spfRecords.Count) SPF records:" -ForegroundColor Red
        foreach ($record in $spfRecords) {
            Write-Host "   - $($record.Strings)" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "   ACTION REQUIRED: Combine them into ONE record" -ForegroundColor Yellow
        Write-Host "   Example: v=spf1 include:resend.com include:other.com ~all" -ForegroundColor Cyan
    } else {
        $spfValue = $spfRecords[0].Strings
        Write-Host "   Current SPF: $spfValue" -ForegroundColor Cyan
        
        # Check if includes Resend
        if ($spfValue -like "*include:resend.com*") {
            Show-Result "OK" "SPF record includes Resend"
        } else {
            Show-Result "ERROR" "SPF record doesn't include Resend" "Add 'include:resend.com' to your SPF record"
        }
        
        # Check proper ending
        if ($spfValue -like "*~all" -or $spfValue -like "*-all") {
            Show-Result "OK" "SPF record has proper ending (~all or -all)"
        } else {
            Show-Result "WARNING" "SPF record should end with ~all or -all"
        }
    }
} catch {
    Show-Result "ERROR" "Could not resolve TXT records" $_.Exception.Message
}

Write-Host ""

# =============================================================================
# 2. CHECK DKIM RECORD
# =============================================================================
Write-Host "2. Checking DKIM Record..." -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Gray

try {
    $dkimDomain = "resend._domainkey.$Domain"
    $dkimRecords = Resolve-DnsName -Name $dkimDomain -Type TXT -ErrorAction Stop
    
    if ($dkimRecords) {
        $dkimValue = $dkimRecords[0].Strings -join ""
        if ($dkimValue -like "p=*") {
            Show-Result "OK" "DKIM record found at resend._domainkey"
            Write-Host "   Value: $($dkimValue.Substring(0, [Math]::Min(50, $dkimValue.Length)))..." -ForegroundColor Gray
        } else {
            Show-Result "WARNING" "DKIM record found but format looks wrong"
            Write-Host "   Should start with: p=MIGfMA..." -ForegroundColor Gray
        }
    }
} catch {
    Show-Result "ERROR" "DKIM record not found" "Add TXT record at: resend._domainkey"
    Write-Host "   Get the value from: https://resend.com/domains" -ForegroundColor Cyan
}

Write-Host ""

# =============================================================================
# 3. CHECK MX RECORDS
# =============================================================================
Write-Host "3. Checking MX Records..." -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Gray

try {
    $mxRecords = Resolve-DnsName -Name $Domain -Type MX -ErrorAction Stop
    
    # Check if Resend's MX exists
    $resendMX = $mxRecords | Where-Object { $_.NameExchange -like "*amazonses.com*" }
    
    if ($resendMX) {
        Show-Result "OK" "Resend MX record found"
        Write-Host "   Value: $($resendMX.NameExchange)" -ForegroundColor Gray
    } else {
        Show-Result "WARNING" "Resend MX record not found (optional but recommended)"
        Write-Host "   Add: feedback-smtp.us-east-1.amazonses.com (Priority: 10)" -ForegroundColor Cyan
    }
    
    if ($mxRecords.Count -gt 0) {
        Write-Host ""
        Write-Host "   All MX records:" -ForegroundColor Gray
        foreach ($mx in $mxRecords) {
            Write-Host "   - Priority $($mx.Preference): $($mx.NameExchange)" -ForegroundColor Gray
        }
    }
} catch {
    Show-Result "WARNING" "No MX records found" "MX record is optional for Resend"
}

Write-Host ""

# =============================================================================
# 4. COMPREHENSIVE ANALYSIS
# =============================================================================
Write-Host "4. Overall Analysis..." -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Count issues
$issues = @()

# Re-check SPF
$spfRecords = Resolve-DnsName -Name $Domain -Type TXT -ErrorAction SilentlyContinue | 
              Where-Object { $_.Strings -like "v=spf1*" }

if ($spfRecords.Count -eq 0) {
    $issues += "Missing SPF record"
} elseif ($spfRecords.Count -gt 1) {
    $issues += "Multiple SPF records (must combine into one)"
} elseif ($spfRecords[0].Strings -notlike "*include:resend.com*") {
    $issues += "SPF doesn't include Resend"
}

# Re-check DKIM
try {
    $dkimCheck = Resolve-DnsName -Name "resend._domainkey.$Domain" -Type TXT -ErrorAction Stop
    if (-not $dkimCheck) {
        $issues += "Missing DKIM record"
    }
} catch {
    $issues += "Missing DKIM record"
}

# Show summary
if ($issues.Count -eq 0) {
    Write-Host "🎉 " -ForegroundColor Green -NoNewline
    Write-Host "All DNS records look good!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://resend.com/domains" -ForegroundColor White
    Write-Host "   2. Click 'Verify' button" -ForegroundColor White
    Write-Host "   3. Wait for green checkmarks ✅" -ForegroundColor White
} else {
    Write-Host "⚠️  Found $($issues.Count) issue(s):" -ForegroundColor Yellow
    Write-Host ""
    foreach ($issue in $issues) {
        Write-Host "   ❌ $issue" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "📋 ACTION REQUIRED:" -ForegroundColor Yellow
    Write-Host "   1. Fix the issues listed above" -ForegroundColor White
    Write-Host "   2. Wait 15-30 minutes for DNS propagation" -ForegroundColor White
    Write-Host "   3. Run this script again to verify" -ForegroundColor White
    Write-Host "   4. See FIX-RESEND-SPF-RECORDS.md for detailed help" -ForegroundColor Cyan
}

Write-Host ""

# =============================================================================
# 5. RECOMMENDED SPF RECORD
# =============================================================================
Write-Host "5. Recommended Configuration..." -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "If you need to create/update your SPF record:" -ForegroundColor White
Write-Host ""
Write-Host "Type: TXT" -ForegroundColor Cyan
Write-Host "Name: `@ (or blank)" -ForegroundColor Cyan
Write-Host "Value: " -ForegroundColor Cyan -NoNewline

# Detect existing services and suggest combined SPF
$currentSPF = ""
if ($spfRecords.Count -gt 0) {
    $currentSPF = $spfRecords[0].Strings
}

if ($currentSPF -like "*include:render.com*") {
    Write-Host "v=spf1 include:render.com include:resend.com ~all" -ForegroundColor Green
    Write-Host "   (Combines Render + Resend)" -ForegroundColor Gray
} elseif ($currentSPF -like "*include:_spf.google.com*") {
    Write-Host "v=spf1 include:resend.com include:_spf.google.com ~all" -ForegroundColor Green
    Write-Host "   (Combines Resend + Google)" -ForegroundColor Gray
} else {
    Write-Host "v=spf1 include:resend.com ~all" -ForegroundColor Green
    Write-Host "   (Resend only)" -ForegroundColor Gray
}

Write-Host ""

# =============================================================================
# 6. USEFUL LINKS
# =============================================================================
Write-Host "6. Useful Links..." -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Check DNS propagation globally:" -ForegroundColor White
Write-Host "   https://dnschecker.org/" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 SPF record validator:" -ForegroundColor White
Write-Host "   https://mxtoolbox.com/spf.aspx" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Resend domain verification:" -ForegroundColor White
Write-Host "   https://resend.com/domains" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Detailed fix guide:" -ForegroundColor White
Write-Host "   See: FIX-RESEND-SPF-RECORDS.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Optional: Open browser to Resend dashboard
$openBrowser = Read-Host "Open Resend dashboard in browser? (y/n)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process "https://resend.com/domains"
}

