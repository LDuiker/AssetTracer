# Test Scripts

This directory contains utility scripts for testing the AssetTracer application.

## 📋 Available Scripts

### 1. Create Test Subscriptions

Create test customers and subscriptions in Polar.sh for testing billing integration.

#### PowerShell (Recommended for Windows)

```powershell
# Navigate to the asset-tracer directory
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"

# Create both Pro and Business subscriptions
.\scripts\create-test-subscriptions.ps1

# Create only Pro subscription
.\scripts\create-test-subscriptions.ps1 -Plan "pro"

# Create only Business subscription
.\scripts\create-test-subscriptions.ps1 -Plan "business"
```

#### Node.js

```bash
# Navigate to the asset-tracer directory
cd asset-tracer

# Create both Pro and Business subscriptions
node scripts/create-test-subscriptions.js

# Create only Pro subscription
node scripts/create-test-subscriptions.js pro

# Create only Business subscription
node scripts/create-test-subscriptions.js business
```

## 🔧 Prerequisites

Before running these scripts:

1. **Environment Variables**: Ensure your `.env.local` file is configured:
   ```bash
   POLAR_API_KEY=polar_sk_test_your_key_here
   POLAR_BASE_URL=https://api.polar.sh
   POLAR_WEBHOOK_SECRET=whsec_your_secret_here
   ```

2. **Polar Products**: Create products in your Polar dashboard with these exact IDs:
   - Pro Plan: `4bd7788b-d3dd-4f17-837a-3a5a56341b05`
   - Business Plan: `bbb245ef-6915-4c75-b59f-f14d61abb414`

3. **Server**: Ensure your development server is running:
   ```powershell
   npm run dev -- -p 3000
   ```

## 📊 What the Scripts Do

The subscription creation scripts will:

1. ✅ Test connection to Polar API
2. ✅ List existing subscriptions
3. ✅ Verify products exist in Polar
4. ✅ Create test customers with unique emails
5. ✅ Create test subscriptions for specified plans
6. ✅ Display summary of created subscriptions

## 🎯 Expected Output

Successful run:
```
🚀 Polar Test Subscriptions Creator
============================================================

🔌 Checking Polar API Connection
✅ API connection successful!
Connected as: your@email.com

📋 Listing Existing Subscriptions
Found 2 subscription(s):
✅ sub_abc123...

📦 Checking Products
✅ Pro Plan Monthly (4bd7788b-d3dd-4f17-837a-3a5a56341b05)
✅ Business Plan Monthly (bbb245ef-6915-4c75-b59f-f14d61abb414)

📝 Creating Test Subscriptions

--- Creating Pro Plan Subscription ---
✅ Customer created successfully!
✅ Pro subscription created successfully!

--- Creating Business Plan Subscription ---
✅ Customer created successfully!
✅ Business subscription created successfully!

📊 Summary
Total: 2
Successful: 2
Failed: 0

✨ Test subscriptions created successfully!
```

## 🐛 Troubleshooting

### Script Execution Policy (PowerShell)

If you get an error about script execution:

```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user (recommended)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or bypass for single script
PowerShell -ExecutionPolicy Bypass -File .\scripts\create-test-subscriptions.ps1
```

### API Connection Failed

```
❌ API connection failed!
Error: API Error (401): Unauthorized
```

**Solutions**:
1. Verify `POLAR_API_KEY` in `.env.local`
2. Ensure using test key: `polar_sk_test_...`
3. Check key hasn't expired
4. Restart server after updating environment variables

### Products Not Found

```
⚠️  Required products not found in Polar dashboard!
```

**Solutions**:
1. Go to https://polar.sh
2. Navigate to Products
3. Create products with exact IDs specified in the error message
4. Ensure products are "Active"

### Subscription Creation Failed

```
❌ Failed to create Pro subscription
Error: Product not found
```

**Solutions**:
1. Verify product ID matches exactly
2. Check product exists and is active in Polar dashboard
3. Ensure you're in sandbox/test mode
4. Check API key has correct permissions

## 📚 Related Documentation

- [POLAR-SUBSCRIPTION-TESTING-GUIDE.md](../../POLAR-SUBSCRIPTION-TESTING-GUIDE.md) - Complete testing guide
- [POLAR-SANDBOX-SETUP-GUIDE.md](../../POLAR-SANDBOX-SETUP-GUIDE.md) - Sandbox setup
- [SERVER-STARTUP-GUIDE.md](../../SERVER-STARTUP-GUIDE.md) - Server configuration

## 🔗 Useful Links

- Polar Dashboard: https://polar.sh
- Polar API Docs: https://docs.polar.sh/api
- Polar Webhooks: https://docs.polar.sh/webhooks

## 💡 Tips

1. **Start with one plan**: Test with a single plan first to verify setup
2. **Check webhooks**: Monitor webhook events in Polar dashboard
3. **Verify database**: Check Supabase after creating subscriptions
4. **Use test cards**: Only use test credit cards in sandbox mode
5. **Clean up**: Delete test subscriptions after testing

## 🚀 Next Steps

After running the scripts:

1. Check your Polar dashboard for created subscriptions
2. Verify webhooks are being delivered (if configured)
3. Check Supabase database for updated organization records
4. Test the subscription flow in the AssetTracer UI
5. Try upgrading/downgrading between plans

---

**Need help?** Refer to the troubleshooting section or check the main testing guide.

