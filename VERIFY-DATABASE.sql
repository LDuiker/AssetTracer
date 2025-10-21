-- VERIFY DATABASE SETUP
-- Run this in your Supabase SQL Editor to check what exists

-- 1. List all tables in your database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check if assets table exists specifically
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'assets'
) as assets_table_exists;

-- 3. If assets exists, count rows
SELECT COUNT(*) as asset_count FROM assets;

-- 4. Check users table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) as users_table_exists;

-- 5. Check organizations table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations'
) as organizations_table_exists;

-- 6. List all tables with their row counts
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

