# Create Test Subscriptions PowerShell Script
# 
# This script creates test customers and subscriptions in Polar.sh
# for testing the AssetTracer billing integration.
# 
# Usage:
#   .\scripts\create-test-subscriptions.ps1
# Or with specific plan:
#   .\scripts\create-test-subscriptions.ps1 -Plan "pro"
#   .\scripts\create-test-subscriptions.ps1 -Plan "business"

param(
    [string]$Plan = "both"
)

# Load environment variables from .env.local
function Load-EnvFile {
    param([string]$Path)
    
    if (Test-Path $Path) {
        Get-Content $Path | ForEach-Object {
            if ($_ -match '^\s*([^#][^=]+)\s*=\s*(.+)\s*$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
}

# Load .env.local
$envPath = Join-Path $PSScriptRoot "..\..\.env.local"
if (Test-Path $envPath) {
    Load-EnvFile -Path $envPath
} else {
    Write-Host "⚠️  .env.local file not found at: $envPath" -ForegroundColor Yellow
    Write-Host "Please create .env.local with your Polar API credentials" -ForegroundColor Yellow
    exit 1
}

$POLAR_API_KEY = $env:POLAR_API_KEY
$POLAR_BASE_URL = if ($env:POLAR_BASE_URL) { $env:POLAR_BASE_URL } else { "https://api.polar.sh" }

# Product IDs from your configuration
$PRODUCTS = @{
    pro = "4bd7788b-d3dd-4f17-837a-3a5a56341b05"
    business = "bbb245ef-6915-4c75-b59f-f14d61abb414"
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("=" * 60)
    Write-Host $Title -ForegroundColor White
    Write-Host ("=" * 60)
    Write-Host ""
}

function Invoke-PolarAPI {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    $url = "$POLAR_BASE_URL$Endpoint"
    $headers = @{
        "Authorization" = "Bearer $POLAR_API_KEY"
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        throw "API Error ($statusCode): $errorMessage"
    }
}

function Test-APIConnection {
    Write-Section "🔌 Checking Polar API Connection"
    
    if (-not $POLAR_API_KEY) {
        Write-Host "❌ POLAR_API_KEY not found in environment variables!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please set POLAR_API_KEY in your .env.local file" -ForegroundColor Yellow
        return $false
    }
    
    $keyPreview = $POLAR_API_KEY.Substring(0, [Math]::Min(20, $POLAR_API_KEY.Length)) + "..."
    Write-Host "API Key: $keyPreview" -ForegroundColor Cyan
    Write-Host "Base URL: $POLAR_BASE_URL" -ForegroundColor Cyan
    
    try {
        $userInfo = Invoke-PolarAPI -Endpoint "/v1/oauth2/userinfo"
        Write-Host "✅ API connection successful!" -ForegroundColor Green
        
        $email = if ($userInfo.email) { $userInfo.email } else { $userInfo.id }
        Write-Host "Connected as: $email" -ForegroundColor Cyan
        return $true
    } catch {
        Write-Host "❌ API connection failed!" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Verify your POLAR_API_KEY in .env.local" -ForegroundColor Yellow
        Write-Host "2. Ensure you're using a test key: polar_sk_test_..." -ForegroundColor Yellow
        Write-Host "3. Check that your Polar.sh account is active" -ForegroundColor Yellow
        return $false
    }
}

function Get-Products {
    Write-Section "📦 Checking Products"
    
    try {
        $products = Invoke-PolarAPI -Endpoint "/v1/products"
        
        if ($products.Count -eq 0) {
            Write-Host "⚠️  No products found!" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "You need to create products in your Polar dashboard:" -ForegroundColor Yellow
            Write-Host "Pro Plan: $($PRODUCTS.pro)" -ForegroundColor Cyan
            Write-Host "Business Plan: $($PRODUCTS.business)" -ForegroundColor Cyan
            return $false
        }
        
        Write-Host "Found $($products.Count) product(s):" -ForegroundColor Green
        
        $hasProPlan = $false
        $hasBusinessPlan = $false
        
        foreach ($product in $products) {
            $isPro = $product.id -eq $PRODUCTS.pro
            $isBusiness = $product.id -eq $PRODUCTS.business
            
            if ($isPro) { $hasProPlan = $true }
            if ($isBusiness) { $hasBusinessPlan = $true }
            
            $marker = if ($isPro -or $isBusiness) { "✅" } else { "  " }
            Write-Host "$marker $($product.name) ($($product.id))" -ForegroundColor Cyan
            
            if ($product.prices -and $product.prices.Count -gt 0) {
                $price = $product.prices[0]
                $amount = $price.amount / 100
                Write-Host "   Price: `$$amount $($price.currency)" -ForegroundColor Cyan
            }
        }
        
        if (-not $hasProPlan) {
            Write-Host ""
            Write-Host "⚠️  Pro Plan product not found!" -ForegroundColor Yellow
            Write-Host "Expected ID: $($PRODUCTS.pro)" -ForegroundColor Yellow
        }
        
        if (-not $hasBusinessPlan) {
            Write-Host "⚠️  Business Plan product not found!" -ForegroundColor Yellow
            Write-Host "Expected ID: $($PRODUCTS.business)" -ForegroundColor Yellow
        }
        
        return ($hasProPlan -and $hasBusinessPlan)
    } catch {
        Write-Host "❌ Failed to fetch products" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        return $false
    }
}

function New-TestCustomer {
    param([string]$EmailSuffix = "")
    
    $timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    $email = if ($EmailSuffix) {
        "test-$EmailSuffix-$timestamp@example.com"
    } else {
        "test-$timestamp@example.com"
    }
    
    Write-Host "Creating customer: $email" -ForegroundColor Cyan
    
    try {
        $customerData = @{
            email = $email
            name = "Test User $timestamp"
            metadata = @{
                organization_id = "test-org-$timestamp"
                organization_name = "Test Organization"
                created_by_script = $true
                created_at = (Get-Date).ToString("o")
            }
        }
        
        $customer = Invoke-PolarAPI -Endpoint "/v1/customers" -Method "POST" -Body $customerData
        
        Write-Host "✅ Customer created successfully!" -ForegroundColor Green
        Write-Host "Customer ID: $($customer.id)" -ForegroundColor Cyan
        Write-Host "Email: $($customer.email)" -ForegroundColor Cyan
        
        return $customer
    } catch {
        Write-Host "❌ Failed to create customer" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        throw
    }
}

function New-TestSubscription {
    param(
        [string]$CustomerId,
        [string]$ProductId,
        [string]$PlanName
    )
    
    Write-Host ""
    Write-Host "Creating $PlanName subscription..." -ForegroundColor Cyan
    
    try {
        $subscriptionData = @{
            customer_id = $CustomerId
            product_id = $ProductId
            metadata = @{
                test = $true
                plan = $PlanName
                created_by_script = $true
                created_at = (Get-Date).ToString("o")
            }
        }
        
        $subscription = Invoke-PolarAPI -Endpoint "/v1/subscriptions" -Method "POST" -Body $subscriptionData
        
        Write-Host "✅ $PlanName subscription created successfully!" -ForegroundColor Green
        Write-Host "Subscription ID: $($subscription.id)" -ForegroundColor Cyan
        Write-Host "Status: $($subscription.status)" -ForegroundColor Cyan
        Write-Host "Product ID: $($subscription.product_id)" -ForegroundColor Cyan
        
        if ($subscription.current_period_start -and $subscription.current_period_end) {
            Write-Host "Period: $($subscription.current_period_start) to $($subscription.current_period_end)" -ForegroundColor Cyan
        }
        
        return $subscription
    } catch {
        Write-Host "❌ Failed to create $PlanName subscription" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        throw
    }
}

function Get-Subscriptions {
    Write-Section "📋 Listing Existing Subscriptions"
    
    try {
        $subscriptions = Invoke-PolarAPI -Endpoint "/v1/subscriptions"
        
        if ($subscriptions.Count -eq 0) {
            Write-Host "No subscriptions found" -ForegroundColor Yellow
            return
        }
        
        Write-Host "Found $($subscriptions.Count) subscription(s):" -ForegroundColor Green
        
        foreach ($sub in $subscriptions) {
            $status = if ($sub.status -eq "active") { "✅" } else { "⚠️ " }
            Write-Host "$status $($sub.id)" -ForegroundColor Cyan
            Write-Host "   Customer: $($sub.customer_id)" -ForegroundColor Cyan
            Write-Host "   Product: $($sub.product_id)" -ForegroundColor Cyan
            Write-Host "   Status: $($sub.status)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "❌ Failed to list subscriptions" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

# Main script
Write-Section "🚀 Polar Test Subscriptions Creator"

Write-Host "This script will create test customers and subscriptions" -ForegroundColor Cyan
Write-Host "in your Polar.sh sandbox environment." -ForegroundColor Cyan
Write-Host ""

# Determine which plans to create
$plansToCreate = @()

switch ($Plan.ToLower()) {
    "pro" {
        $plansToCreate = @(@{ name = "Pro"; id = $PRODUCTS.pro })
    }
    "business" {
        $plansToCreate = @(@{ name = "Business"; id = $PRODUCTS.business })
    }
    default {
        $plansToCreate = @(
            @{ name = "Pro"; id = $PRODUCTS.pro },
            @{ name = "Business"; id = $PRODUCTS.business }
        )
    }
}

try {
    # Step 1: Check API connection
    $connected = Test-APIConnection
    if (-not $connected) {
        exit 1
    }
    
    # Step 2: List existing subscriptions
    Get-Subscriptions
    
    # Step 3: Check products
    $productsExist = Get-Products
    if (-not $productsExist) {
        Write-Host ""
        Write-Host "⚠️  Required products not found in Polar dashboard!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please create the products first:" -ForegroundColor Yellow
        Write-Host "1. Go to https://polar.sh" -ForegroundColor Cyan
        Write-Host "2. Navigate to Products" -ForegroundColor Cyan
        Write-Host "3. Create products with these exact IDs:" -ForegroundColor Cyan
        Write-Host "   - Pro Plan: $($PRODUCTS.pro)" -ForegroundColor Cyan
        Write-Host "   - Business Plan: $($PRODUCTS.business)" -ForegroundColor Cyan
        exit 1
    }
    
    # Step 4: Create subscriptions
    Write-Section "📝 Creating Test Subscriptions"
    
    $results = @()
    
    foreach ($planConfig in $plansToCreate) {
        try {
            Write-Host ""
            Write-Host "--- Creating $($planConfig.name) Plan Subscription ---" -ForegroundColor White
            Write-Host ""
            
            # Create customer
            $customer = New-TestCustomer -EmailSuffix $planConfig.name.ToLower()
            
            # Create subscription
            $subscription = New-TestSubscription -CustomerId $customer.id -ProductId $planConfig.id -PlanName $planConfig.name
            
            $results += @{
                plan = $planConfig.name
                customer = $customer
                subscription = $subscription
                success = $true
            }
            
            Write-Host ""
            Write-Host "✅ $($planConfig.name) subscription created successfully!" -ForegroundColor Green
            Write-Host ""
        } catch {
            $results += @{
                plan = $planConfig.name
                success = $false
                error = $_.Exception.Message
            }
            Write-Host ""
            Write-Host "❌ Failed to create $($planConfig.name) subscription" -ForegroundColor Red
            Write-Host ""
        }
    }
    
    # Summary
    Write-Section "📊 Summary"
    
    $successful = ($results | Where-Object { $_.success }).Count
    $failed = ($results | Where-Object { -not $_.success }).Count
    
    Write-Host "Total: $($results.Count)" -ForegroundColor Cyan
    Write-Host "Successful: $successful" -ForegroundColor Green
    
    if ($failed -gt 0) {
        Write-Host "Failed: $failed" -ForegroundColor Red
    } else {
        Write-Host "Failed: $failed" -ForegroundColor Cyan
    }
    
    if ($successful -gt 0) {
        Write-Host ""
        Write-Host "✨ Test subscriptions created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor White
        Write-Host "1. Check your Polar dashboard: https://polar.sh" -ForegroundColor Cyan
        Write-Host "2. Verify subscriptions appear in your dashboard" -ForegroundColor Cyan
        Write-Host "3. Test webhooks if configured" -ForegroundColor Cyan
        Write-Host "4. Verify database updates in Supabase" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "Created subscriptions:" -ForegroundColor White
        
        foreach ($result in ($results | Where-Object { $_.success })) {
            Write-Host ""
            Write-Host "$($result.plan) Plan:" -ForegroundColor Yellow
            Write-Host "  Customer ID: $($result.customer.id)" -ForegroundColor Cyan
            Write-Host "  Email: $($result.customer.email)" -ForegroundColor Cyan
            Write-Host "  Subscription ID: $($result.subscription.id)" -ForegroundColor Cyan
            Write-Host "  Status: $($result.subscription.status)" -ForegroundColor Cyan
        }
    }
    
    if ($failed -gt 0) {
        Write-Host ""
        Write-Host "❌ Some subscriptions failed to create:" -ForegroundColor Red
        foreach ($result in ($results | Where-Object { -not $_.success })) {
            Write-Host "$($result.plan): $($result.error)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Script failed with error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Stack trace:" -ForegroundColor Yellow
    Write-Host $_.Exception.StackTrace -ForegroundColor Yellow
    exit 1
}

