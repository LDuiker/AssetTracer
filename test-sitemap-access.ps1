# Test if sitemap.xml is accessible

Write-Host "`n=== Testing Sitemap Accessibility ===" -ForegroundColor Cyan

$urls = @(
    "https://www.asset-tracer.com/sitemap.xml",
    "https://asset-tracer.com/sitemap.xml"
)

foreach ($url in $urls) {
    Write-Host "`nTesting: $url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -ErrorAction Stop
        
        Write-Host "  Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
        Write-Host "  Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor White
        
        if ($response.StatusCode -eq 200) {
            Write-Host "  SUCCESS! Sitemap is accessible" -ForegroundColor Green
            
            # Now get the content
            $content = Invoke-WebRequest -Uri $url -ErrorAction Stop
            if ($content.Content -match "<urlset") {
                Write-Host "  Format: Valid XML sitemap" -ForegroundColor Green
            } else {
                Write-Host "  WARNING: Content doesn't look like a sitemap" -ForegroundColor Yellow
            }
        }
        
    } catch {
        Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "  Status Code: $statusCode" -ForegroundColor Yellow
            
            if ($statusCode -eq 404) {
                Write-Host "  Issue: Sitemap file not found (404)" -ForegroundColor Red
            } elseif ($statusCode -eq 500) {
                Write-Host "  Issue: Server error (500)" -ForegroundColor Red
            }
        }
    }
}

Write-Host "`n=== Diagnosis ===" -ForegroundColor Cyan
Write-Host "If BOTH URLs failed with 404:" -ForegroundColor White
Write-Host "  - Sitemap file wasn't deployed to production" -ForegroundColor Yellow
Write-Host "  - Need to redeploy with sitemap.ts file" -ForegroundColor Yellow
Write-Host ""
Write-Host "If you get 500 error:" -ForegroundColor White
Write-Host "  - There's an error in sitemap.ts" -ForegroundColor Yellow
Write-Host "  - Check Vercel logs" -ForegroundColor Yellow
Write-Host ""
Write-Host "If one works:" -ForegroundColor White
Write-Host "  - Use the working URL in Google Search Console" -ForegroundColor Green
Write-Host ""

