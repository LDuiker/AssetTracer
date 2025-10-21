# Polar.sh Payment Gateway Integration

This document outlines the complete integration of Polar.sh payment gateway with AssetTracer.

## 🚀 What's Been Implemented

### ✅ Core Integration Components

1. **Polar.sh API Client** (`lib/polar.ts`)
   - Complete API wrapper for Polar.sh services
   - Customer management (create, update, get)
   - Subscription management (create, update, cancel)
   - Checkout session creation
   - Product management
   - Webhook signature verification

2. **Database Schema Updates** (`supabase/ADD-POLAR-INTEGRATION.sql`)
   - Added Polar.sh customer ID field
   - Added Polar.sh subscription ID field
   - Added Polar.sh product ID field
   - Added Polar.sh subscription status field
   - Added billing period tracking fields
   - Added metadata storage for additional info

3. **Webhook Handler** (`app/api/webhooks/polar/route.ts`)
   - Handles subscription lifecycle events
   - Updates organization subscription status
   - Maps Polar.sh products to our tiers
   - Processes payment success/failure events

4. **Updated API Routes**
   - **Upgrade Route** (`app/api/subscription/upgrade/route.ts`)
     - Creates Polar.sh checkout sessions
     - Supports monthly/yearly billing cycles
     - Maps tiers to Polar.sh product IDs
   - **Downgrade Route** (`app/api/subscription/downgrade/route.ts`)
     - Cancels Polar.sh subscriptions
     - Handles downgrade to free tier

5. **Enhanced UI Components**
   - **BillingSection** - Updated with billing cycle selection
   - **Settings Page** - Added success/cancel handling
   - Beautiful upgrade buttons with pricing display

## 🔧 Setup Instructions

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Polar.sh Configuration
POLAR_API_KEY=your_polar_api_key_here
POLAR_BASE_URL=https://api.polar.sh
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret_here

# App URL for redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Migration

Run the database migration to add Polar.sh fields:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase/ADD-POLAR-INTEGRATION.sql
```

### 3. Polar.sh Product Setup

Create these products in your Polar.sh dashboard:

| Product ID | Name | Price | Billing |
|------------|------|-------|---------|
| `pro_monthly` | Pro Plan Monthly | $19 | Monthly |
| `pro_yearly` | Pro Plan Yearly | $190 | Yearly |
| `business_monthly` | Business Plan Monthly | $39 | Monthly |
| `business_yearly` | Business Plan Yearly | $390 | Yearly |

### 4. Webhook Configuration

Set up webhook endpoint in Polar.sh dashboard:
- **URL**: `https://yourdomain.com/api/webhooks/polar`
- **Events**: 
  - `subscription.created`
  - `subscription.updated`
  - `subscription.canceled`
  - `subscription.payment_succeeded`
  - `subscription.payment_failed`
  - `customer.created`
  - `customer.updated`

## 🎯 How It Works

### Subscription Flow

1. **User clicks upgrade button** → BillingSection component
2. **API creates checkout session** → `/api/subscription/upgrade`
3. **User redirected to Polar.sh** → Secure payment processing
4. **Payment successful** → Polar.sh sends webhook
5. **Webhook updates database** → Organization subscription activated
6. **User redirected back** → Settings page with success message

### Downgrade Flow

1. **User clicks downgrade** → BillingSection component
2. **API cancels subscription** → `/api/subscription/downgrade`
3. **Database updated** → Organization downgraded to free
4. **Features restricted** → Based on new tier limits

### Webhook Processing

The webhook handler automatically:
- Maps Polar.sh product IDs to our subscription tiers
- Updates organization subscription status
- Handles payment success/failure
- Manages subscription lifecycle events

## 🔒 Security Features

- **Webhook Signature Verification** - Ensures webhooks are from Polar.sh
- **Customer ID Validation** - Links subscriptions to correct organizations
- **Tier Mapping** - Prevents unauthorized tier upgrades
- **Error Handling** - Comprehensive error logging and user feedback

## 🎨 UI Enhancements

### Billing Section Features

- **Billing Cycle Selection** - Monthly vs Yearly options
- **Clear Pricing Display** - Shows exact costs
- **Loading States** - Prevents double-clicks
- **Error Handling** - User-friendly error messages
- **Success/Cancel Feedback** - Toast notifications

### Upgrade Button Layout

**Free Tier:**
```
[Pro Monthly ($19/mo)] [Pro Yearly ($190/yr)]
[Business Monthly ($39/mo)] [Business Yearly ($390/yr)]
```

**Pro Tier:**
```
[Business Monthly ($39/mo)] [Business Yearly ($390/yr)]
                                    [Downgrade to Free]
```

## 🧪 Testing

### Test Scenarios

1. **Upgrade Flow**
   - Free → Pro Monthly
   - Free → Pro Yearly
   - Free → Business Monthly
   - Free → Business Yearly
   - Pro → Business (both cycles)

2. **Downgrade Flow**
   - Pro → Free
   - Business → Pro
   - Business → Free

3. **Webhook Events**
   - Subscription creation
   - Payment success/failure
   - Subscription cancellation

### Development Testing

For development, you can:
1. Use Polar.sh test mode
2. Mock webhook events
3. Test with test credit cards
4. Verify database updates

## 📊 Monitoring

### Key Metrics to Track

- Subscription conversion rates
- Payment success rates
- Webhook processing times
- Error rates by tier
- Revenue by billing cycle

### Logging

All Polar.sh operations are logged with:
- API request/response details
- Webhook event processing
- Error conditions
- User actions

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook URL configuration
   - Verify webhook secret
   - Check server logs

2. **Checkout Session Creation Fails**
   - Verify API key
   - Check product IDs exist
   - Validate customer creation

3. **Subscription Not Updating**
   - Check webhook signature verification
   - Verify organization mapping
   - Check database constraints

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=polar:*
```

## 🔄 Migration from DPO Group

If migrating from DPO Group:

1. **Export existing subscriptions** from DPO
2. **Create equivalent Polar.sh products**
3. **Migrate customer data** to Polar.sh
4. **Update webhook endpoints**
5. **Test thoroughly** before going live

## 📈 Future Enhancements

### Planned Features

- **Proration handling** for mid-cycle upgrades
- **Invoice generation** via Polar.sh
- **Tax calculation** integration
- **Multi-currency support**
- **Subscription analytics dashboard**

### API Extensions

- **Usage-based billing** for overages
- **Custom pricing** for enterprise
- **Bulk operations** for admin users
- **Subscription analytics** API

---

## 🎉 Ready to Go!

Your Polar.sh integration is complete and ready for production. The system handles:

- ✅ Secure payment processing
- ✅ Subscription lifecycle management
- ✅ Webhook event processing
- ✅ Tier-based feature restrictions
- ✅ Beautiful user interface
- ✅ Comprehensive error handling

Just add your Polar.sh credentials and you're live! 🚀
