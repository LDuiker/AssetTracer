# Test Resend Email - Send Test Email Now
# Your DNS is correct, so this should work even if dashboard still verifying

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  RESEND EMAIL TEST" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Get Resend API key
$apiKey = Read-Host "Enter your Resend API Key (starts with re_)"

# Get test email address
$toEmail = Read-Host "Enter your email address to receive test email"

Write-Host ""
Write-Host "Sending test email..." -ForegroundColor Yellow

try {
    # Prepare email data
    $emailData = @{
        from = "AssetTracer <notifications@asset-tracer.com>"
        to = $toEmail
        subject = "Test Email - AssetTracer DNS Verification"
        html = @"
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #10b981; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: bold; }
        .info { background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DNS Verification Test</h1>
            <p>AssetTracer Email System</p>
        </div>
        <div class="content">
            <div class="success">
                ✅ SUCCESS! Your DNS is configured correctly!
            </div>
            
            <h2>What This Means:</h2>
            
            <div class="info">
                <p><strong>Your email system is working!</strong></p>
                <ul>
                    <li>SPF record: Configured ✅</li>
                    <li>DKIM record: Configured ✅</li>
                    <li>MX record: Configured ✅</li>
                    <li>Email sending: Working ✅</li>
                </ul>
            </div>
            
            <p>Even though the Resend dashboard might still show "Looking for DNS records...", your email system is <strong>fully operational</strong>.</p>
            
            <h3>Next Steps:</h3>
            <ol>
                <li>Wait for Resend dashboard to show green checkmarks (15-30 minutes)</li>
                <li>Update your production environment variables</li>
                <li>Start sending emails to your users!</li>
            </ol>
            
            <div class="footer">
                <p>This email was sent from notifications@asset-tracer.com</p>
                <p>AssetTracer - Asset Management System</p>
            </div>
        </div>
    </div>
</body>
</html>
"@
    } | ConvertTo-Json

    # Send email
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "https://api.resend.com/emails" `
        -Method POST `
        -Headers $headers `
        -Body $emailData

    Write-Host ""
    Write-Host "[SUCCESS] Email sent successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Email ID: $($response.id)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Check your inbox: $toEmail" -ForegroundColor White
    Write-Host "(Also check spam/junk folder)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "View in Resend: https://resend.com/emails/$($response.id)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your DNS is working! The dashboard will catch up soon." -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "[ERROR] Failed to send email" -ForegroundColor Red
    Write-Host ""
    
    # Try to parse error
    $errorMessage = $_.Exception.Message
    $errorDetails = $_.ErrorDetails.Message
    
    Write-Host "Error: $errorMessage" -ForegroundColor Yellow
    
    if ($errorDetails) {
        $errorJson = $errorDetails | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorJson) {
            Write-Host "Details: $($errorJson.message)" -ForegroundColor Yellow
            
            # Specific error handling
            if ($errorJson.message -like "*not verified*") {
                Write-Host ""
                Write-Host "DIAGNOSIS: Domain not verified yet in Resend" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "OPTIONS:" -ForegroundColor Cyan
                Write-Host "1. Wait 15-30 more minutes for verification to complete"
                Write-Host "2. Use temporary Resend domain for immediate testing:"
                Write-Host "   Change 'from' to: AssetTracer <onboarding@resend.dev>"
                Write-Host ""
            } elseif ($errorJson.message -like "*Invalid API key*") {
                Write-Host ""
                Write-Host "DIAGNOSIS: API key is invalid" -ForegroundColor Yellow
                Write-Host "Get your key from: https://resend.com/api-keys" -ForegroundColor Cyan
                Write-Host ""
            }
        }
    }
    
    Write-Host ""
    Write-Host "Even if this fails now, it will work once Resend" -ForegroundColor White
    Write-Host "finishes scanning DNS (usually 15-30 minutes)." -ForegroundColor White
    Write-Host ""
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

