-- =====================================================
-- FIX USER PROFILE UPDATES
-- =====================================================
-- This script ensures users can update their own profiles
-- Run this if you're getting errors when saving profile settings
-- =====================================================

-- Step 1: Add phone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE users ADD COLUMN phone TEXT;
        COMMENT ON COLUMN users.phone IS 'User contact phone number';
        RAISE NOTICE '✅ Added phone column to users table';
    ELSE
        RAISE NOTICE 'ℹ️ phone column already exists';
    END IF;
END $$;

-- Step 2: Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Step 4: Create policy for users to read their own record
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Step 5: Create policy for users to update their own record
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 6: Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 7: Verify the phone column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('id', 'name', 'email', 'phone', 'organization_id')
ORDER BY ordinal_position;

-- =====================================================
-- SUCCESS MESSAGES
-- =====================================================
-- If you see this without errors, the fix is complete!
-- You should now be able to update your profile in the Settings page.
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ User profile update fix completed successfully!';
    RAISE NOTICE 'ℹ️ Users can now update their own name and phone number';
    RAISE NOTICE 'ℹ️ RLS policies are in place for security';
END $$;

