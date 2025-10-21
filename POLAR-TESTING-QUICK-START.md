# Polar Subscription Testing - Quick Start

**5-Minute Guide** to create test subscriptions for AssetTracer

---

## ⚡ Quick Commands

### Option 1: PowerShell Script (Easiest)

```powershell
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"
.\scripts\create-test-subscriptions.ps1
```

### Option 2: Node.js Script

```bash
cd asset-tracer
node scripts/create-test-subscriptions.js
```

### Option 3: Manual via Polar Dashboard

1. Go to https://polar.sh
2. Click "Subscriptions" → "Create Subscription"
3. Use test card: `4242 4242 4242 4242`

---

## 📋 Prerequisites Checklist

- [ ] `.env.local` file configured with Polar credentials
- [ ] Development server running (`npm run dev -- -p 3000`)
- [ ] Products created in Polar dashboard:
  - Pro: `4bd7788b-d3dd-4f17-837a-3a5a56341b05`
  - Business: `bbb245ef-6915-4c75-b59f-f14d61abb414`

---

## 🔑 Required Environment Variables

Add to `asset-tracer/.env.local`:

```bash
POLAR_API_KEY=polar_sk_test_your_key_here
POLAR_WEBHOOK_SECRET=whsec_your_secret_here
NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY=polar_pk_test_your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get these from:
1. Go to https://polar.sh
2. Settings → API Keys
3. Copy keys and webhook secret

---

## 🎯 Test Credit Cards

```
✅ Success: 4242 4242 4242 4242
❌ Decline: 4000 0000 0000 0002
⚠️  Insufficient: 4000 0000 0000 9995

Expiry: 12/25
CVC: 123
ZIP: 12345
```

---

## 🚀 Quick Test Flow

### 1. Start Server
```powershell
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"
npm run dev -- -p 3000
```

### 2. Create Test Subscription
```powershell
.\scripts\create-test-subscriptions.ps1 -Plan "pro"
```

### 3. Verify in Polar Dashboard
- Go to https://polar.sh
- Check "Subscriptions" tab
- Verify status is "Active"

### 4. Check Database
- Open Supabase dashboard
- Check `organizations` table
- Verify fields updated:
  - `subscription_tier` = "pro"
  - `subscription_status` = "active"
  - `polar_subscription_id` = (subscription ID)

---

## 🧪 Testing Scenarios

### Test 1: Create Pro Subscription
```powershell
.\scripts\create-test-subscriptions.ps1 -Plan "pro"
```
**Expected**: Customer + Pro subscription created

### Test 2: Create Business Subscription
```powershell
.\scripts\create-test-subscriptions.ps1 -Plan "business"
```
**Expected**: Customer + Business subscription created

### Test 3: Test via App UI
1. Login to http://localhost:3000
2. Go to Settings → Billing
3. Click "Upgrade to Pro"
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout

**Expected**: Redirected back, tier updated to "pro"

---

## 🐛 Common Issues & Quick Fixes

### Issue: "API connection failed"
```powershell
# Fix: Check API key in .env.local
# Restart server after changing .env.local
```

### Issue: "Products not found"
```
Fix: Create products in Polar dashboard
Go to: https://polar.sh → Products → Create Product
Use exact IDs from prerequisites section
```

### Issue: "PowerShell execution policy"
```powershell
# Fix: Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: "Webhook not received"
```
Fix: Use ngrok for local testing
1. Install: npm install -g ngrok
2. Run: ngrok http 3000
3. Copy URL to Polar webhook settings
```

---

## 📊 Verification Commands

### Check API Connection
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-polar-direct"
```
**Expected**: `"success": true`

### Check Server Status
```powershell
Get-Process -Name "node"
```
**Expected**: Node process running

### Check Port 3000
```powershell
Test-NetConnection -ComputerName localhost -Port 3000
```
**Expected**: `TcpTestSucceeded: True`

---

## 🎯 Quick Reference

### Product IDs (Must Match Exactly!)
```
Pro:      4bd7788b-d3dd-4f17-837a-3a5a56341b05
Business: bbb245ef-6915-4c75-b59f-f14d61abb414
```

### Key Endpoints
```
Upgrade:  POST /api/subscription/upgrade
Webhook:  POST /api/webhooks/polar
Test:     GET  /api/test-polar-direct
```

### Important Paths
```
Scripts:        asset-tracer/scripts/
Environment:    asset-tracer/.env.local
Polar Client:   asset-tracer/lib/polar.ts
Webhook Handler: asset-tracer/app/api/webhooks/polar/route.ts
```

---

## 🔗 Full Documentation

For detailed guides, see:

1. **[POLAR-SUBSCRIPTION-TESTING-GUIDE.md](POLAR-SUBSCRIPTION-TESTING-GUIDE.md)**
   Complete testing guide with all scenarios

2. **[POLAR-SANDBOX-SETUP-GUIDE.md](POLAR-SANDBOX-SETUP-GUIDE.md)**
   Initial Polar setup and configuration

3. **[SERVER-STARTUP-GUIDE.md](SERVER-STARTUP-GUIDE.md)**
   Server troubleshooting and startup

4. **[asset-tracer/scripts/README.md](asset-tracer/scripts/README.md)**
   Script documentation

---

## ✅ Testing Checklist

Quick checklist before testing:

- [ ] Server running on port 3000
- [ ] `.env.local` configured with API keys
- [ ] Products exist in Polar dashboard
- [ ] Can access http://localhost:3000
- [ ] Supabase database connected

---

## 🎉 Success Indicators

You'll know it's working when you see:

✅ Script shows: "✅ Test subscriptions created successfully!"
✅ Polar dashboard shows active subscriptions
✅ Supabase shows updated organization records
✅ App UI reflects correct subscription tier
✅ Webhook events appear in server logs

---

## 💡 Pro Tips

1. **Test one plan first** - Start with Pro to verify setup
2. **Use ngrok for webhooks** - Essential for local testing
3. **Monitor server logs** - Watch for webhook events
4. **Check Polar dashboard** - Verify subscriptions appear
5. **Clean up after testing** - Delete test subscriptions

---

## 🆘 Need Help?

1. Check [POLAR-SUBSCRIPTION-TESTING-GUIDE.md](POLAR-SUBSCRIPTION-TESTING-GUIDE.md) for detailed troubleshooting
2. Review server logs for error messages
3. Verify environment variables are correct
4. Check Polar dashboard for webhook delivery logs
5. Ensure products exist with exact IDs

---

**Ready to test?** Run the PowerShell script and create your first test subscription!

```powershell
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"
.\scripts\create-test-subscriptions.ps1
```

Good luck! 🚀

