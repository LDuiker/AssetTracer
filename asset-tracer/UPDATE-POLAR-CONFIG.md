# Fix Polar Configuration - UPDATED

## ✅ Good News! Your Configuration is Actually Correct!

After testing with the [Polar API](https://polar.sh/docs/api-reference/organizations/list?playground=open), we confirmed:

1. **✅ `polar_oat_` tokens ARE valid**: Polar supports OAuth tokens
2. **✅ `https://sandbox-api.polar.sh` IS correct**: This is a valid Polar sandbox endpoint
3. **✅ Your credentials work**: Successfully tested with organizations endpoint

## 🔴 The Real Issue: Missing `/v1/` API Prefix

The problem was in the code, not your configuration! The Polar client was calling:
- ❌ `https://sandbox-api.polar.sh/customers` (404 Error)

Instead of:
- ✅ `https://sandbox-api.polar.sh/v1/customers` (Correct)

**This has been FIXED in the code!** All API endpoints now include the `/v1/` prefix.

## 📋 Your Current Configuration (Keep It!)

Your `.env.local` is **correctly configured**:

```bash
# ✅ These are all CORRECT - don't change them!
POLAR_API_KEY=polar_oat_4wgNyL10vd...      # OAuth token - Valid!
POLAR_BASE_URL=https://sandbox-api.polar.sh  # Sandbox API - Valid!
POLAR_WEBHOOK_SECRET=polar_whs_sSWnvQsImg... # Webhook secret - Valid!
```

## 🎯 What Was Fixed

Updated `asset-tracer/lib/polar.ts` to add `/v1/` prefix to all endpoints:

| Endpoint | Before | After |
|----------|--------|-------|
| Create Customer | `/customers` | `/v1/customers` ✅ |
| Get Customer | `/customers/{id}` | `/v1/customers/{id}` ✅ |
| Create Subscription | `/subscriptions` | `/v1/subscriptions` ✅ |
| Get Subscription | `/subscriptions/{id}` | `/v1/subscriptions/{id}` ✅ |
| Checkout Session | `/checkout/sessions` | `/v1/checkout/sessions` ✅ |

Also fixed:
- ✅ `customerId` scope issue in error handler

### Step 4: Restart Your Server

After updating `.env.local`:

```powershell
# The server will automatically restart since it's watching for changes
# Or you can manually restart by pressing Ctrl+C and running:
npm run dev -- -p 3000
```

---

## 🎯 Quick Fix Script

Run this PowerShell script to update your config:

```powershell
# Edit your .env.local file
notepad "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer\.env.local"
```

Then update these values:

| Variable | Current | Correct |
|----------|---------|---------|
| `POLAR_API_KEY` | `polar_oat_...` | `polar_sk_test_...` |
| `POLAR_BASE_URL` | `https://sandbox-api.polar.sh` | `https://api.polar.sh` |
| `POLAR_WEBHOOK_SECRET` | `polar_whs_...` | `whsec_...` |

---

## 📚 What's the Difference?

### OAuth Token vs API Key

- **OAuth Token** (`polar_oat_...`): Used for user authentication, temporary access
- **API Key** (`polar_sk_test_...`): Used for server-to-server API calls, permanent access

### Base URL

- **Wrong**: `https://sandbox-api.polar.sh` - This endpoint doesn't exist
- **Correct**: `https://api.polar.sh` - The actual Polar API endpoint

The sandbox vs production mode is determined by your **API key prefix**:
- `polar_sk_test_` = Sandbox/Test mode
- `polar_sk_live_` = Production mode

---

## 🧪 Test Your Configuration

After updating, test with:

```powershell
# Test API connection
Invoke-WebRequest -Uri "http://localhost:3000/api/test-polar-direct"
```

Expected response: `"success": true`

---

## 🚀 Next Steps

1. Update `.env.local` with correct credentials
2. Server will auto-reload
3. Try upgrading subscription again
4. Run test script: `.\scripts\create-test-subscriptions.ps1`

---

## ❓ Don't Have API Keys?

If you don't have Polar API keys yet:

1. **Sign up**: Go to https://polar.sh and create an account
2. **Verify email**: Check your email and verify your account
3. **Get keys**: Go to Settings → API Keys
4. **Create products**: Create Pro and Business products with the correct IDs
5. **Configure**: Update your `.env.local` file

See [POLAR-SANDBOX-SETUP-GUIDE.md](../../POLAR-SANDBOX-SETUP-GUIDE.md) for detailed setup instructions.

---

## 🐛 Still Having Issues?

If you still get errors after updating:

1. **Verify keys are correct**: Check they start with the right prefix
2. **No extra spaces**: Make sure there are no spaces in the `.env.local` file
3. **Restart server**: Make sure to restart the server after changes
4. **Check Polar dashboard**: Verify your account is active

---

**Need help?** See the troubleshooting section in [POLAR-SUBSCRIPTION-TESTING-GUIDE.md](../../POLAR-SUBSCRIPTION-TESTING-GUIDE.md)

