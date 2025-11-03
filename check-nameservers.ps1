# Check where asset-tracer.com nameservers are pointing

Write-Host "`n=== Checking Nameservers for asset-tracer.com ===" -ForegroundColor Cyan
Write-Host "This will tell you whether to use Cloudflare or Namecheap for DNS`n" -ForegroundColor Gray

try {
    $nameservers = Resolve-DnsName -Name "asset-tracer.com" -Type NS -ErrorAction Stop
    
    Write-Host "Your nameservers are:" -ForegroundColor Yellow
    Write-Host ""
    
    $usingCloudflare = $false
    $usingNamecheap = $false
    
    foreach ($ns in $nameservers) {
        $nsName = $ns.NameHost
        Write-Host "  - $nsName" -ForegroundColor White
        
        if ($nsName -match "cloudflare") {
            $usingCloudflare = $true
        }
        if ($nsName -match "namecheap" -or $nsName -match "registrar-servers") {
            $usingNamecheap = $true
        }
    }
    
    Write-Host ""
    Write-Host "=== ANSWER ===" -ForegroundColor Cyan
    
    if ($usingCloudflare) {
        Write-Host "✓ Your domain uses CLOUDFLARE nameservers" -ForegroundColor Green
        Write-Host ""
        Write-Host "ACTION: Add the DNS records in CLOUDFLARE" -ForegroundColor Yellow
        Write-Host "Go to: https://dash.cloudflare.com/" -ForegroundColor White
        Write-Host ""
    } elseif ($usingNamecheap) {
        Write-Host "✓ Your domain uses NAMECHEAP nameservers" -ForegroundColor Green
        Write-Host ""
        Write-Host "ACTION: Add the DNS records in NAMECHEAP" -ForegroundColor Yellow
        Write-Host "Go to: https://www.namecheap.com/myaccount/login/" -ForegroundColor White
        Write-Host "Then: Domain List → Manage → Advanced DNS" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "? Your domain uses CUSTOM nameservers" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Check where these nameservers are from and add DNS records there." -ForegroundColor White
        Write-Host ""
    }
    
} catch {
    Write-Host "✗ Could not retrieve nameservers" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Try checking manually:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://www.namecheap.com/myaccount/login/" -ForegroundColor White
    Write-Host "2. Click: Domain List → asset-tracer.com → Manage" -ForegroundColor White
    Write-Host "3. Look at 'Nameservers' section - does it say Cloudflare or Namecheap?" -ForegroundColor White
    Write-Host ""
}

Write-Host "=== Quick Guide ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If CLOUDFLARE:" -ForegroundColor Yellow
Write-Host "  1. Go to https://dash.cloudflare.com/" -ForegroundColor White
Write-Host "  2. Select: asset-tracer.com" -ForegroundColor White
Write-Host "  3. Click: DNS → Records → Add record" -ForegroundColor White
Write-Host ""
Write-Host "If NAMECHEAP:" -ForegroundColor Yellow
Write-Host "  1. Go to https://www.namecheap.com/myaccount/login/" -ForegroundColor White
Write-Host "  2. Domain List → asset-tracer.com → Manage" -ForegroundColor White
Write-Host "  3. Click: Advanced DNS tab" -ForegroundColor White
Write-Host "  4. Click: Add New Record" -ForegroundColor White
Write-Host ""

