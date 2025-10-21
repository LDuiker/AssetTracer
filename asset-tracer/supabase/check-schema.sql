-- Run this in Supabase SQL Editor to check your table structure

-- Check what columns exist in the transactions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'transactions'
ORDER BY ordinal_position;

-- If transactions table doesn't exist, check what tables you do have
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

