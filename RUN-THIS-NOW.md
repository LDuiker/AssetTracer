# 🚀 RUN THIS NOW - Fix Database in 2 Minutes

## What Happened?
Your database is missing the Polar subscription columns. Let's add them!

---

## 📝 Step-by-Step Instructions

### 1️⃣ Open Supabase Dashboard

Go to: **https://supabase.com**

Click on your **AssetTracer** project

### 2️⃣ Open SQL Editor

In the left sidebar, click: **SQL Editor**

### 3️⃣ Create New Query

Click the **"New Query"** button (top right)

### 4️⃣ Copy This SQL

Open the file `COMPLETE-POLAR-MIGRATION.sql` in this folder

**OR** copy this entire block:

```sql
-- Add subscription tier fields
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'past_due'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Add Polar fields
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_product_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_subscription_status TEXT DEFAULT 'inactive' CHECK (polar_subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'inactive'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_current_period_start TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_current_period_end TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS polar_metadata JSONB DEFAULT '{}';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON organizations(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_polar_customer_id ON organizations(polar_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_polar_subscription_id ON organizations(polar_subscription_id);

-- Initialize existing records
UPDATE organizations SET subscription_tier = COALESCE(subscription_tier, 'free'), subscription_status = COALESCE(subscription_status, 'active'), polar_subscription_status = COALESCE(polar_subscription_status, 'inactive'), polar_metadata = COALESCE(polar_metadata, '{}') WHERE subscription_tier IS NULL OR polar_subscription_status IS NULL;
```

### 5️⃣ Paste & Run

1. **Paste** the SQL into the editor
2. **Click** the "Run" button (or press Ctrl+Enter)
3. **Wait** for "Success. No rows returned"

### 6️⃣ Verify It Worked

Run this verification query:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
  AND column_name LIKE 'polar%'
ORDER BY column_name;
```

You should see **7 rows** with these columns:
- polar_current_period_end
- polar_current_period_start
- polar_customer_id
- polar_metadata
- polar_product_id
- polar_subscription_id
- polar_subscription_status

---

## ✅ AFTER Migration Succeeds

### Update Your Organization to Business Tier

Run this query:

```sql
UPDATE organizations 
SET 
  subscription_tier = 'business',
  subscription_status = 'active',
  polar_customer_id = '93853d15-fda5-4468-a2ec-c11831cc8822',
  polar_subscription_status = 'active',
  polar_current_period_start = NOW(),
  polar_current_period_end = NOW() + INTERVAL '1 month'
WHERE id = (
  SELECT id FROM organizations 
  ORDER BY created_at DESC 
  LIMIT 1
);
```

This will:
- ✅ Set your tier to **Business**
- ✅ Link it to your Polar customer ID
- ✅ Mark subscription as active
- ✅ Set the billing period

---

## 🎉 Final Step

1. Go to **http://localhost:3000/settings**
2. Click the **Billing** tab
3. You should now see: **"Business Plan"**

---

## ❌ Troubleshooting

**"column already exists" error?**
- That's okay! It means some columns were already added
- The query will skip those and add the missing ones

**"table organizations does not exist" error?**
- Your database needs the base schema first
- Run `asset-tracer/supabase/complete-schema.sql` first
- Then run this migration again

**Still showing "Free Plan"?**
- Try a hard refresh: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)
- Or close and reopen your browser

**Need help?**
- Check that the UPDATE query returned "1 row affected"
- Verify your organization ID exists: `SELECT * FROM organizations;`

---

## 📚 Files Created

- ✅ `COMPLETE-POLAR-MIGRATION.sql` - Full migration with comments
- ✅ `RUN-THIS-NOW.md` - This quick guide
- ✅ `QUICK-DATABASE-SETUP.md` - Detailed explanation

All three have the same SQL, just different formats. Use whichever you prefer!

