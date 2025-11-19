-- =====================================================
-- ASSET TRACER - REFRESH SUPABASE SCHEMA CACHE
-- =====================================================
-- This script refreshes Supabase's PostgREST schema cache
-- Run this in Supabase SQL Editor (STAGING) to fix schema cache issues
-- =====================================================
-- 
-- The error "Could not find the 'image_url' column" is caused by
-- Supabase's schema cache being out of sync, even though the column exists.
-- This script forces a cache refresh.
-- =====================================================

-- Method 1: Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Method 2: If Method 1 doesn't work, you can also try:
-- This will trigger a schema reload by accessing the schema
SELECT pg_notify('pgrst', 'reload schema');

-- Method 3: Force a dummy query that touches the assets table
-- This sometimes helps refresh the cache
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assets' 
AND column_name = 'image_url';

-- Verify image_url column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'assets' 
AND column_name = 'image_url';

-- If the above doesn't work, you may need to:
-- 1. Go to Supabase Dashboard > Settings > API
-- 2. Click "Reload Schema" button
-- OR
-- 3. Wait a few minutes for the cache to auto-refresh

