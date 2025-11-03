# Debug Email Sending - Shows Full Error Details

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$ToEmail = "mrlduiker@gmail.com"
)

Write-Host "`n=== Resend Email Debug Test ===" -ForegroundColor Cyan
Write-Host "API Key: $($ApiKey.Substring(0,10))..." -ForegroundColor Gray
Write-Host "To: $ToEmail`n" -ForegroundColor Gray

$body = @{
    from = "AssetTracer <noreply@send.asset-tracer.com>"
    to = @($ToEmail)
    subject = "Test Email from AssetTracer"
    html = "<h1>Test Email</h1><p>This is a test email from your verified domain.</p>"
}

$jsonBody = $body | ConvertTo-Json -Depth 10

Write-Host "Request Details:" -ForegroundColor Yellow
Write-Host "URL: https://api.resend.com/emails" -ForegroundColor White
Write-Host "Method: POST" -ForegroundColor White
Write-Host "From: $($body.from)" -ForegroundColor White
Write-Host "To: $($body.to)" -ForegroundColor White
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "https://api.resend.com/emails" -Method Post -Headers @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    } -Body $jsonBody -ErrorAction Stop
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Email ID: $($result.id)" -ForegroundColor White
    Write-Host ""
    Write-Host "Check your inbox at: $ToEmail" -ForegroundColor Cyan
    
} catch {
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
        
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "Error Response:" -ForegroundColor Yellow
        Write-Host $errorBody -ForegroundColor White
        Write-Host ""
        
        try {
            $errorJson = $errorBody | ConvertFrom-Json
            if ($errorJson.message) {
                Write-Host "Error Message: $($errorJson.message)" -ForegroundColor Red
            }
            if ($errorJson.name) {
                Write-Host "Error Type: $($errorJson.name)" -ForegroundColor Red
            }
        } catch {
            # Not JSON, just show raw
        }
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=== Possible Issues ===" -ForegroundColor Cyan
    Write-Host "1. API key doesn't have 'Sending access' permission" -ForegroundColor White
    Write-Host "2. API key is not linked to asset-tracer.com domain" -ForegroundColor White
    Write-Host "3. API key was created before domain verification" -ForegroundColor White
    Write-Host "4. Domain verification status changed" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://resend.com/api-keys" -ForegroundColor White
    Write-Host "2. Delete the current API key" -ForegroundColor White
    Write-Host "3. Create a NEW key with 'Sending access'" -ForegroundColor White
    Write-Host "4. Make sure to select 'asset-tracer.com' as the domain" -ForegroundColor White
    Write-Host ""
}

