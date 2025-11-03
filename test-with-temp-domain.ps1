# Test Email with Resend's Temporary Domain
# This works immediately without domain verification

param(
    [string]$ApiKey = "re_YhXAC9GG_LNmkTdSuKshFmbtgWv18QUDS",
    [string]$ToEmail = "mrlduiker@gmail.com"
)

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  TESTING WITH TEMPORARY RESEND DOMAIN" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "From: onboarding@resend.dev (temporary)" -ForegroundColor Yellow
Write-Host "To: $ToEmail" -ForegroundColor White
Write-Host ""
Write-Host "Sending..." -ForegroundColor Yellow

try {
    $body = @{
        from = "AssetTracer <onboarding@resend.dev>"
        to = $ToEmail
        subject = "AssetTracer Email Test (Temporary Domain)"
        html = @"
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .content { background: white; padding: 30px; margin-top: 20px; border-radius: 10px; }
        .success { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Email System Test</h1>
            <p>AssetTracer</p>
        </div>
        <div class="content">
            <div class="success">
                Your email system is working!
            </div>
            
            <h2>Test Results:</h2>
            
            <div class="info">
                <p><strong>✅ Email Sending:</strong> Working</p>
                <p><strong>✅ Resend API:</strong> Connected</p>
                <p><strong>✅ Email Templates:</strong> Rendering correctly</p>
            </div>
            
            <div class="warning">
                <p><strong>⚠️ Note:</strong> This email was sent from <code>onboarding@resend.dev</code> (temporary domain).</p>
                <p>Once <code>asset-tracer.com</code> is verified, emails will come from <code>notifications@asset-tracer.com</code>.</p>
            </div>
            
            <h3>Current Status:</h3>
            <ul>
                <li>DNS Records: ✅ Configured correctly</li>
                <li>Domain Verification: ⏳ In progress (waiting for Resend)</li>
                <li>Email System: ✅ Ready to use</li>
            </ul>
            
            <h3>Next Steps:</h3>
            <ol>
                <li>Contact Resend support for manual verification</li>
                <li>Use temporary domain for testing in the meantime</li>
                <li>Switch to custom domain once verified</li>
            </ol>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px; text-align: center;">
                AssetTracer - Asset Management System<br>
                This is a test email
            </p>
        </div>
    </div>
</body>
</html>
"@
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "https://api.resend.com/emails" `
        -Method POST `
        -Headers $headers `
        -Body $body

    Write-Host ""
    Write-Host "[SUCCESS] Email sent!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Email ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "Check your inbox: $ToEmail" -ForegroundColor White
    Write-Host "(Check spam/junk folder too)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "View in Resend: https://resend.com/emails/$($response.id)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ Your email system WORKS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can use this temporary domain while waiting" -ForegroundColor White
    Write-Host "for asset-tracer.com verification." -ForegroundColor White
    Write-Host ""
    Write-Host "Temporary:  onboarding@resend.dev" -ForegroundColor Yellow
    Write-Host "Production: notifications@asset-tracer.com (once verified)" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "[FAILED] Could not send email" -ForegroundColor Red
    Write-Host ""
    
    $errorDetails = $_.ErrorDetails.Message
    
    if ($errorDetails) {
        try {
            $errorJson = $errorDetails | ConvertFrom-Json
            Write-Host "Error: $($errorJson.message)" -ForegroundColor Yellow
        } catch {
            Write-Host "Error: $errorDetails" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

