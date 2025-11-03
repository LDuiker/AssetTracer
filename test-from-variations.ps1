# Test different "from" address variations with verified domain

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$ToEmail = "mrlduiker@gmail.com"
)

Write-Host "`n=== Testing Different From Address Formats ===" -ForegroundColor Cyan
Write-Host "API Key: $($ApiKey.Substring(0,10))..." -ForegroundColor Gray
Write-Host "To: $ToEmail`n" -ForegroundColor Gray

# Test 1: Just email, no name
Write-Host "Test 1: noreply@send.asset-tracer.com (no display name)" -ForegroundColor Yellow
$body1 = @{
    from = "noreply@send.asset-tracer.com"
    to = @($ToEmail)
    subject = "Test 1 - No Display Name"
    html = "<h1>Test 1</h1><p>From address without display name</p>"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://api.resend.com/emails" -Method Post -Headers @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    } -Body $body1 -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "  SUCCESS! Email ID: $($result.id)`n" -ForegroundColor Green
    return
    
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "  FAILED: $errorBody`n" -ForegroundColor Red
}

# Test 2: Root domain
Write-Host "Test 2: noreply@asset-tracer.com (root domain)" -ForegroundColor Yellow
$body2 = @{
    from = "noreply@asset-tracer.com"
    to = @($ToEmail)
    subject = "Test 2 - Root Domain"
    html = "<h1>Test 2</h1><p>From root domain</p>"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://api.resend.com/emails" -Method Post -Headers @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    } -Body $body2 -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "  SUCCESS! Email ID: $($result.id)`n" -ForegroundColor Green
    return
    
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "  FAILED: $errorBody`n" -ForegroundColor Red
}

# Test 3: Different name format
Write-Host "Test 3: info@send.asset-tracer.com" -ForegroundColor Yellow
$body3 = @{
    from = "info@send.asset-tracer.com"
    to = @($ToEmail)
    subject = "Test 3 - Info Address"
    html = "<h1>Test 3</h1><p>From info@ address</p>"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://api.resend.com/emails" -Method Post -Headers @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    } -Body $body3 -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "  SUCCESS! Email ID: $($result.id)`n" -ForegroundColor Green
    return
    
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "  FAILED: $errorBody`n" -ForegroundColor Red
}

Write-Host "=== All Tests Failed ===" -ForegroundColor Red
Write-Host ""
Write-Host "This suggests the API key is still not properly configured." -ForegroundColor Yellow
Write-Host ""
Write-Host "Can you check in Resend dashboard:" -ForegroundColor Cyan
Write-Host "1. Go to https://resend.com/api-keys" -ForegroundColor White
Write-Host "2. Find key: re_ZQtLpG7m..." -ForegroundColor White
Write-Host "3. What does the 'Domain' column say exactly?" -ForegroundColor White
Write-Host "4. Take a screenshot and share it" -ForegroundColor White
Write-Host ""

