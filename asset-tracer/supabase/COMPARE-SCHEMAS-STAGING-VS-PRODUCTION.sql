-- Compare Database Schemas: Staging vs Production
-- Run this in BOTH environments and compare the outputs
-- They should be IDENTICAL before deploying code changes

-- ============================================================
-- PART 1: ALL UNIQUE CONSTRAINTS AND INDEXES
-- ============================================================
SELECT 
  'INDEXES' as check_type,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'organizations', 'organization_members',
    'clients', 'assets', 'quotations', 'quotation_items',
    'invoices', 'invoice_items', 'subscriptions',
    'team_invitations', 'inventory_items', 'transactions', 'expenses'
  )
ORDER BY tablename, indexname;

-- ============================================================
-- PART 2: ALL TABLE CONSTRAINTS
-- ============================================================
SELECT 
  'CONSTRAINTS' as check_type,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY', 'FOREIGN KEY')
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================================
-- PART 3: CRITICAL BUSINESS LOGIC CONSTRAINTS
-- ============================================================

-- Check quotation_number constraint (MUST be per-organization)
SELECT 
  'QUOTATIONS' as table_name,
  indexname,
  indexdef,
  CASE 
    WHEN indexdef LIKE '%organization_id%' AND indexdef LIKE '%quotation_number%' 
    THEN '✅ PER-ORG (Correct)'
    WHEN indexdef LIKE '%quotation_number%' AND indexdef NOT LIKE '%organization_id%'
    THEN '❌ GLOBAL (Wrong - will cause issues)'
    ELSE '⚠️ Unknown'
  END as status
FROM pg_indexes
WHERE tablename = 'quotations' 
  AND indexname LIKE '%quotation_number%';

-- Check invoice_number constraint (MUST be per-organization)
SELECT 
  'INVOICES' as table_name,
  indexname,
  indexdef,
  CASE 
    WHEN indexdef LIKE '%organization_id%' AND indexdef LIKE '%invoice_number%' 
    THEN '✅ PER-ORG (Correct)'
    WHEN indexdef LIKE '%invoice_number%' AND indexdef NOT LIKE '%organization_id%'
    THEN '❌ GLOBAL (Wrong - will cause issues)'
    ELSE '⚠️ Unknown'
  END as status
FROM pg_indexes
WHERE tablename = 'invoices' 
  AND indexname LIKE '%invoice_number%';

-- ============================================================
-- PART 4: RLS (Row Level Security) STATUS
-- ============================================================
SELECT 
  'RLS_STATUS' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================
-- PART 5: TABLE COLUMNS COMPARISON
-- ============================================================
SELECT 
  'COLUMNS' as check_type,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'organizations', 'organization_members',
    'clients', 'assets', 'quotations', 'quotation_items',
    'invoices', 'invoice_items', 'subscriptions'
  )
ORDER BY table_name, ordinal_position;

-- ============================================================
-- INSTRUCTIONS
-- ============================================================
-- 1. Run this script in STAGING Supabase → SQL Editor
-- 2. Copy all results to a file: "staging-schema.txt"
-- 3. Run this script in PRODUCTION Supabase → SQL Editor  
-- 4. Copy all results to a file: "production-schema.txt"
-- 5. Compare the two files (use a diff tool or manual comparison)
-- 6. Fix any differences BEFORE deploying code changes
-- 
-- CRITICAL: Parts 3 (quotations/invoices) must show "✅ PER-ORG (Correct)"
--           If they show "❌ GLOBAL", run the FIX-*-CONSTRAINT-PRODUCTION.sql scripts

