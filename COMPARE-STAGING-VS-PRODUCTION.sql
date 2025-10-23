-- =====================================================
-- COMPARE STAGING VS PRODUCTION
-- =====================================================
-- Run this in your PRODUCTION database
-- It shows what you currently have
-- =====================================================

-- Current table count
SELECT 
  COUNT(*) as total_tables_in_production,
  '(Staging has 14 tables)' as note
FROM pg_tables
WHERE schemaname = 'public';

-- List all current tables
SELECT 
  '=== PRODUCTION TABLES ===' as section,
  ROW_NUMBER() OVER (ORDER BY tablename) as table_number,
  tablename,
  (xpath('/row/cnt/text()', 
    query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I.%I', 
                        schemaname, tablename), false, true, '')
  ))[1]::text::int as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show column details for all tables
SELECT 
  '=== ALL COLUMNS IN PRODUCTION ===' as section,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =====================================================
-- NEXT STEPS
-- =====================================================
-- 1. Run this in PRODUCTION to see what you have
-- 2. Run EXPORT-STAGING-SCHEMA.sql in STAGING
-- 3. Share both outputs with me
-- 4. I'll create SQL to add missing tables
-- =====================================================

