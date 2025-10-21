-- =====================================================
-- ASSET TRACER - DATABASE SCHEMA FIX
-- =====================================================
-- This script fixes the missing created_by column in the assets table
-- Run this in Supabase SQL Editor to fix the schema mismatch
-- =====================================================

-- Add created_by column to assets table if it doesn't exist
DO $$ 
BEGIN
    -- Check if created_by column exists in assets table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'assets' 
        AND column_name = 'created_by'
    ) THEN
        -- Add the created_by column
        ALTER TABLE assets ADD COLUMN created_by UUID;
        
        -- Add comment
        COMMENT ON COLUMN assets.created_by IS 'User who created this asset';
        
        RAISE NOTICE '✅ Added created_by column to assets table';
    ELSE
        RAISE NOTICE 'ℹ️ created_by column already exists in assets table';
    END IF;
END $$;

-- Verify the fix by checking the assets table schema
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'assets' 
ORDER BY ordinal_position;
