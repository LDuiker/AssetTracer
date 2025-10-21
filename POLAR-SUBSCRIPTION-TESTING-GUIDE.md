# Polar Subscription Testing Guide

Complete guide for creating and testing subscriptions using Polar.sh dashboard and API.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Product IDs Configuration](#product-ids-configuration)
3. [Method 1: Testing via Dashboard UI](#method-1-testing-via-dashboard-ui)
4. [Method 2: Testing via API](#method-2-testing-via-api)
5. [Method 3: Testing via AssetTracer App](#method-3-testing-via-assettracer-app)
6. [Webhook Testing](#webhook-testing)
7. [Verification Steps](#verification-steps)
8. [Test Scenarios](#test-scenarios)
9. [Troubleshooting](#troubleshooting)

---

## 🔑 Prerequisites

### 1. Polar.sh Account Setup

Ensure you have:
- ✅ Polar.sh account created (https://polar.sh)
- ✅ Sandbox/Test mode enabled
- ✅ API credentials obtained:
  - `POLAR_API_KEY` (starts with `polar_sk_test_`)
  - `POLAR_WEBHOOK_SECRET` (starts with `whsec_`)
  - `NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY` (starts with `polar_pk_test_`)

### 2. Environment Variables

Verify your `.env.local` file in the `asset-tracer` directory:

```bash
# Polar.sh Configuration
POLAR_API_KEY=polar_sk_test_your_actual_key_here
POLAR_BASE_URL=https://api.polar.sh
POLAR_WEBHOOK_SECRET=whsec_your_actual_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY=polar_pk_test_your_actual_key_here

# Supabase (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Server Running

Ensure your development server is running:

```powershell
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"
npm run dev -- -p 3000
```

---

## 🎯 Product IDs Configuration

Your AssetTracer application is configured with these product IDs:

### Pro Plan
- **Product ID**: `4bd7788b-d3dd-4f17-837a-3a5a56341b05`
- **Name**: Pro Plan Monthly
- **Price**: $19.00 USD
- **Billing**: Monthly

### Business Plan
- **Product ID**: `bbb245ef-6915-4c75-b59f-f14d61abb414`
- **Name**: Business Plan Monthly
- **Price**: $39.00 USD
- **Billing**: Monthly

**IMPORTANT**: These exact product IDs must exist in your Polar.sh dashboard for subscriptions to work!

---

## 📊 Method 1: Testing via Dashboard UI

### Step 1: Create Products in Polar Dashboard

1. **Log into Polar.sh Dashboard**:
   - Go to https://polar.sh
   - Ensure you're in **Sandbox/Test Mode**

2. **Navigate to Products**:
   - Click on "Products" in the sidebar
   - Click "Create Product" button

3. **Create Pro Plan**:
   ```
   Product Name: Pro Plan Monthly
   Product ID: 4bd7788b-d3dd-4f17-837a-3a5a56341b05
   Description: Professional features for growing businesses
   Price: $19.00 USD
   Billing Interval: Monthly
   Type: Recurring Subscription
   Status: Active
   ```

4. **Create Business Plan**:
   ```
   Product Name: Business Plan Monthly
   Product ID: bbb245ef-6915-4c75-b59f-f14d61abb414
   Description: Advanced features for established businesses
   Price: $39.00 USD
   Billing Interval: Monthly
   Type: Recurring Subscription
   Status: Active
   ```

### Step 2: Create Test Customer

1. **Navigate to Customers**:
   - Click on "Customers" in the sidebar
   - Click "Add Customer" button

2. **Fill Customer Details**:
   ```
   Email: test@example.com
   Name: Test User
   Metadata (optional):
     organization_id: test-org-123
     organization_name: Test Organization
   ```

3. **Save Customer**:
   - Note down the Customer ID (you'll need it for subscriptions)

### Step 3: Create Test Subscription

1. **Navigate to Subscriptions**:
   - Click on "Subscriptions" in the sidebar
   - Click "Create Subscription" button

2. **Fill Subscription Details**:
   ```
   Customer: Select the test customer you created
   Product: Select "Pro Plan Monthly" or "Business Plan Monthly"
   Start Date: Today's date
   Trial Period: None (or set if testing trials)
   Payment Method: Use test card (see below)
   ```

3. **Test Credit Cards**:
   Use these test card numbers:
   ```
   Visa Success: 4242 4242 4242 4242
   Visa Decline: 4000 0000 0000 0002
   Mastercard: 5555 5555 5555 4444
   
   Expiry: Any future date (e.g., 12/25)
   CVC: Any 3 digits (e.g., 123)
   ZIP: Any valid ZIP (e.g., 12345)
   ```

4. **Complete Subscription**:
   - Click "Create Subscription"
   - Verify subscription status shows as "Active"

---

## 🔧 Method 2: Testing via API

### Step 1: Test API Connection

1. **Open PowerShell** in your project directory:
   ```powershell
   cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"
   ```

2. **Test API endpoint**:
   ```powershell
   # Method 1: Using curl (if available)
   curl http://localhost:3000/api/test-polar-direct
   
   # Method 2: Using PowerShell
   Invoke-WebRequest -Uri "http://localhost:3000/api/test-polar-direct" -Method GET
   ```

   Expected response:
   ```json
   {
     "success": true,
     "message": "Direct API call successful!",
     "data": { /* user info */ }
   }
   ```

### Step 2: Create Subscription via API

Create a test script to create subscriptions:

1. **Create test file** `test-subscription.js`:
   ```javascript
   // Save this as: asset-tracer/scripts/test-subscription.js
   
   const POLAR_API_KEY = process.env.POLAR_API_KEY;
   const POLAR_BASE_URL = 'https://api.polar.sh';
   
   // Product IDs from your configuration
   const PRODUCTS = {
     pro: '4bd7788b-d3dd-4f17-837a-3a5a56341b05',
     business: 'bbb245ef-6915-4c75-b59f-f14d61abb414'
   };
   
   async function createTestCustomer() {
     const response = await fetch(`${POLAR_BASE_URL}/v1/customers`, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${POLAR_API_KEY}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         email: 'test@example.com',
         name: 'Test User',
         metadata: {
           organization_id: 'test-org-' + Date.now(),
           organization_name: 'Test Organization'
         }
       })
     });
     
     if (!response.ok) {
       const error = await response.text();
       throw new Error(`Failed to create customer: ${error}`);
     }
     
     return await response.json();
   }
   
   async function createTestSubscription(customerId, productId) {
     const response = await fetch(`${POLAR_BASE_URL}/v1/subscriptions`, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${POLAR_API_KEY}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         customer_id: customerId,
         product_id: productId,
         metadata: {
           test: true,
           created_at: new Date().toISOString()
         }
       })
     });
     
     if (!response.ok) {
       const error = await response.text();
       throw new Error(`Failed to create subscription: ${error}`);
     }
     
     return await response.json();
   }
   
   async function main() {
     try {
       console.log('Creating test customer...');
       const customer = await createTestCustomer();
       console.log('✅ Customer created:', customer.id);
       
       console.log('\nCreating Pro subscription...');
       const proSub = await createTestSubscription(customer.id, PRODUCTS.pro);
       console.log('✅ Pro subscription created:', proSub.id);
       
       console.log('\n✨ Test subscriptions created successfully!');
       console.log('\nCustomer ID:', customer.id);
       console.log('Subscription ID:', proSub.id);
     } catch (error) {
       console.error('❌ Error:', error.message);
     }
   }
   
   main();
   ```

2. **Run the test script**:
   ```powershell
   node scripts/test-subscription.js
   ```

### Step 3: Using PowerShell to Create Subscription

Alternatively, use PowerShell directly:

```powershell
# Set your API key
$POLAR_API_KEY = "your_polar_api_key_here"
$BASE_URL = "https://api.polar.sh"

# Create customer
$customerBody = @{
    email = "test@example.com"
    name = "Test User"
    metadata = @{
        organization_id = "test-org-123"
    }
} | ConvertTo-Json

$customer = Invoke-RestMethod -Uri "$BASE_URL/v1/customers" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $POLAR_API_KEY"
        "Content-Type" = "application/json"
    } `
    -Body $customerBody

Write-Host "Customer created: $($customer.id)"

# Create subscription
$subscriptionBody = @{
    customer_id = $customer.id
    product_id = "4bd7788b-d3dd-4f17-837a-3a5a56341b05"  # Pro plan
} | ConvertTo-Json

$subscription = Invoke-RestMethod -Uri "$BASE_URL/v1/subscriptions" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $POLAR_API_KEY"
        "Content-Type" = "application/json"
    } `
    -Body $subscriptionBody

Write-Host "Subscription created: $($subscription.id)"
```

---

## 🖥️ Method 3: Testing via AssetTracer App

### Step 1: Login to AssetTracer

1. **Open your browser**:
   - Navigate to http://localhost:3000
   - Login with your test account

2. **Navigate to Settings**:
   - Click on your profile/avatar
   - Click "Settings" or navigate to `/settings`

### Step 2: Upgrade Subscription

1. **Go to Billing Tab**:
   - Click on the "Billing" or "Subscription" tab
   - You should see your current plan (Free)

2. **Click Upgrade**:
   - Click "Upgrade to Pro" or "Upgrade to Business"
   - You'll be redirected to Polar checkout

3. **Complete Checkout**:
   - Use test credit card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - Complete the payment

4. **Verify Upgrade**:
   - After successful payment, you'll be redirected back
   - Your subscription tier should update automatically

### Step 3: Monitor the Flow

**Open Browser Console** (F12) to see:
- API calls to `/api/subscription/upgrade`
- Redirect to Polar checkout
- Return to success URL

**Check Server Logs** to see:
- Checkout session creation
- Webhook events received
- Database updates

---

## 🔔 Webhook Testing

### Step 1: Configure Webhook in Polar Dashboard

1. **Navigate to Webhooks**:
   - Go to Polar.sh dashboard
   - Click "Webhooks" in sidebar
   - Click "Add Webhook"

2. **For Local Testing - Use ngrok**:
   
   ```powershell
   # Install ngrok (if not installed)
   npm install -g ngrok
   
   # Expose local server
   ngrok http 3000
   ```
   
   Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

3. **Set Webhook URL**:
   ```
   URL: https://abc123.ngrok.io/api/webhooks/polar
   OR
   URL: http://localhost:3000/api/webhooks/polar (for testing only)
   
   Description: AssetTracer Subscription Webhooks
   ```

4. **Select Events**:
   ```
   ✅ subscription.created
   ✅ subscription.updated
   ✅ subscription.canceled
   ✅ subscription.payment_succeeded
   ✅ subscription.payment_failed
   ✅ customer.created
   ✅ customer.updated
   ```

5. **Save and Copy Secret**:
   - Copy the webhook secret
   - Add it to your `.env.local`:
     ```bash
     POLAR_WEBHOOK_SECRET=whsec_your_webhook_secret
     ```

### Step 2: Test Webhook Delivery

1. **Use Polar Dashboard Test Tool**:
   - In webhook settings, click "Send Test Event"
   - Select event type (e.g., `subscription.created`)
   - Click "Send"

2. **Check Server Logs**:
   ```powershell
   # Your server logs should show:
   Received Polar webhook: subscription.created
   Subscription created for organization xxx, tier: pro
   ```

3. **Verify Database Updates**:
   - Check your Supabase dashboard
   - Look at the `organizations` table
   - Verify fields are updated:
     - `polar_subscription_id`
     - `subscription_tier`
     - `subscription_status`
     - `polar_current_period_start`
     - `polar_current_period_end`

---

## ✅ Verification Steps

### 1. Verify API Connection

```powershell
# Test API directly
Invoke-WebRequest -Uri "http://localhost:3000/api/test-polar-direct"
```

Expected: `"success": true`

### 2. Verify Products Exist

Check in Polar dashboard:
- ✅ Pro plan exists with ID: `4bd7788b-d3dd-4f17-837a-3a5a56341b05`
- ✅ Business plan exists with ID: `bbb245ef-6915-4c75-b59f-f14d61abb414`
- ✅ Both products are "Active"

### 3. Verify Database Schema

Check Supabase `organizations` table has these columns:
```sql
- polar_customer_id
- polar_subscription_id
- polar_product_id
- polar_subscription_status
- subscription_tier
- subscription_status
- subscription_start_date
- subscription_end_date
- polar_current_period_start
- polar_current_period_end
- polar_metadata
```

### 4. Verify Webhook Handling

1. Create a test subscription
2. Check server logs for webhook events
3. Verify database updates
4. Check organization tier updated

---

## 🧪 Test Scenarios

### Scenario 1: New Subscription (Happy Path)

1. **Action**: User upgrades to Pro plan
2. **Expected Flow**:
   ```
   User clicks "Upgrade to Pro"
   → API creates checkout session
   → User completes payment
   → Webhook: subscription.created
   → Database: tier = "pro", status = "active"
   → User redirected to success page
   ```

3. **Verification**:
   - ✅ Organization tier updated to "pro"
   - ✅ Subscription status is "active"
   - ✅ Polar subscription ID stored
   - ✅ Billing dates set correctly

### Scenario 2: Subscription Upgrade

1. **Action**: Pro user upgrades to Business
2. **Expected Flow**:
   ```
   User clicks "Upgrade to Business"
   → API creates new checkout session
   → User completes payment
   → Webhook: subscription.updated
   → Database: tier = "business"
   ```

3. **Verification**:
   - ✅ Tier changed from "pro" to "business"
   - ✅ Product ID updated
   - ✅ New billing period set

### Scenario 3: Payment Failed

1. **Action**: Use declined test card `4000 0000 0000 0002`
2. **Expected Flow**:
   ```
   User attempts payment
   → Payment fails
   → Webhook: subscription.payment_failed
   → Database: status = "past_due"
   ```

3. **Verification**:
   - ✅ Subscription status = "past_due"
   - ✅ User notified of payment failure
   - ✅ Access may be restricted

### Scenario 4: Subscription Cancellation

1. **Action**: User cancels subscription
2. **Expected Flow**:
   ```
   User clicks "Cancel Subscription"
   → API calls Polar cancel endpoint
   → Webhook: subscription.canceled
   → Database: tier = "free", status = "inactive"
   ```

3. **Verification**:
   - ✅ Tier reverted to "free"
   - ✅ Status set to "inactive"
   - ✅ End date preserved

### Scenario 5: Webhook Replay

1. **Action**: Send same webhook event twice
2. **Expected**: Idempotent handling (no duplicate updates)

---

## 🐛 Troubleshooting

### Issue: "Product not found"

**Symptoms**:
```
Error: Failed to create checkout session
Details: Product not found
```

**Solutions**:
1. ✅ Verify product IDs match exactly:
   - Pro: `4bd7788b-d3dd-4f17-837a-3a5a56341b05`
   - Business: `bbb245ef-6915-4c75-b59f-f14d61abb414`

2. ✅ Check products exist in Polar dashboard
3. ✅ Ensure products are "Active"
4. ✅ Verify you're using correct environment (sandbox vs production)

### Issue: "Invalid API key"

**Symptoms**:
```
Error: 401 Unauthorized
Polar API error: Invalid API key
```

**Solutions**:
1. ✅ Check API key in `.env.local`
2. ✅ Ensure using test key: `polar_sk_test_...`
3. ✅ Verify key hasn't expired
4. ✅ Restart server after updating `.env.local`

### Issue: Webhooks not received

**Symptoms**:
- Subscription created but database not updated
- No webhook logs in server

**Solutions**:
1. ✅ Use ngrok for local testing:
   ```powershell
   ngrok http 3000
   ```
2. ✅ Update webhook URL in Polar dashboard
3. ✅ Verify webhook secret matches
4. ✅ Check firewall/network settings
5. ✅ Look at Polar dashboard webhook logs

### Issue: Database not updating

**Symptoms**:
- Webhooks received but tier not changing
- Organization fields not updated

**Solutions**:
1. ✅ Check `polar_customer_id` exists in organization
2. ✅ Verify webhook handler is finding organization
3. ✅ Check server logs for errors
4. ✅ Verify database permissions
5. ✅ Ensure product ID mapping is correct

### Issue: Checkout redirect fails

**Symptoms**:
- User stuck on checkout page
- Success URL not working

**Solutions**:
1. ✅ Verify `NEXT_PUBLIC_APP_URL` in `.env.local`
2. ✅ Check success URL format:
   ```
   ${NEXT_PUBLIC_APP_URL}/settings?tab=billing&success=true
   ```
3. ✅ Ensure URL is accessible
4. ✅ Check browser console for errors

---

## 📊 Monitoring & Logging

### Server Logs to Monitor

```bash
# Checkout session creation
Polar Client initialized: { hasApiKey: true, ... }
Creating checkout session...
Checkout URL: https://checkout.polar.sh/...

# Webhook events
Received Polar webhook: subscription.created
Organization not found for customer: xxx (if error)
Subscription created for organization xxx, tier: pro

# Database updates
Updating organization: xxx
Updated fields: tier, status, subscription_id
```

### Polar Dashboard Monitoring

1. **Subscriptions Tab**:
   - View all test subscriptions
   - Check subscription status
   - View payment history

2. **Webhooks Tab**:
   - See webhook delivery logs
   - Check success/failure rates
   - Resend failed webhooks

3. **Customers Tab**:
   - View test customers
   - Check subscription associations
   - View customer metadata

---

## 🎯 Quick Reference

### Test Credit Cards

```
✅ Success: 4242 4242 4242 4242
❌ Decline: 4000 0000 0000 0002
⚠️ Insufficient: 4000 0000 0000 9995

Expiry: Any future date
CVC: Any 3 digits
ZIP: Any valid code
```

### Product IDs

```
Pro:      4bd7788b-d3dd-4f17-837a-3a5a56341b05
Business: bbb245ef-6915-4c75-b59f-f14d61abb414
```

### Key Endpoints

```
Upgrade:      POST /api/subscription/upgrade
Downgrade:    POST /api/subscription/downgrade
Webhook:      POST /api/webhooks/polar
Test Polar:   GET  /api/test-polar-direct
```

### Environment Variables

```bash
POLAR_API_KEY=polar_sk_test_...
POLAR_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY=polar_pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ✨ Next Steps

After successfully testing subscriptions:

1. **Test Error Scenarios**:
   - Payment failures
   - Invalid product IDs
   - Expired cards
   - Network errors

2. **Test Edge Cases**:
   - Rapid subscription changes
   - Duplicate webhook events
   - Concurrent updates
   - Race conditions

3. **Performance Testing**:
   - Multiple simultaneous subscriptions
   - High webhook volume
   - Database load

4. **Security Testing**:
   - Invalid webhook signatures
   - Unauthorized API calls
   - CSRF protection
   - Rate limiting

5. **Prepare for Production**:
   - Switch to production API keys
   - Update webhook URLs
   - Configure real payment methods
   - Set up monitoring and alerts

---

## 📚 Additional Resources

- **Polar.sh API Docs**: https://docs.polar.sh/api
- **Webhook Events**: https://docs.polar.sh/webhooks
- **Test Cards**: https://docs.polar.sh/testing
- **Integration Guide**: See `POLAR-SANDBOX-SETUP-GUIDE.md`
- **Server Guide**: See `SERVER-STARTUP-GUIDE.md`

---

## ✅ Testing Checklist

Before considering subscription testing complete:

- [ ] Products created in Polar dashboard with correct IDs
- [ ] API credentials configured in `.env.local`
- [ ] Server running and accessible
- [ ] Test customer created
- [ ] Pro plan subscription created successfully
- [ ] Business plan subscription created successfully
- [ ] Webhook endpoint configured
- [ ] Webhooks received and processed
- [ ] Database updates verified
- [ ] UI reflects subscription tier changes
- [ ] Payment success flow tested
- [ ] Payment failure flow tested
- [ ] Cancellation flow tested
- [ ] Upgrade/downgrade flow tested

---

**Happy Testing! 🎉**

If you encounter any issues, refer to the troubleshooting section or check the Polar.sh documentation.

