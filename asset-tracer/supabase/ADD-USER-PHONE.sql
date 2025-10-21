-- Add phone column to users table
-- This allows users to store their contact phone number in their profile

DO $$ 
BEGIN
    -- Check if phone column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'phone'
    ) THEN
        -- Add the phone column
        ALTER TABLE users ADD COLUMN phone TEXT;
        
        -- Add comment
        COMMENT ON COLUMN users.phone IS 'User contact phone number';
        
        RAISE NOTICE '✅ Added phone column to users table';
    ELSE
        RAISE NOTICE 'ℹ️ phone column already exists in users table';
    END IF;
END $$;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

