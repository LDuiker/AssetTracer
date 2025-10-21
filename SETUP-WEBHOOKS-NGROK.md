# Setup Webhooks with ngrok - Quick Guide

Your checkout is working! Now let's configure webhooks so your subscription tier updates automatically.

## 🚀 Quick 3-Step Setup

### Step 1: Install and Run ngrok

ngrok creates a public URL for your localhost so Polar can send webhooks.

**PowerShell:**
```powershell
# Install ngrok (if not installed)
# Download from: https://ngrok.com/download
# Or use: choco install ngrok (if you have Chocolatey)

# Run ngrok to expose port 3000
ngrok http 3000
```

**Expected Output:**
```
ngrok                                                                            
                                                                                 
Session Status                online                                            
Account                       your@email.com                                    
Version                       3.x.x                                             
Region                        United States (us)                                
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000  
                                                                                 
Connections                   ttl     opn     rt1     rt5     p50     p90       
                              0       0       0.00    0.00    0.00    0.00      
```

**COPY THIS URL**: `https://abc123.ngrok.io` (yours will be different!)

---

### Step 2: Configure Webhook in Polar

1. **Go to**: https://polar.sh
2. **Click**: Settings or Webhooks (in sidebar)
3. **Click**: "Add Webhook" or "Create Webhook"
4. **Fill in**:
   ```
   URL: https://abc123.ngrok.io/api/webhooks/polar
   (Use YOUR ngrok URL + /api/webhooks/polar)
   
   Description: Local Development Webhook
   ```
5. **Select Events** (check all these):
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
   - ✅ `subscription.payment_succeeded`
   - ✅ `subscription.payment_failed`
   - ✅ `customer.created`
   - ✅ `customer.updated`

6. **Save** and **COPY the Webhook Secret**
   - It looks like: `whsec_xxxxxxxxxxxxx`

---

### Step 3: Update Your Environment Variables

**Edit** `asset-tracer/.env.local`:

```bash
# Update this line with the webhook secret from Step 2
POLAR_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
```

**Save** and restart your server (or it auto-reloads)

---

## ✅ Test It!

### Method 1: Create New Subscription

1. Go to http://localhost:3000/settings
2. Upgrade to a plan
3. Complete checkout
4. **Watch your terminal** - you should see:
   ```
   Received Polar webhook: subscription.created
   Subscription created for organization xxx, tier: business
   ```
5. Refresh your settings page - tier should update!

### Method 2: Manually Trigger Webhook

If you already completed checkout:

1. **Go to Polar dashboard** → Webhooks
2. **Find your webhook** (the one you just created)
3. **Click "Send Test Event"** or "Resend"
4. Select `subscription.created` event
5. **Send it**

Your tier should update immediately!

---

## 🔍 Monitor Webhooks

### In Your Terminal

Watch for these logs:
```
Received Polar webhook: subscription.created
Customer already exists, fetching existing customer...
Subscription created for organization 41fa8bc6-..., tier: business
```

### In Polar Dashboard

1. Go to https://polar.sh → Webhooks
2. Click on your webhook
3. See "Recent Deliveries" or "Webhook Logs"
4. Check if webhooks are being delivered successfully

---

## 🐛 Troubleshooting

### Webhook Not Received

**Check ngrok is running:**
```powershell
# Make sure this is still running in a terminal
ngrok http 3000
```

**Check the URL is correct:**
- Polar webhook URL should be: `https://YOUR-NGROK-URL.ngrok.io/api/webhooks/polar`
- NOT just: `https://YOUR-NGROK-URL.ngrok.io`

**Check your server logs:**
- Look for "Received Polar webhook" messages
- If you see 401 errors, check webhook secret

### Tier Still Not Updating

**Check your database:**
```sql
-- In Supabase, check organizations table
SELECT id, name, subscription_tier, polar_subscription_id 
FROM organizations 
WHERE id = '41fa8bc6-5280-47de-b4d2-dca2540206a8';
```

**Manually update for testing:**
```sql
UPDATE organizations 
SET subscription_tier = 'business',
    subscription_status = 'active'
WHERE id = '41fa8bc6-5280-47de-b4d2-dca2540206a8';
```

Then refresh your settings page.

---

## 💡 Alternative: Manual Database Update (Quick Test)

If you just want to test the UI without webhooks:

**Run this in Supabase SQL Editor:**

```sql
-- Update your organization to Business tier
UPDATE organizations 
SET subscription_tier = 'business',
    subscription_status = 'active',
    polar_subscription_id = 'sub_test_123',
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + INTERVAL '1 month'
WHERE polar_customer_id = '93853d15-fda5-4468-a2ec-c11831cc8822';
```

Then refresh your settings page - you should see "Business Plan"!

---

## 📝 Summary

**What webhooks do:**
- Notify your app when subscriptions are created/updated
- Automatically update your database
- Keep everything in sync

**Why ngrok:**
- Polar can't reach `localhost` directly
- ngrok creates a public URL that forwards to your localhost
- Only needed for local development

**Production:**
- Use your real domain: `https://yourdomain.com/api/webhooks/polar`
- No ngrok needed!

---

## 🎉 Once Webhooks are Setup

Your subscription flow will be complete:

```
User clicks "Upgrade"
  ↓
Creates checkout session
  ↓
User completes payment on Polar
  ↓
Polar sends webhook to your app
  ↓
Webhook updates database (tier = business)
  ↓
User redirected back
  ↓
UI shows updated tier ✅
```

---

**Need help?** Let me know if you get stuck at any step!

