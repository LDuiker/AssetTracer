# Testing Subscriptions - Complete Summary

**Created**: October 20, 2025  
**Status**: ✅ Complete Testing Setup Ready

---

## 📦 What Was Created

A complete testing infrastructure for Polar subscriptions, including:

### 1. **Documentation** (3 Guides)

- ✅ **[POLAR-SUBSCRIPTION-TESTING-GUIDE.md](POLAR-SUBSCRIPTION-TESTING-GUIDE.md)**
  - Comprehensive 600+ line testing guide
  - Step-by-step instructions for all testing methods
  - Webhook configuration and testing
  - Complete troubleshooting section
  - Test scenarios and verification steps

- ✅ **[POLAR-TESTING-QUICK-START.md](POLAR-TESTING-QUICK-START.md)**
  - 5-minute quick reference guide
  - Essential commands and checklists
  - Quick fixes for common issues
  - Testing checklist

- ✅ **[asset-tracer/scripts/README.md](asset-tracer/scripts/README.md)**
  - Script usage documentation
  - Prerequisites and setup
  - Troubleshooting for scripts

### 2. **Automated Scripts** (2 Scripts)

- ✅ **[asset-tracer/scripts/create-test-subscriptions.js](asset-tracer/scripts/create-test-subscriptions.js)**
  - Node.js script for creating test subscriptions
  - Automatic customer creation
  - Support for Pro and Business plans
  - Colored terminal output
  - Full error handling

- ✅ **[asset-tracer/scripts/create-test-subscriptions.ps1](asset-tracer/scripts/create-test-subscriptions.ps1)**
  - PowerShell version for Windows users
  - Same functionality as Node.js version
  - Native Windows integration
  - Loads .env.local automatically

### 3. **Testing Tools** (1 HTML Page)

- ✅ **[asset-tracer/scripts/test-polar.html](asset-tracer/scripts/test-polar.html)**
  - Interactive HTML testing page
  - Browser-based API testing
  - Visual feedback and results
  - No installation required

---

## 🚀 Quick Start

### Fastest Way to Test Subscriptions

```powershell
# 1. Navigate to project
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"

# 2. Run the script
.\scripts\create-test-subscriptions.ps1

# 3. Check results
# - Script shows success/failure
# - Visit https://polar.sh to verify
# - Check Supabase for database updates
```

---

## 📋 Three Ways to Test

### Method 1: PowerShell Script (Recommended for Windows)

**Best for**: Quick automated testing

```powershell
cd asset-tracer
.\scripts\create-test-subscriptions.ps1 -Plan "pro"
```

**Pros**:
- ✅ Fastest method
- ✅ Automatic customer creation
- ✅ Creates both plans with one command
- ✅ Clear visual feedback

**Cons**:
- ❌ Requires PowerShell
- ❌ Need to set execution policy

### Method 2: Polar Dashboard (Manual)

**Best for**: Understanding the flow, visual learners

1. Go to https://polar.sh
2. Click "Subscriptions" → "Create Subscription"
3. Fill in customer details
4. Select product
5. Complete with test card: `4242 4242 4242 4242`

**Pros**:
- ✅ Visual interface
- ✅ No code/scripts needed
- ✅ Good for learning

**Cons**:
- ❌ Slower
- ❌ Manual process
- ❌ More steps

### Method 3: AssetTracer App UI

**Best for**: End-to-end testing, real user flow

1. Login to http://localhost:3000
2. Go to Settings → Billing
3. Click "Upgrade to Pro"
4. Complete checkout flow

**Pros**:
- ✅ Tests actual user flow
- ✅ Tests integration
- ✅ Verifies webhooks

**Cons**:
- ❌ Requires full app setup
- ❌ Need to be logged in
- ❌ More complex

---

## 🎯 Configuration Required

### Before You Start Testing

#### 1. Environment Variables

Ensure `.env.local` has:

```bash
POLAR_API_KEY=polar_sk_test_xxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY=polar_pk_test_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get these from**:
- Go to https://polar.sh
- Settings → API Keys
- Copy all three keys

#### 2. Create Products in Polar

You **must** create products with these exact IDs:

```
Pro Plan:      4bd7788b-d3dd-4f17-837a-3a5a56341b05
Business Plan: bbb245ef-6915-4c75-b59f-f14d61abb414
```

**How to create**:
1. Go to https://polar.sh
2. Products → Create Product
3. Enter exact Product ID
4. Set name, price, billing interval
5. Mark as "Active"

#### 3. Start Development Server

```powershell
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"
npm run dev -- -p 3000
```

---

## ✅ Testing Workflow

### Complete Testing Flow

```
1. Setup
   └─ Configure .env.local
   └─ Create products in Polar
   └─ Start server
   
2. Test API Connection
   └─ Run: Invoke-WebRequest -Uri "http://localhost:3000/api/test-polar-direct"
   └─ Verify: {"success": true}
   
3. Create Test Subscription
   └─ Run: .\scripts\create-test-subscriptions.ps1 -Plan "pro"
   └─ Verify: Script shows success
   
4. Verify in Polar Dashboard
   └─ Go to: https://polar.sh
   └─ Check: Subscriptions tab
   └─ Verify: New subscription appears with "Active" status
   
5. Verify in Database
   └─ Open: Supabase dashboard
   └─ Check: organizations table
   └─ Verify: Fields updated (subscription_tier, status, etc.)
   
6. Test Webhooks (Optional)
   └─ Setup: ngrok http 3000
   └─ Configure: Webhook URL in Polar
   └─ Test: Send test event
   └─ Verify: Event received in server logs
```

---

## 🧪 Test Scenarios Covered

### Scenario 1: Happy Path - New Subscription

✅ User creates new Pro subscription
✅ Customer created in Polar
✅ Subscription activated
✅ Webhook sent
✅ Database updated
✅ User tier upgraded

### Scenario 2: Payment Methods

✅ Successful payment: `4242 4242 4242 4242`
✅ Declined payment: `4000 0000 0000 0002`
✅ Insufficient funds: `4000 0000 0000 9995`

### Scenario 3: Subscription Changes

✅ Upgrade: Free → Pro
✅ Upgrade: Pro → Business
✅ Downgrade: Business → Pro
✅ Cancel: Any → Free

### Scenario 4: Edge Cases

✅ Duplicate webhooks (idempotency)
✅ Network failures
✅ Invalid API keys
✅ Missing products
✅ Database connection errors

---

## 🔍 Verification Checklist

After creating test subscriptions, verify:

### In Polar Dashboard

- [ ] Subscription appears in Subscriptions tab
- [ ] Status shows as "Active"
- [ ] Customer details are correct
- [ ] Product ID matches configuration
- [ ] Billing dates are set

### In Supabase Database

- [ ] Organization record exists
- [ ] `subscription_tier` updated (e.g., "pro")
- [ ] `subscription_status` = "active"
- [ ] `polar_subscription_id` filled
- [ ] `polar_customer_id` filled
- [ ] Billing dates populated

### In Application

- [ ] User tier displayed correctly
- [ ] Features unlocked based on tier
- [ ] Settings page shows correct plan
- [ ] Upgrade/downgrade buttons work
- [ ] Billing information accurate

### Webhooks (If Configured)

- [ ] Webhook events received
- [ ] Server logs show event processing
- [ ] Database updates triggered by webhooks
- [ ] No errors in webhook handler

---

## 🐛 Common Issues & Solutions

### Issue: "PowerShell script won't run"

**Error**: `cannot be loaded because running scripts is disabled`

**Solution**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: "API connection failed"

**Error**: `401 Unauthorized` or `Invalid API key`

**Solutions**:
1. Check `POLAR_API_KEY` in `.env.local`
2. Ensure key starts with `polar_sk_test_`
3. Restart server after updating `.env.local`
4. Verify key hasn't expired in Polar dashboard

### Issue: "Products not found"

**Error**: `Product not found` or `Invalid product ID`

**Solutions**:
1. Go to https://polar.sh → Products
2. Create products with exact IDs:
   - Pro: `4bd7788b-d3dd-4f17-837a-3a5a56341b05`
   - Business: `bbb245ef-6915-4c75-b59f-f14d61abb414`
3. Ensure products are marked "Active"
4. Verify IDs match exactly (case-sensitive)

### Issue: "Webhooks not received"

**Error**: Subscription created but database not updated

**Solutions**:
1. Install ngrok: `npm install -g ngrok`
2. Run: `ngrok http 3000`
3. Copy ngrok URL (e.g., `https://abc123.ngrok.io`)
4. Update webhook URL in Polar:
   `https://abc123.ngrok.io/api/webhooks/polar`
5. Verify webhook secret matches in `.env.local`
6. Send test event from Polar dashboard

### Issue: "Server not accessible"

**Error**: `localhost refused to connect`

**Solutions**:
```powershell
# Check if server is running
Get-Process -Name "node"

# Check port 3000
Test-NetConnection -ComputerName localhost -Port 3000

# Start server
cd asset-tracer
npm run dev -- -p 3000
```

---

## 📊 Success Metrics

You'll know everything is working when:

✅ **Scripts Run**: PowerShell script completes without errors
✅ **Polar Dashboard**: Subscriptions appear with "Active" status
✅ **Database Updated**: Supabase shows correct subscription data
✅ **App UI**: User interface reflects subscription tier
✅ **Webhooks Work**: Events received and processed
✅ **Features Unlocked**: Tier-based features accessible

---

## 📚 Documentation Quick Links

### For Quick Testing
→ **[POLAR-TESTING-QUICK-START.md](POLAR-TESTING-QUICK-START.md)**

### For Complete Guide
→ **[POLAR-SUBSCRIPTION-TESTING-GUIDE.md](POLAR-SUBSCRIPTION-TESTING-GUIDE.md)**

### For Initial Setup
→ **[POLAR-SANDBOX-SETUP-GUIDE.md](POLAR-SANDBOX-SETUP-GUIDE.md)**

### For Scripts
→ **[asset-tracer/scripts/README.md](asset-tracer/scripts/README.md)**

### For Server Issues
→ **[SERVER-STARTUP-GUIDE.md](SERVER-STARTUP-GUIDE.md)**

---

## 🎯 Next Steps

### Immediate Next Steps

1. **Configure Environment**
   ```powershell
   # Edit .env.local with your Polar credentials
   notepad asset-tracer\.env.local
   ```

2. **Create Products**
   - Go to https://polar.sh
   - Create Pro and Business products
   - Use exact IDs from configuration

3. **Run First Test**
   ```powershell
   cd asset-tracer
   .\scripts\create-test-subscriptions.ps1 -Plan "pro"
   ```

4. **Verify Results**
   - Check Polar dashboard
   - Check Supabase database
   - Test in app UI

### Future Enhancements

- [ ] Set up webhook monitoring
- [ ] Configure production environment
- [ ] Add more test scenarios
- [ ] Implement subscription analytics
- [ ] Add usage-based billing (if needed)

---

## 💡 Pro Tips

1. **Test One Plan First**: Start with Pro plan to verify setup
2. **Use ngrok for Webhooks**: Essential for local development
3. **Monitor Server Logs**: Watch for errors and webhook events
4. **Clean Up Test Data**: Delete test subscriptions after testing
5. **Document Product IDs**: Keep them in version control
6. **Test Error Scenarios**: Don't just test happy paths
7. **Verify Database**: Always check database after operations
8. **Keep Keys Secure**: Never commit API keys to git

---

## 🔗 External Resources

- **Polar Dashboard**: https://polar.sh
- **Polar API Docs**: https://docs.polar.sh/api
- **Polar Webhooks**: https://docs.polar.sh/webhooks
- **Test Cards**: https://docs.polar.sh/testing
- **Supabase Dashboard**: Your Supabase project URL

---

## ✨ Summary

You now have:

✅ **Complete documentation** for testing Polar subscriptions
✅ **Automated scripts** for creating test data
✅ **Interactive tools** for manual testing
✅ **Troubleshooting guides** for common issues
✅ **Verification checklists** to ensure success

**Ready to test?** Start with the Quick Start guide:

```powershell
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"
.\scripts\create-test-subscriptions.ps1
```

---

**Last Updated**: October 20, 2025  
**Status**: ✅ Ready for Testing  
**Support**: See troubleshooting sections in guides

🎉 **Happy Testing!**

