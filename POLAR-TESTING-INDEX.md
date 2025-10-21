# Polar Subscription Testing - Master Index

**Complete guide to testing subscriptions in AssetTracer**

---

## 🚀 Start Here

### New to Polar Testing?
👉 **[POLAR-TESTING-QUICK-START.md](POLAR-TESTING-QUICK-START.md)** - 5-minute guide to get started

### Need Detailed Instructions?
👉 **[POLAR-SUBSCRIPTION-TESTING-GUIDE.md](POLAR-SUBSCRIPTION-TESTING-GUIDE.md)** - Complete testing guide

### First Time Setup?
👉 **[POLAR-SANDBOX-SETUP-GUIDE.md](POLAR-SANDBOX-SETUP-GUIDE.md)** - Initial configuration

---

## 📚 All Documentation

### Core Guides

| Document | Description | When to Use |
|----------|-------------|-------------|
| **[POLAR-TESTING-QUICK-START.md](POLAR-TESTING-QUICK-START.md)** | 5-minute quick reference | Quick testing, checklists |
| **[POLAR-SUBSCRIPTION-TESTING-GUIDE.md](POLAR-SUBSCRIPTION-TESTING-GUIDE.md)** | Comprehensive testing guide | Detailed testing, troubleshooting |
| **[POLAR-SANDBOX-SETUP-GUIDE.md](POLAR-SANDBOX-SETUP-GUIDE.md)** | Initial Polar setup | First-time configuration |
| **[SERVER-STARTUP-GUIDE.md](SERVER-STARTUP-GUIDE.md)** | Server setup & troubleshooting | Server issues |
| **[TESTING-SUBSCRIPTIONS-SUMMARY.md](TESTING-SUBSCRIPTIONS-SUMMARY.md)** | Complete overview | Understanding the full system |

### Script Documentation

| Document | Description | When to Use |
|----------|-------------|-------------|
| **[asset-tracer/scripts/README.md](asset-tracer/scripts/README.md)** | Script usage guide | Using automation scripts |

---

## 🛠️ Testing Tools

### Automated Scripts

```powershell
# PowerShell Script (Windows)
.\asset-tracer\scripts\create-test-subscriptions.ps1

# Node.js Script (Cross-platform)
node asset-tracer/scripts/create-test-subscriptions.js

# Create specific plan
.\asset-tracer\scripts\create-test-subscriptions.ps1 -Plan "pro"
```

### Interactive Tools

- **HTML Tester**: Open `asset-tracer/scripts/test-polar.html` in browser
- **API Endpoint**: `http://localhost:3000/api/test-polar-direct`
- **Polar Dashboard**: https://polar.sh

---

## ⚡ Quick Commands

### Test API Connection
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-polar-direct"
```

### Create Test Subscription
```powershell
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"
.\scripts\create-test-subscriptions.ps1
```

### Start Development Server
```powershell
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"
npm run dev -- -p 3000
```

---

## 🎯 Testing Methods

### Method 1: Automated Scripts
**Fastest and easiest**
- Run PowerShell or Node.js script
- Automatically creates customers and subscriptions
- See: [Quick Start Guide](POLAR-TESTING-QUICK-START.md)

### Method 2: Polar Dashboard
**Visual and intuitive**
- Manual creation through web interface
- Good for learning the process
- See: [Testing Guide - Method 1](POLAR-SUBSCRIPTION-TESTING-GUIDE.md#method-1-testing-via-dashboard-ui)

### Method 3: AssetTracer App
**Tests full integration**
- Create subscriptions through your app UI
- Tests complete user flow
- See: [Testing Guide - Method 3](POLAR-SUBSCRIPTION-TESTING-GUIDE.md#method-3-testing-via-assettracer-app)

---

## 📋 Prerequisites Checklist

Before testing, ensure you have:

- [ ] Polar.sh account created
- [ ] API credentials obtained:
  - [ ] `POLAR_API_KEY`
  - [ ] `POLAR_WEBHOOK_SECRET`
  - [ ] `NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY`
- [ ] `.env.local` configured
- [ ] Development server running
- [ ] Products created in Polar with correct IDs:
  - [ ] Pro: `4bd7788b-d3dd-4f17-837a-3a5a56341b05`
  - [ ] Business: `bbb245ef-6915-4c75-b59f-f14d61abb414`

---

## 🔧 Configuration

### Required Environment Variables

Add to `asset-tracer/.env.local`:

```bash
POLAR_API_KEY=polar_sk_test_xxxxx
POLAR_BASE_URL=https://api.polar.sh
POLAR_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY=polar_pk_test_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Product IDs (Must Match Exactly)

```
Pro Plan:      4bd7788b-d3dd-4f17-837a-3a5a56341b05
Business Plan: bbb245ef-6915-4c75-b59f-f14d61abb414
```

---

## 🧪 Test Scenarios

### Basic Tests
- ✅ Create Pro subscription
- ✅ Create Business subscription
- ✅ Verify in Polar dashboard
- ✅ Check database updates

### Advanced Tests
- ✅ Test webhook delivery
- ✅ Test payment failures
- ✅ Test subscription upgrades
- ✅ Test subscription cancellations

### Integration Tests
- ✅ End-to-end user flow
- ✅ UI updates after subscription
- ✅ Feature unlocking by tier
- ✅ Billing page accuracy

---

## 🐛 Common Issues

### "PowerShell script won't run"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "API connection failed"
1. Check `POLAR_API_KEY` in `.env.local`
2. Restart server after changes
3. Verify key in Polar dashboard

### "Products not found"
1. Create products at https://polar.sh
2. Use exact Product IDs
3. Mark products as "Active"

### "Webhooks not received"
1. Use ngrok for local testing
2. Update webhook URL in Polar
3. Verify webhook secret

**More solutions**: See [Troubleshooting Guide](POLAR-SUBSCRIPTION-TESTING-GUIDE.md#troubleshooting)

---

## 📖 Learning Path

### For Beginners

1. **Read**: [Quick Start Guide](POLAR-TESTING-QUICK-START.md)
2. **Setup**: Configure environment variables
3. **Create**: Products in Polar dashboard
4. **Test**: Run automated script
5. **Verify**: Check Polar dashboard and database

### For Advanced Users

1. **Read**: [Complete Testing Guide](POLAR-SUBSCRIPTION-TESTING-GUIDE.md)
2. **Configure**: Webhooks with ngrok
3. **Test**: All scenarios (success, failure, edge cases)
4. **Monitor**: Webhook events and database updates
5. **Optimize**: Custom test scenarios

---

## 🎯 Success Indicators

You'll know it's working when:

✅ Script completes without errors
✅ Subscriptions appear in Polar dashboard
✅ Database shows updated records
✅ App UI reflects subscription tier
✅ Webhooks are received and processed
✅ Features unlock based on tier

---

## 📞 Support & Resources

### Documentation
- All guides in this repository
- Inline comments in scripts
- Troubleshooting sections

### External Resources
- **Polar Dashboard**: https://polar.sh
- **Polar API Docs**: https://docs.polar.sh
- **Polar Webhooks**: https://docs.polar.sh/webhooks

### Test Data
- **Test Cards**: See [Quick Start](POLAR-TESTING-QUICK-START.md#test-credit-cards)
- **Product IDs**: Listed above in Configuration section

---

## 🔄 Workflow Summary

```
Setup Phase:
1. Configure .env.local
2. Create products in Polar
3. Start development server

Testing Phase:
4. Run test script
5. Verify in Polar dashboard
6. Check database updates
7. Test in app UI

Verification Phase:
8. Monitor webhooks
9. Check feature access
10. Verify billing information

Cleanup Phase:
11. Delete test subscriptions
12. Review logs
13. Document any issues
```

---

## 📂 File Structure

```
AssetTracer/
├── POLAR-TESTING-INDEX.md (this file)
├── POLAR-TESTING-QUICK-START.md
├── POLAR-SUBSCRIPTION-TESTING-GUIDE.md
├── POLAR-SANDBOX-SETUP-GUIDE.md
├── SERVER-STARTUP-GUIDE.md
├── TESTING-SUBSCRIPTIONS-SUMMARY.md
└── asset-tracer/
    ├── .env.local (create this)
    ├── lib/
    │   └── polar.ts
    ├── app/
    │   └── api/
    │       ├── subscription/
    │       │   └── upgrade/route.ts
    │       └── webhooks/
    │           └── polar/route.ts
    └── scripts/
        ├── README.md
        ├── create-test-subscriptions.js
        ├── create-test-subscriptions.ps1
        └── test-polar.html
```

---

## 🚦 Quick Status Check

### Before Starting

Run these checks:

```powershell
# Check server
Get-Process -Name "node"

# Test port
Test-NetConnection -ComputerName localhost -Port 3000

# Test API
Invoke-WebRequest -Uri "http://localhost:3000/api/test-polar-direct"
```

All should return positive results before proceeding with subscription testing.

---

## 💡 Best Practices

1. **Start Small**: Test one subscription type first
2. **Verify Each Step**: Check results after each action
3. **Use Scripts**: Automated testing is faster and more reliable
4. **Monitor Logs**: Watch server logs for errors
5. **Clean Up**: Delete test data after testing
6. **Document Issues**: Note any problems for future reference
7. **Test Webhooks**: Essential for production readiness

---

## 🎉 Ready to Start?

Choose your path:

### Quick Test (5 minutes)
👉 Go to [POLAR-TESTING-QUICK-START.md](POLAR-TESTING-QUICK-START.md)

### Complete Setup (30 minutes)
👉 Go to [POLAR-SUBSCRIPTION-TESTING-GUIDE.md](POLAR-SUBSCRIPTION-TESTING-GUIDE.md)

### First Time User (1 hour)
👉 Start with [POLAR-SANDBOX-SETUP-GUIDE.md](POLAR-SANDBOX-SETUP-GUIDE.md)

---

**Last Updated**: October 20, 2025  
**Status**: ✅ Complete Testing Infrastructure Ready  
**Version**: 1.0

---

Need help? Check the troubleshooting sections in the guides or review the [Testing Summary](TESTING-SUBSCRIPTIONS-SUMMARY.md) for a complete overview.

