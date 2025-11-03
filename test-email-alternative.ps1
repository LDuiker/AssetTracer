# Test with different from addresses to diagnose issue

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$ToEmail = "mrlduiker@gmail.com"
)

Write-Host "`n=== Testing Different From Addresses ===" -ForegroundColor Cyan
Write-Host "This will try multiple 'from' addresses to find what works`n" -ForegroundColor Gray

# Test 1: With subdomain
Write-Host "Test 1: Using noreply@send.asset-tracer.com..." -ForegroundColor Yellow
$body1 = @{
    from = "noreply@send.asset-tracer.com"
    to = @($ToEmail)
    subject = "Test 1: Subdomain From"
    html = "<h1>Test 1</h1><p>Using noreply@send.asset-tracer.com</p>"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://api.resend.com/emails" -Method Post -Headers @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    } -Body $body1 -ErrorAction Stop
    
    Write-Host "  SUCCESS! Email sent with subdomain address" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "  Email ID: $($result.id)`n" -ForegroundColor White
    
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "  FAILED: $errorBody`n" -ForegroundColor Red
}

# Test 2: Without name
Write-Host "Test 2: Using onboarding@resend.dev (test domain)..." -ForegroundColor Yellow
$body2 = @{
    from = "onboarding@resend.dev"
    to = @($ToEmail)
    subject = "Test 2: Resend Test Domain"
    html = "<h1>Test 2</h1><p>Using resend.dev test domain</p>"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://api.resend.com/emails" -Method Post -Headers @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    } -Body $body2 -ErrorAction Stop
    
    Write-Host "  SUCCESS! Email sent with test domain" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "  Email ID: $($result.id)`n" -ForegroundColor White
    
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "  FAILED: $errorBody`n" -ForegroundColor Red
}

Write-Host "=== Analysis ===" -ForegroundColor Cyan
Write-Host "If Test 1 failed but Test 2 worked:" -ForegroundColor White
Write-Host "  -> API key needs to be domain-specific" -ForegroundColor White
Write-Host "  -> Create a new key linked ONLY to asset-tracer.com" -ForegroundColor White
Write-Host ""
Write-Host "If both failed:" -ForegroundColor White
Write-Host "  -> API key might be invalid or restricted" -ForegroundColor White
Write-Host "  -> Check Resend dashboard for key status" -ForegroundColor White
Write-Host ""

