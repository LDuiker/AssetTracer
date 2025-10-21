-- =====================================================
-- SIMPLE: Add phone column to users table
-- =====================================================
-- Run this script to add the phone column
-- =====================================================

-- Add phone column
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment
COMMENT ON COLUMN users.phone IS 'User contact phone number';

-- Verify it was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

