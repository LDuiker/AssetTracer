-- =====================================================
-- EXPORT STAGING DATABASE SCHEMA
-- =====================================================
-- Run this in your STAGING Supabase SQL Editor (ougntjrrskfsuognjmcw)
-- Copy ALL the output and save it
-- =====================================================

-- Step 1: List all tables
SELECT 
  '=== ALL TABLES IN STAGING ===' as section,
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 2: Get detailed schema for each table
SELECT 
  '=== DETAILED TABLE SCHEMAS ===' as section;

-- Step 3: Generate CREATE TABLE statements for all tables
SELECT 
  '-- Table: ' || tablename as section,
  pg_get_tabledef(schemaname || '.' || tablename) as create_statement
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Alternative: Show columns for each table
SELECT 
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Step 4: Show foreign key constraints
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Step 5: Show indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Step 6: Count rows in each table
SELECT 
  tablename,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT 
    tablename,
    query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I.%I', 
                        schemaname, tablename), false, true, '') as xml_count
  FROM pg_tables
  WHERE schemaname = 'public'
) t
ORDER BY tablename;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. Run this entire script in your STAGING database
-- 2. Copy ALL the output
-- 3. Save it as "staging-schema-export.txt"
-- 4. Share it with me or paste it in chat
-- 5. I'll create the missing tables for production
-- =====================================================

