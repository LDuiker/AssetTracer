# Complete Guide: Polar.sh Sandbox Setup & Webhook Configuration

This comprehensive guide will walk you through setting up your Polar.sh sandbox environment, obtaining your webhook URL, and configuring all necessary billing information for your AssetTracer application.

## 📋 Table of Contents

1. [Getting Started with Polar.sh](#getting-started-with-polarsh)
2. [Sandbox Account Setup](#sandbox-account-setup)
3. [Obtaining Your Webhook URL](#obtaining-your-webhook-url)
4. [API Keys & Authentication](#api-keys--authentication)
5. [Product Configuration](#product-configuration)
6. [Webhook Configuration](#webhook-configuration)
7. [Environment Variables Setup](#environment-variables-setup)
8. [Testing Your Integration](#testing-your-integration)
9. [Troubleshooting](#troubleshooting)
10. [Production Migration](#production-migration)

---

## 🚀 Getting Started with Polar.sh

### Step 1: Create Your Polar.sh Account

1. **Visit Polar.sh**: Go to [https://polar.sh](https://polar.sh)
2. **Sign Up**: Click "Sign Up" and create your account
3. **Verify Email**: Check your email and verify your account
4. **Complete Profile**: Fill in your business information

### Step 2: Access Your Dashboard

Once logged in, you'll see your Polar.sh dashboard with:
- **Overview**: Revenue metrics and subscription analytics
- **Products**: Manage your subscription plans
- **Customers**: View and manage customer data
- **Webhooks**: Configure webhook endpoints
- **Settings**: API keys and account settings

---

## 🧪 Sandbox Account Setup

### Enable Sandbox Mode

1. **Navigate to Settings**:
   - Click on your profile icon (top right)
   - Select "Settings" from the dropdown

2. **Switch to Sandbox**:
   - Look for "Environment" or "Mode" section
   - Toggle to "Sandbox" or "Test" mode
   - Confirm the switch

3. **Verify Sandbox Status**:
   - You should see "Sandbox Mode" indicator in your dashboard
   - All transactions will be test transactions
   - No real money will be processed

### Sandbox Features

- **Test Payments**: Use test credit card numbers
- **Webhook Testing**: Test webhook endpoints safely
- **API Testing**: Test all API endpoints without affecting production
- **Data Isolation**: Sandbox data is separate from production

---

## 🔗 Obtaining Your Webhook URL

### Step 1: Determine Your Webhook Endpoint

Based on your AssetTracer setup, your webhook URL should be:

```
https://yourdomain.com/api/webhooks/polar
```

For local development:
```
http://localhost:3000/api/webhooks/polar
```

### Step 2: Configure Webhook in Polar.sh

1. **Navigate to Webhooks**:
   - In your Polar.sh dashboard, go to "Webhooks" section
   - Click "Add Webhook" or "Create Webhook"

2. **Set Webhook URL**:
   - **URL**: Enter your webhook endpoint URL
   - **Description**: "AssetTracer Subscription Webhooks"

3. **Select Events**:
   Enable these webhook events:
   ```
   ✅ subscription.created
   ✅ subscription.updated
   ✅ subscription.canceled
   ✅ subscription.payment_succeeded
   ✅ subscription.payment_failed
   ✅ customer.created
   ✅ customer.updated
   ```

4. **Generate Webhook Secret**:
   - Polar.sh will generate a webhook secret
   - **Copy this secret** - you'll need it for your environment variables
   - The secret looks like: `whsec_1234567890abcdef...`

### Step 3: Test Webhook Endpoint

1. **Use Polar.sh Test Tool**:
   - In the webhook configuration, look for "Test" button
   - Click "Send Test Event"
   - Check your server logs for the incoming webhook

2. **Manual Testing**:
   ```bash
   # Test webhook with curl
   curl -X POST https://yourdomain.com/api/webhooks/polar \
     -H "Content-Type: application/json" \
     -H "polar-signature: test_signature" \
     -d '{"type":"test","data":{"id":"test"}}'
   ```

---

## 🔑 API Keys & Authentication

### Step 1: Generate API Key

1. **Go to Settings**:
   - Click on your profile icon
   - Select "Settings" → "API Keys"

2. **Create New Key**:
   - Click "Generate New Key"
   - Give it a name: "AssetTracer Integration"
   - Select permissions: "Read & Write" (or full access)

3. **Copy API Key**:
   - The API key will be displayed once
   - **Copy it immediately** - you won't be able to see it again
   - Format: `polar_sk_test_1234567890abcdef...`

### Step 2: API Key Security

- **Never commit API keys to version control**
- **Use environment variables** for storage
- **Rotate keys regularly** for security
- **Use different keys** for sandbox and production

---

## 📦 Product Configuration

### Step 1: Create Subscription Products

Based on your AssetTracer pricing structure, create these monthly subscription products:

#### Pro Plan Product

1. **Pro Monthly**:
   ```
   Product ID: pro_monthly
   Name: Pro Plan Monthly
   Price: $19.00 USD
   Billing: Monthly
   Description: Professional features for growing businesses
   ```

#### Business Plan Product

2. **Business Monthly**:
   ```
   Product ID: business_monthly
   Name: Business Plan Monthly
   Price: $39.00 USD
   Billing: Monthly
   Description: Advanced features for established businesses
   ```

### Step 2: Product Setup in Polar.sh

1. **Navigate to Products**:
   - Go to "Products" in your dashboard
   - Click "Create Product"

2. **Fill Product Details**:
   - **Name**: Use the names above
   - **Description**: Add feature descriptions
   - **Price**: Set the exact prices
   - **Billing Interval**: Monthly
   - **Currency**: USD

3. **Set Product ID**:
   - Use the exact Product IDs listed above
   - These must match your code configuration

4. **Configure Features**:
   - Add feature lists for each plan
   - Set up usage limits if applicable
   - Configure trial periods if needed

---

## ⚙️ Webhook Configuration

### Step 1: Webhook Endpoint Setup

Your webhook handler is already implemented at:
```
app/api/webhooks/polar/route.ts
```

### Step 2: Webhook Security

1. **Signature Verification**:
   ```typescript
   // Your webhook handler verifies signatures
   const signature = request.headers.get('polar-signature') || '';
   if (!polar.verifyWebhookSignature(body, signature)) {
     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
   }
   ```

2. **Webhook Secret**:
   - Store your webhook secret in environment variables
   - Use it for signature verification

### Step 3: Webhook Events Handling

Your webhook handler processes these events:

- **subscription.created**: New subscription activated
- **subscription.updated**: Subscription modified
- **subscription.canceled**: Subscription cancelled
- **subscription.payment_succeeded**: Payment successful
- **subscription.payment_failed**: Payment failed
- **customer.created**: New customer created
- **customer.updated**: Customer information updated

---

## 🔧 Environment Variables Setup

### Step 1: Create Environment File

Create or update your `.env.local` file:

```bash
# Polar.sh Configuration
POLAR_API_KEY=polar_sk_test_your_api_key_here
POLAR_BASE_URL=https://api.polar.sh
POLAR_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY=polar_pk_test_your_publishable_key_here

# Database (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Step 2: Get Publishable Key

1. **In Polar.sh Dashboard**:
   - Go to Settings → API Keys
   - Look for "Publishable Key" section
   - Copy the publishable key (starts with `polar_pk_test_`)

2. **Add to Environment**:
   - Add `NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY` to your `.env.local`
   - This key is safe to expose in client-side code

### Step 3: Verify Configuration

Test your environment variables:

```typescript
// Test API connection
const polar = new PolarClient();
const products = await polar.getProducts();
console.log('Products:', products);
```

---

## 🧪 Testing Your Integration

### Step 1: Test Credit Cards

Use these test credit card numbers in sandbox mode:

```
Visa: 4242 4242 4242 4242
Visa (debit): 4000 0566 5566 5556
Mastercard: 5555 5555 5555 4444
American Express: 3782 822463 10005
```

**Test Details**:
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any valid ZIP code

### Step 2: Test Subscription Flow

1. **Create Test Customer**:
   ```typescript
   const customer = await polar.createCustomer(
     'test@example.com',
     'Test User',
     { organization_id: 'test-org-123' }
   );
   ```

2. **Create Checkout Session**:
   ```typescript
   const session = await polar.createCheckoutSession(
     customer.id,
     'pro_monthly', // or 'business_monthly'
     'https://yourdomain.com/settings?success=true',
     'https://yourdomain.com/settings?canceled=true'
   );
   ```

3. **Process Payment**:
   - Use test credit card
   - Complete payment flow
   - Verify webhook received

### Step 3: Test Webhook Events

1. **Monitor Webhook Logs**:
   ```bash
   # Check your server logs
   tail -f logs/webhook.log
   ```

2. **Verify Database Updates**:
   - Check that subscription status updated
   - Verify tier changes applied
   - Confirm billing dates set

### Step 4: Test Error Scenarios

1. **Invalid API Key**:
   - Test with wrong API key
   - Verify error handling

2. **Webhook Failures**:
   - Test with invalid signature
   - Verify error responses

3. **Payment Failures**:
   - Use declined test cards
   - Test insufficient funds scenarios

---

## 🔍 Troubleshooting

### Common Issues & Solutions

#### 1. Webhook Not Receiving Events

**Symptoms**:
- No webhook events in server logs
- Subscriptions not updating in database

**Solutions**:
- ✅ Check webhook URL is accessible
- ✅ Verify webhook secret matches
- ✅ Ensure webhook events are enabled
- ✅ Check firewall/network settings
- ✅ Test webhook endpoint manually

#### 2. API Authentication Errors

**Symptoms**:
- 401 Unauthorized errors
- API calls failing

**Solutions**:
- ✅ Verify API key is correct
- ✅ Check API key permissions
- ✅ Ensure using sandbox key in sandbox mode
- ✅ Verify API key format

#### 3. Product ID Mismatches

**Symptoms**:
- Checkout sessions failing
- Wrong products being created

**Solutions**:
- ✅ Verify product IDs match exactly
- ✅ Check product exists in Polar.sh
- ✅ Ensure products are active
- ✅ Verify pricing matches

#### 4. Database Update Failures

**Symptoms**:
- Webhooks received but database not updated
- Subscription status not changing

**Solutions**:
- ✅ Check database connection
- ✅ Verify table schema matches
- ✅ Check foreign key constraints
- ✅ Review error logs

### Debug Mode

Enable debug logging:

```bash
# Add to your environment
DEBUG=polar:*
LOG_LEVEL=debug
```

### Webhook Testing Tools

1. **ngrok** (for local testing):
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Expose local server
   ngrok http 3000
   
   # Use ngrok URL for webhook endpoint
   https://abc123.ngrok.io/api/webhooks/polar
   ```

2. **Polar.sh Webhook Testing**:
   - Use built-in webhook testing in dashboard
   - Send test events to verify endpoint

---

## 🚀 Production Migration

### Step 1: Production Account Setup

1. **Create Production Account**:
   - Sign up for production Polar.sh account
   - Complete business verification
   - Set up bank account for payouts

2. **Production API Keys**:
   - Generate production API keys
   - Set up production webhook endpoints
   - Configure production products

### Step 2: Environment Configuration

Update environment variables for production:

```bash
# Production Polar.sh Configuration
POLAR_API_KEY=polar_sk_live_your_production_api_key
POLAR_BASE_URL=https://api.polar.sh
POLAR_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Production App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY=polar_pk_live_your_production_publishable_key
```

### Step 3: Database Migration

1. **Backup Sandbox Data**:
   - Export test subscriptions
   - Save customer data
   - Document configurations

2. **Update Database Schema**:
   - Run production migrations
   - Update product mappings
   - Verify constraints

### Step 4: Go-Live Checklist

- [ ] Production API keys configured
- [ ] Webhook endpoints tested
- [ ] Products created and active
- [ ] Database schema updated
- [ ] Error handling tested
- [ ] Monitoring set up
- [ ] Backup procedures in place

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Subscription Metrics**:
   - Conversion rates by plan
   - Churn rates
   - Revenue per customer
   - Average subscription value

2. **Payment Metrics**:
   - Payment success rates
   - Failed payment reasons
   - Retry success rates
   - Chargeback rates

3. **Webhook Metrics**:
   - Webhook delivery success
   - Processing times
   - Error rates
   - Retry attempts

### Monitoring Setup

1. **Log Aggregation**:
   - Set up centralized logging
   - Monitor webhook events
   - Track API errors

2. **Alerting**:
   - Payment failure alerts
   - Webhook failure alerts
   - High error rate alerts

3. **Analytics Dashboard**:
   - Revenue tracking
   - Subscription analytics
   - Customer metrics

---

## 📚 Additional Resources

### Polar.sh Documentation

- [Polar.sh API Documentation](https://docs.polar.sh/)
- [Webhook Documentation](https://docs.polar.sh/webhooks)
- [Payment Processing Guide](https://docs.polar.sh/payments)

### AssetTracer Integration Files

- `lib/polar.ts` - Polar.sh API client
- `app/api/webhooks/polar/route.ts` - Webhook handler
- `app/api/subscription/upgrade/route.ts` - Subscription upgrade
- `app/api/subscription/downgrade/route.ts` - Subscription downgrade

### Support Contacts

- **Polar.sh Support**: [support@polar.sh](mailto:support@polar.sh)
- **Polar.sh Discord**: [Join Discord](https://discord.gg/polar)
- **Documentation**: [docs.polar.sh](https://docs.polar.sh)

---

## ✅ Quick Reference

### Essential URLs

- **Polar.sh Dashboard**: [https://polar.sh](https://polar.sh)
- **API Documentation**: [https://docs.polar.sh](https://docs.polar.sh)
- **Webhook Testing**: Use dashboard webhook testing tool

### Required Environment Variables

```bash
POLAR_API_KEY=polar_sk_test_...
POLAR_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY=polar_pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Product IDs (Must Match Exactly)

```
pro_monthly
business_monthly
```

### Webhook Events

```
subscription.created
subscription.updated
subscription.canceled
subscription.payment_succeeded
subscription.payment_failed
customer.created
customer.updated
```

---

## 🎉 You're All Set!

Your Polar.sh sandbox integration is now configured and ready for testing. Follow the testing steps to verify everything works correctly before moving to production.

**Next Steps**:
1. Test the complete subscription flow
2. Verify webhook events are processed
3. Test error scenarios
4. Prepare for production migration

For any issues or questions, refer to the troubleshooting section or contact Polar.sh support.
