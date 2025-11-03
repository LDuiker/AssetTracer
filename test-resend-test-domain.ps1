# Test if API key works at all with Resend test domain

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

Write-Host "`n=== Testing API Key with Resend Test Domain ===" -ForegroundColor Cyan
Write-Host "This tests if the API key works at all`n" -ForegroundColor Gray

$body = @{
    from = "onboarding@resend.dev"
    to = @("delivered@resend.dev")
    subject = "Test - Resend Test Domain"
    html = "<h1>API Key Test</h1><p>Testing if API key works with test domain</p>"
} | ConvertTo-Json

Write-Host "Sending test email..." -ForegroundColor Yellow
Write-Host "From: onboarding@resend.dev" -ForegroundColor White
Write-Host "To: delivered@resend.dev (Resend test inbox)`n" -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "https://api.resend.com/emails" -Method Post -Headers @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    } -Body $body -ErrorAction Stop
    
    Write-Host "SUCCESS! API key is valid and working!" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Email ID: $($result.id)`n" -ForegroundColor White
    
    Write-Host "=== Conclusion ===" -ForegroundColor Cyan
    Write-Host "Your API key works, but there's an issue with your verified domain." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Possible causes:" -ForegroundColor White
    Write-Host "1. API key is not linked to asset-tracer.com in Resend dashboard" -ForegroundColor White
    Write-Host "2. Domain verification status changed" -ForegroundColor White
    Write-Host "3. The 'from' email address format is incorrect" -ForegroundColor White
    Write-Host ""
    Write-Host "Next step: Check Resend dashboard to see which domain this key is linked to" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "FAILED! API key itself has issues." -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error: $errorBody`n" -ForegroundColor Yellow
    }
    
    Write-Host "=== Conclusion ===" -ForegroundColor Cyan
    Write-Host "The API key is invalid or restricted." -ForegroundColor Red
    Write-Host ""
    Write-Host "Action required:" -ForegroundColor White
    Write-Host "1. Go to https://resend.com/api-keys" -ForegroundColor White
    Write-Host "2. Create a completely NEW API key" -ForegroundColor White
    Write-Host "3. Permission: 'Sending access'" -ForegroundColor White
    Write-Host "4. Domain: 'asset-tracer.com'" -ForegroundColor White
    Write-Host ""
}

