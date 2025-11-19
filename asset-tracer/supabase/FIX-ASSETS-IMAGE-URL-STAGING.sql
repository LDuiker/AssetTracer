-- =====================================================
-- ASSET TRACER - ADD IMAGE_URL COLUMN TO ASSETS TABLE
-- =====================================================
-- This script adds the missing image_url column to the assets table
-- Run this in Supabase SQL Editor (STAGING) to fix the schema mismatch
-- =====================================================

-- Add image_url column to assets table if it doesn't exist
DO $$ 
BEGIN
    -- Check if image_url column exists in assets table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'assets' 
        AND column_name = 'image_url'
    ) THEN
        -- Add the image_url column
        ALTER TABLE assets ADD COLUMN image_url TEXT;
        
        -- Add comment
        COMMENT ON COLUMN assets.image_url IS 'URL to the asset image';
        
        RAISE NOTICE '✅ Added image_url column to assets table';
    ELSE
        RAISE NOTICE 'ℹ️ image_url column already exists in assets table';
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

