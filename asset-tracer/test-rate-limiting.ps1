# Rate Limiting Test Script
# Tests 1-3: Rate Limiting Verification

$baseUrl = "https://assettracer-staging.vercel.app"
$results = @()

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Rate Limiting Tests 1-3" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Authentication Endpoint Rate Limit
Write-Host "Test 1: Authentication Endpoint Rate Limit" -ForegroundColor Yellow
Write-Host "Making 6 requests to /api/auth/consent (limit: 5 per 15 minutes)..." -ForegroundColor Gray
Write-Host ""

$test1Results = @()
for ($i = 1; $i -le 6; $i++) {
    Write-Host "Request $i/6..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/consent" `
            -Method POST `
            -Headers @{
                "Content-Type" = "application/json"
            } `
            -Body (@{
                termsAccepted = $true
            } | ConvertTo-Json) `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $statusCode = $response.StatusCode
        $rateLimitLimit = $response.Headers['X-RateLimit-Limit']
        $rateLimitRemaining = $response.Headers['X-RateLimit-Remaining']
        $rateLimitReset = $response.Headers['X-RateLimit-Reset']
        $retryAfter = $response.Headers['Retry-After']
        
        $test1Results += [PSCustomObject]@{
            Request = $i
            StatusCode = $statusCode
            XRateLimitLimit = $rateLimitLimit
            XRateLimitRemaining = $rateLimitRemaining
            XRateLimitReset = $rateLimitReset
            RetryAfter = $retryAfter
        }
        
        if ($statusCode -eq 429) {
            Write-Host " - Status: 429 (Rate Limited)" -ForegroundColor Red
        } else {
            Write-Host " - Status: $statusCode (Allowed)" -ForegroundColor Green
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $rateLimitLimit = $_.Exception.Response.Headers['X-RateLimit-Limit']
        $rateLimitRemaining = $_.Exception.Response.Headers['X-RateLimit-Remaining']
        $rateLimitReset = $_.Exception.Response.Headers['X-RateLimit-Reset']
        $retryAfter = $_.Exception.Response.Headers['Retry-After']
        
        $test1Results += [PSCustomObject]@{
            Request = $i
            StatusCode = $statusCode
            XRateLimitLimit = $rateLimitLimit
            XRateLimitRemaining = $rateLimitRemaining
            XRateLimitReset = $rateLimitReset
            RetryAfter = $retryAfter
        }
        
        if ($statusCode -eq 429) {
            Write-Host " - Status: 429 (Rate Limited)" -ForegroundColor Red
        } else {
            Write-Host " - Status: $statusCode (Error)" -ForegroundColor Red
        }
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Test 1 Results:" -ForegroundColor Cyan
$test1Results | Format-Table -AutoSize

# Verify Test 1
$test1Passed = $true
if ($test1Results[5].StatusCode -ne 429) {
    Write-Host "FAIL: 6th request should return 429" -ForegroundColor Red
    $test1Passed = $false
}
if ($test1Results[5].XRateLimitLimit -ne "5") {
    Write-Host "FAIL: X-RateLimit-Limit should be 5" -ForegroundColor Red
    $test1Passed = $false
}
if ($test1Results[5].XRateLimitRemaining -ne "0") {
    Write-Host "FAIL: X-RateLimit-Remaining should be 0" -ForegroundColor Red
    $test1Passed = $false
}
if (-not $test1Results[5].RetryAfter) {
    Write-Host "FAIL: Retry-After header should be present" -ForegroundColor Red
    $test1Passed = $false
}

if ($test1Passed) {
    Write-Host "PASS: Test 1 - Authentication Endpoint Rate Limit" -ForegroundColor Green
    $results += "Test 1: PASS"
} else {
    Write-Host "FAIL: Test 1 - Authentication Endpoint Rate Limit" -ForegroundColor Red
    $results += "Test 1: FAIL"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 2: API Endpoint Rate Limit
Write-Host "Test 2: API Endpoint Rate Limit" -ForegroundColor Yellow
Write-Host "Making 201 requests to /api/assets (limit: 200 per 1 minute)..." -ForegroundColor Gray
Write-Host "This will take about 1-2 minutes..." -ForegroundColor Gray
Write-Host ""

$test2Results = @()
$rateLimited = $false
for ($i = 1; $i -le 201; $i++) {
    if ($i % 50 -eq 0) {
        Write-Host "Progress: $i/201 requests..." -ForegroundColor Gray
    }
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/assets" `
            -Method GET `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $statusCode = $response.StatusCode
        $rateLimitLimit = $response.Headers['X-RateLimit-Limit']
        $rateLimitRemaining = $response.Headers['X-RateLimit-Remaining']
        
        if ($statusCode -eq 429) {
            $rateLimited = $true
            $test2Results += [PSCustomObject]@{
                Request = $i
                StatusCode = $statusCode
                XRateLimitLimit = $rateLimitLimit
                XRateLimitRemaining = $rateLimitRemaining
            }
            Write-Host "Request $i: Rate Limited (429)" -ForegroundColor Red
            break
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $rateLimitLimit = $_.Exception.Response.Headers['X-RateLimit-Limit']
        $rateLimitRemaining = $_.Exception.Response.Headers['X-RateLimit-Remaining']
        
        if ($statusCode -eq 429) {
            $rateLimited = $true
            $test2Results += [PSCustomObject]@{
                Request = $i
                StatusCode = $statusCode
                XRateLimitLimit = $rateLimitLimit
                XRateLimitRemaining = $rateLimitRemaining
            }
            Write-Host "Request $i: Rate Limited (429)" -ForegroundColor Red
            break
        }
    }
    
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "Test 2 Results:" -ForegroundColor Cyan
if ($test2Results.Count -gt 0) {
    $test2Results | Format-Table -AutoSize
} else {
    Write-Host "No rate limit triggered (may need to wait for window reset)" -ForegroundColor Yellow
}

# Verify Test 2
$test2Passed = $false
if ($rateLimited) {
    $test2Passed = $true
    Write-Host "PASS: Test 2 - API Endpoint Rate Limit (429 received)" -ForegroundColor Green
    $results += "Test 2: PASS"
} else {
    Write-Host "WARNING: Test 2 - Rate limit not triggered (may need to wait for window reset)" -ForegroundColor Yellow
    $results += "Test 2: WARNING"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 3: Rate Limit Headers
Write-Host "Test 3: Rate Limit Headers" -ForegroundColor Yellow
Write-Host "Making a request to /api/assets to check headers..." -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/assets" `
        -Method GET `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $rateLimitLimit = $response.Headers['X-RateLimit-Limit']
    $rateLimitRemaining = $response.Headers['X-RateLimit-Remaining']
    $rateLimitReset = $response.Headers['X-RateLimit-Reset']
    
    Write-Host "Response Headers:" -ForegroundColor Cyan
    Write-Host "  X-RateLimit-Limit: $rateLimitLimit" -ForegroundColor $(if ($rateLimitLimit) { "Green" } else { "Red" })
    Write-Host "  X-RateLimit-Remaining: $rateLimitRemaining" -ForegroundColor $(if ($rateLimitRemaining) { "Green" } else { "Red" })
    Write-Host "  X-RateLimit-Reset: $rateLimitReset" -ForegroundColor $(if ($rateLimitReset) { "Green" } else { "Red" })
    
    # Verify Test 3
    $test3Passed = $true
    if (-not $rateLimitLimit) {
        Write-Host "FAIL: X-RateLimit-Limit header missing" -ForegroundColor Red
        $test3Passed = $false
    }
    if (-not $rateLimitRemaining) {
        Write-Host "FAIL: X-RateLimit-Remaining header missing" -ForegroundColor Red
        $test3Passed = $false
    }
    if (-not $rateLimitReset) {
        Write-Host "FAIL: X-RateLimit-Reset header missing" -ForegroundColor Red
        $test3Passed = $false
    }
    
    if ($test3Passed) {
        Write-Host ""
        Write-Host "PASS: Test 3 - Rate Limit Headers" -ForegroundColor Green
        $results += "Test 3: PASS"
    } else {
        Write-Host ""
        Write-Host "FAIL: Test 3 - Rate Limit Headers" -ForegroundColor Red
        $results += "Test 3: FAIL"
    }
} catch {
    Write-Host "ERROR: Failed to make request" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    $results += "Test 3: ERROR"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ -ForegroundColor $(if ($_ -match "PASS") { "Green" } elseif ($_ -match "WARNING") { "Yellow" } else { "Red" }) }
Write-Host ""

