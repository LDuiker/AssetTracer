# Simple Production Email Test for Resend

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$ToEmail = "mrlduiker@gmail.com"
)

Write-Host "`n=== Testing Production Email via Resend ===" -ForegroundColor Cyan
Write-Host "Sending test email to: $ToEmail`n" -ForegroundColor Yellow

$emailHtml = @"
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #10b981; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .checkmark { font-size: 48px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AssetTracer Email System</h1>
            <p style="margin: 0; font-size: 18px;">Production Test</p>
        </div>
        <div class="content">
            <div class="success">
                <div class="checkmark">✅</div>
                <h2 style="margin: 10px 0 0 0;">Email System Successfully Configured!</h2>
            </div>
            
            <p>Great news! Your AssetTracer email system is now fully operational.</p>
            
            <div class="details">
                <h3 style="margin-top: 0;">What is Working:</h3>
                <ul>
                    <li><strong>Domain Verified:</strong> send.asset-tracer.com</li>
                    <li><strong>SPF Record:</strong> Configured</li>
                    <li><strong>DKIM Record:</strong> Configured</li>
                    <li><strong>MX Record:</strong> Configured</li>
                    <li><strong>Email Deliverability:</strong> Ready</li>
                </ul>
            </div>
            
            <h3>You Can Now Send:</h3>
            <ul>
                <li>Invoice notifications to clients</li>
                <li>Quotation emails</li>
                <li>Team member invitations</li>
                <li>Password reset emails</li>
                <li>Weekly financial reports</li>
            </ul>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Update Vercel environment variables with production API key</li>
                <li>Deploy to production</li>
                <li>Test end-to-end email notifications in your app</li>
            </ol>
        </div>
    </div>
</body>
</html>
"@

$body = @{
    from = "AssetTracer <noreply@send.asset-tracer.com>"
    to = @($ToEmail)
    subject = "AssetTracer Email System is Live!"
    html = $emailHtml
} | ConvertTo-Json

try {
    Write-Host "Sending email..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method Post -Headers @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    } -Body $body
    
    Write-Host ""
    Write-Host "SUCCESS! Email sent!" -ForegroundColor Green
    Write-Host "Email ID: $($response.id)" -ForegroundColor White
    Write-Host ""
    Write-Host "Check your inbox at: $ToEmail" -ForegroundColor Cyan
    Write-Host "From: noreply@send.asset-tracer.com" -ForegroundColor White
    Write-Host "Subject: AssetTracer Email System is Live!" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to send email" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Details: $responseBody" -ForegroundColor Gray
    }
    Write-Host ""
}

