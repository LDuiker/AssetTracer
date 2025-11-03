# =====================================================
# Test Resend Email Integration
# =====================================================
# This script sends a test email using your Resend API key
# =====================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Testing Resend Email Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get configuration
$apiKey = Read-Host "Enter your RESEND_API_KEY (starts with re_)"
$toEmail = Read-Host "Enter YOUR email address (to receive test)"

Write-Host ""
Write-Host "Sending test email..." -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }

    $body = @{
        from = "AssetTracer <notifications@asset-tracer.com>"
        to = $toEmail
        subject = "🎉 AssetTracer Email Test - Success!"
        html = @"
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 40px auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #3b82f6; margin-bottom: 20px; }
        .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .checkmark { color: #10b981; font-size: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ Email Setup Successful!</h1>
        
        <div class="success">
            <p><strong>🎉 Congratulations!</strong></p>
            <p>Your Resend email integration is working perfectly.</p>
        </div>

        <div class="info">
            <p><strong>📧 Configuration Verified:</strong></p>
            <ul>
                <li>✅ Resend API Key: Valid</li>
                <li>✅ Domain: asset-tracer.com</li>
                <li>✅ DNS Records: Configured</li>
                <li>✅ Email Sending: Working</li>
            </ul>
        </div>

        <h2>🚀 What's Next?</h2>
        <p>Your AssetTracer application can now send:</p>
        <ul>
            <li>📋 Invoice reminder emails</li>
            <li>📊 Weekly financial reports</li>
            <li>🔔 Maintenance alerts</li>
        </ul>

        <div class="footer">
            <p>Sent from AssetTracer Production</p>
            <p>Domain: asset-tracer.com</p>
            <p>Powered by Resend</p>
        </div>
    </div>
</body>
</html>
"@
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri "https://api.resend.com/emails" `
        -Method Post `
        -Headers $headers `
        -Body $body

    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ SUCCESS! Email sent!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Email ID: $($response.id)" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Check your inbox: $toEmail" -ForegroundColor Gray
    Write-Host "  2. Also check spam folder (just in case)" -ForegroundColor Gray
    Write-Host "  3. View in Resend: https://resend.com/emails" -ForegroundColor Gray
    Write-Host ""
    Write-Host "If you received the email, your setup is complete! 🎉" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ ERROR sending email" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. Invalid API key (check it starts with 're_')" -ForegroundColor Gray
    Write-Host "  2. Domain not verified yet (wait 5-10 more minutes)" -ForegroundColor Gray
    Write-Host "  3. FROM address doesn't match verified domain" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Press Enter to close..." -ForegroundColor Cyan
Read-Host

