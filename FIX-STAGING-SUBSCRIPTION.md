# 🔧 Fix Staging Subscription Issue

## 🔍 Problem
You upgraded to Pro in staging (Polar sandbox), payment showed successful, but dashboard still shows Free plan.

## 💡 Why This Happens

**Most Common Causes:**
1. **Webhook didn't fire** - Polar sandbox webhooks can be unreliable
2. **Webhook not configured** - Need to set up webhook URL in Polar
3. **Metadata not passed** - Tier information missing from checkout

## ✅ Quick Fix - Manual Sync

### **Step 1: Use the Manual Sync Button**

In your staging app:

1. Go to: **https://assettracer-staging.vercel.app/settings?tab=billing**
2. Look for the **"Sync Subscription"** button
3. Click it
4. Wait 2-3 seconds
5. Refresh the page
6. Your tier should now show **Pro**!

---

### **Step 2: If No Sync Button, Use API Directly**

Run this in PowerShell:

```powershell
# Get your staging URL and user token
$stagingUrl = "https://assettracer-staging.vercel.app"

# You need to be logged in to staging first, then run:
Invoke-RestMethod -Uri "$stagingUrl/api/subscription/sync" -Method Post
```

---

## 🔍 **Diagnostic Checks**

### **Check 1: Verify Polar Subscription Exists**

1. Log into Polar Sandbox: https://sandbox.polar.sh
2. Go to **Subscriptions**
3. Look for your recent subscription
4. Status should be: **Active** or **Trialing**
5. Check if metadata includes: `"tier": "pro"`

### **Check 2: Check Your Organization Data**

Run this SQL in **Staging Supabase**:

```sql
-- Check current organization status
SELECT 
    name,
    subscription_tier,
    subscription_status,
    polar_subscription_id,
    polar_customer_id,
    polar_metadata
FROM organizations
WHERE id = (SELECT organization_id FROM users LIMIT 1);
```

**Expected after fix:**
- `subscription_tier`: `pro`
- `subscription_status`: `active`
- `polar_subscription_id`: Should have a value
- `polar_customer_id`: Should have a value

---

## 🔧 **Manual Database Fix (If Sync Doesn't Work)**

If the sync button doesn't work, you can manually update the database:

```sql
-- OPTION 1: Quick tier update (temporary fix)
UPDATE organizations
SET 
    subscription_tier = 'pro',
    subscription_status = 'active',
    updated_at = NOW()
WHERE id = (SELECT organization_id FROM users LIMIT 1);

-- OPTION 2: Full subscription details (if you know them)
UPDATE organizations
SET 
    subscription_tier = 'pro',
    subscription_status = 'active',
    polar_subscription_id = 'YOUR_SUBSCRIPTION_ID_FROM_POLAR',
    polar_subscription_status = 'active',
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + INTERVAL '30 days',
    updated_at = NOW()
WHERE id = (SELECT organization_id FROM users LIMIT 1);
```

---

## 🎯 **Root Cause: Webhooks Not Configured**

For production, make sure webhooks are set up:

### **Configure Polar Webhooks**

1. Log into Polar: https://polar.sh
2. Go to **Settings → Webhooks**
3. Click **"Add Webhook"**
4. Enter:
   - **URL:** `https://www.asset-tracer.com/api/webhooks/polar`
   - **Events:** Select all subscription events:
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
     - `subscription.payment_succeeded`
     - `subscription.payment_failed`
5. Click **Save**

### **For Staging (Optional)**

Staging webhook URL:
```
https://assettracer-staging.vercel.app/api/webhooks/polar
```

**Note:** Polar sandbox webhooks can be flaky, so manual sync is more reliable for testing.

---

## 🧪 **Test Subscription Sync**

After fixing, verify it worked:

```sql
-- Check updated subscription
SELECT 
    name,
    subscription_tier,
    subscription_status,
    polar_subscription_id,
    updated_at
FROM organizations
WHERE id = (SELECT organization_id FROM users LIMIT 1);
```

**Should show:**
- ✅ `subscription_tier`: `pro`
- ✅ `subscription_status`: `active`
- ✅ `polar_subscription_id`: Has value
- ✅ `updated_at`: Recent timestamp

---

## 📊 **Verify in Dashboard**

After sync/fix:

1. **Refresh your staging dashboard**
2. Look for **Pro badge** next to your profile
3. Check **Settings → Billing** tab
4. Should show:
   - Current Plan: **Pro**
   - Status: **Active**
   - Features: All Pro features unlocked

---

## 🚨 **Common Issues**

### Issue 1: "No Polar customer ID found"

**Cause:** Organization not linked to Polar customer

**Fix:**
```sql
-- Check if polar_customer_id exists
SELECT polar_customer_id FROM organizations 
WHERE id = (SELECT organization_id FROM users LIMIT 1);

-- If NULL, you need to create a checkout first
-- Go back to staging and click upgrade again
```

### Issue 2: Sync returns "No active subscription"

**Cause:** Subscription not active in Polar

**Fix:**
1. Check Polar dashboard: https://sandbox.polar.sh
2. Look for the subscription
3. If canceled, create a new one
4. Make sure status is "active" or "trialing"

### Issue 3: Still shows Free after sync

**Cause:** Browser cache or React context not updated

**Fix:**
1. **Hard refresh:** Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
2. **Clear cache:** Clear browser cache and cookies
3. **Re-login:** Log out and log back in
4. **Check database:** Make sure DB actually updated

---

## ✅ **Quick Resolution Steps**

1. **Try manual sync button** in Settings → Billing
2. **If that fails:** Run sync API manually
3. **If that fails:** Update database directly with SQL
4. **Then:** Hard refresh browser (Ctrl + Shift + R)
5. **Verify:** Check dashboard shows Pro plan

---

## 🎯 **Prevention for Production**

To avoid this in production:

1. ✅ **Configure Polar webhooks** (see above)
2. ✅ **Add fallback polling** - Check Polar every hour
3. ✅ **Add sync button** - Let users manually sync
4. ✅ **Monitor webhook logs** - Check if webhooks are firing

---

## 🆘 **Still Not Working?**

If nothing works:

1. **Check Vercel logs:**
   - Go to Vercel → Your Project → Logs
   - Filter by: `/api/subscription/sync`
   - Look for errors

2. **Check Supabase logs:**
   - Go to Supabase → Logs
   - Check for database errors

3. **Check Polar logs:**
   - Go to Polar → Webhooks
   - Check delivery status

---

**Try the manual sync button first - it should fix it instantly!** 🚀

