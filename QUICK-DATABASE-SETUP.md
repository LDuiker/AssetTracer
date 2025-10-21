# 🗄️ Quick Database Setup for Polar Integration

## Problem
You got this error when trying to update your subscription tier:
```
ERROR: 42703: column "polar_customer_id" does not exist
```

## Solution: Run Database Migration

### Step 1: Run the Migration

1. **Open Supabase Dashboard**: https://supabase.com
2. **Click**: "SQL Editor" in left sidebar
3. **Click**: "New Query" button
4. **Copy** the SQL below and paste it into the editor
5. **Click**: "Run" button

```sql
-- Add Polar.sh integration fields to organizations table
-- This migration adds fields to store Polar.sh customer and subscription IDs

-- Add Polar.sh customer ID
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_customer_id TEXT;

-- Add Polar.sh subscription ID (replaces stripe_subscription_id)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT;

-- Add Polar.sh product ID to track which plan is active
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_product_id TEXT;

-- Add Polar.sh subscription status
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_subscription_status TEXT DEFAULT 'inactive' 
CHECK (polar_subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'inactive'));

-- Add Polar.sh subscription period dates
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_current_period_start TIMESTAMPTZ;
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_current_period_end TIMESTAMPTZ;

-- Add Polar.sh metadata for additional subscription info
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS polar_metadata JSONB DEFAULT '{}';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_polar_customer_id ON organizations(polar_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_polar_subscription_id ON organizations(polar_subscription_id);

-- Add comments for documentation
COMMENT ON COLUMN organizations.polar_customer_id IS 'Polar.sh customer ID for billing';
COMMENT ON COLUMN organizations.polar_subscription_id IS 'Polar.sh subscription ID';
COMMENT ON COLUMN organizations.polar_product_id IS 'Polar.sh product ID for the current plan';
COMMENT ON COLUMN organizations.polar_subscription_status IS 'Current status of Polar.sh subscription';
COMMENT ON COLUMN organizations.polar_current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN organizations.polar_current_period_end IS 'End of current billing period';
COMMENT ON COLUMN organizations.polar_metadata IS 'Additional Polar.sh subscription metadata';

-- Update existing organizations to have default values
UPDATE organizations 
SET 
  polar_subscription_status = 'inactive',
  polar_metadata = '{}'
WHERE polar_subscription_status IS NULL;
```

### Step 2: Verify Migration Worked

Run this query to check if the columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name LIKE 'polar%';
```

You should see 7 columns listed.

### Step 3: Update Your Organization to Business Tier

Now run this query to manually set your tier to Business:
```sql
UPDATE organizations 
SET 
  subscription_tier = 'business',
  subscription_status = 'active',
  polar_customer_id = '93853d15-fda5-4468-a2ec-c11831cc8822',
  polar_subscription_status = 'active',
  polar_current_period_start = NOW(),
  polar_current_period_end = NOW() + INTERVAL '1 month'
WHERE id IN (
  SELECT id FROM organizations 
  ORDER BY created_at DESC 
  LIMIT 1
);
```

### Step 4: Refresh Your App

Go to http://localhost:3000/settings and you should see **Business Plan** now! 🎉

---

## What This Migration Does

✅ Adds `polar_customer_id` - Links your org to Polar customer  
✅ Adds `polar_subscription_id` - Tracks active subscription  
✅ Adds `polar_product_id` - Stores which plan (Pro/Business)  
✅ Adds `polar_subscription_status` - Tracks subscription state  
✅ Adds `polar_current_period_start` - Billing period start  
✅ Adds `polar_current_period_end` - Billing period end  
✅ Adds `polar_metadata` - Extra subscription data  

These columns allow your app to:
- Track subscriptions from Polar
- Update automatically via webhooks
- Display current tier and billing info
- Handle subscription upgrades/downgrades

---

## Troubleshooting

**Error: "relation 'organizations' does not exist"**
- Your database might not have the organizations table yet
- Check the `supabase/complete-schema.sql` file and run that first

**Error: "permission denied"**
- Make sure you're logged into the correct Supabase project
- You need admin/owner permissions to run migrations

**Still showing wrong tier after update?**
- Try a hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check the SQL query ran successfully (should show "Success" in Supabase)

