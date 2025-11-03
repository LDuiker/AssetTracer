-- =====================================================
-- EXPORT PRODUCTION SCHEMA
-- =====================================================
-- Run this in your PRODUCTION Supabase database
-- This shows you all the tables and their structure
-- Use this to verify what needs to be cloned
-- =====================================================

-- List all tables
SELECT 
  '📋 ALL TABLES' as section,
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Get column details for all tables
SELECT 
  '📊 TABLE STRUCTURES' as section,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Get all foreign keys
SELECT
  '🔗 FOREIGN KEYS' as section,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- Get all indexes
SELECT
  '📇 INDEXES' as section,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Get all functions
SELECT
  '⚙️ FUNCTIONS' as section,
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prokind = 'f';

-- Get all triggers
SELECT
  '🎯 TRIGGERS' as section,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Get RLS status
SELECT
  '🔒 ROW LEVEL SECURITY' as section,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Get all policies
SELECT
  '🛡️ RLS POLICIES' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Get storage buckets
SELECT
  '📦 STORAGE BUCKETS' as section,
  id,
  name,
  public
FROM storage.buckets
ORDER BY name;

-- Count records in each table
DO $$
DECLARE
  t record;
  v_count integer;
BEGIN
  RAISE NOTICE '📊 RECORD COUNTS';
  RAISE NOTICE '==================';
  
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', t.table_name) INTO v_count;
    RAISE NOTICE '% : % records', t.table_name, v_count;
  END LOOP;
END $$;

-- Summary
SELECT 
  '✅ EXPORT COMPLETE' as status,
  'Check the results above' as message,
  'Copy these results to compare with staging' as next_step;

