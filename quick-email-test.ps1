# Quick Resend Email Test - One Liner
# Usage: .\quick-email-test.ps1 "YOUR_API_KEY" "your@email.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$true)]
    [string]$ToEmail
)

Write-Host ""
Write-Host "Testing Resend Email..." -ForegroundColor Yellow
Write-Host "From: notifications@asset-tracer.com" -ForegroundColor Gray
Write-Host "To: $ToEmail" -ForegroundColor Gray
Write-Host ""

try {
    $body = @{
        from = "AssetTracer <notifications@asset-tracer.com>"
        to = $ToEmail
        subject = "✅ DNS Test Successful"
        html = "<h1>Success!</h1><p>Your AssetTracer email system is working!</p><p>DNS verification complete ✅</p>"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "https://api.resend.com/emails" `
        -Method POST `
        -Headers $headers `
        -Body $body

    Write-Host "[SUCCESS] Email sent!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Email ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "Check your inbox: $ToEmail" -ForegroundColor White
    Write-Host ""
    Write-Host "View in Resend: https://resend.com/emails" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 DNS verification is COMPLETE!" -ForegroundColor Green
    Write-Host "You can now use Resend for production emails." -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host "[FAILED] Could not send email" -ForegroundColor Red
    Write-Host ""
    
    $errorDetails = $_.ErrorDetails.Message
    
    if ($errorDetails) {
        try {
            $errorJson = $errorDetails | ConvertFrom-Json
            Write-Host "Error: $($errorJson.message)" -ForegroundColor Yellow
            
            if ($errorJson.message -like "*not verified*" -or $errorJson.message -like "*pending*") {
                Write-Host ""
                Write-Host "❌ Domain not verified yet" -ForegroundColor Red
                Write-Host ""
                Write-Host "Current status: Still verifying..." -ForegroundColor Yellow
                Write-Host "Action: Wait 10 more minutes and try again" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "Check status: https://resend.com/domains" -ForegroundColor Cyan
                
            } elseif ($errorJson.message -like "*API key*") {
                Write-Host ""
                Write-Host "❌ Invalid API key" -ForegroundColor Red
                Write-Host "Get your key: https://resend.com/api-keys" -ForegroundColor Cyan
            }
        } catch {
            Write-Host "Error: $errorDetails" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

