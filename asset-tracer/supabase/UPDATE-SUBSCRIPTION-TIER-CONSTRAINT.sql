-- =====================================================
-- Update Subscription Tier Constraint to Include Business
-- =====================================================
-- This updates the CHECK constraint to allow 'business' tier
-- Run this if you get constraint violation errors
-- =====================================================

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE organizations
DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;

-- Step 2: Add the updated CHECK constraint with 'business' included (no enterprise)
ALTER TABLE organizations
ADD CONSTRAINT organizations_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'pro', 'business'));

-- Step 3: Verify the constraint was updated
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'organizations_subscription_tier_check';

-- Step 4: Test that 'business' tier is now allowed
-- (This is just a test - it will rollback)
DO $$
DECLARE
  test_org_id UUID;
BEGIN
  -- Get a test organization
  SELECT id INTO test_org_id FROM organizations LIMIT 1;
  
  IF test_org_id IS NOT NULL THEN
    -- Try to set to business (won't actually commit)
    UPDATE organizations
    SET subscription_tier = 'business'
    WHERE id = test_org_id;
    
    RAISE NOTICE '✅ SUCCESS: Business tier is now allowed!';
    
    -- Rollback the test change
    RAISE EXCEPTION 'Rolling back test change...';
  ELSE
    RAISE NOTICE '⚠️  No organizations found to test with';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test completed - changes rolled back';
END $$;

-- Step 5: Show all allowed tiers
SELECT 'free' as tier, 'Free Plan - $0/month' as description
UNION ALL
SELECT 'pro', 'Pro Plan - $19/month'
UNION ALL
SELECT 'business', 'Business Plan - $39/month';

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Subscription tier constraint updated!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Allowed tiers: free, pro, business';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now upgrade to Pro or Business plan!';
  RAISE NOTICE '================================================';
END $$;

