-- Add created_by column to assets table if it doesn't exist
-- This ensures the assets table matches the expected schema

DO $$ 
BEGIN
    -- Check if created_by column exists
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
        
        RAISE NOTICE 'Added created_by column to assets table';
    ELSE
        RAISE NOTICE 'created_by column already exists in assets table';
    END IF;
END $$;
