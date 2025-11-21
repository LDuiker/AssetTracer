-- =====================================================
-- VERIFY ALL REQUIRED TABLES EXIST IN PRODUCTION
-- =====================================================
-- Run this query in Supabase SQL Editor
-- Location: Supabase Dashboard → SQL Editor
-- =====================================================

-- =====================================================
-- 1. CHECK ALL REQUIRED TABLES
-- =====================================================
-- This query verifies all required tables exist

SELECT 
  tablename as "Table Name",
  CASE 
    WHEN tablename IN (
      'users',
      'organizations',
      'assets',
      'invoices',
      'invoice_items',
      'quotations',
      'quotation_items',
      'clients',
      'transactions',
      'subscriptions',
      'organization_members',
      'team_invitations',
      'inventory_items'
    ) THEN '✅ REQUIRED'
    ELSE '⚠️ OPTIONAL'
  END as "Status",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = tablename
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as "Exists"
FROM (
  SELECT unnest(ARRAY[
    'users',
    'organizations',
    'assets',
    'invoices',
    'invoice_items',
    'quotations',
    'quotation_items',
    'clients',
    'transactions',
    'subscriptions',
    'organization_members',
    'team_invitations',
    'inventory_items'
  ]) as tablename
) required_tables
ORDER BY 
  CASE WHEN "Status" = '✅ REQUIRED' THEN 0 ELSE 1 END,
  "Table Name";

-- =====================================================
-- 2. GET TABLE ROW COUNTS
-- =====================================================
-- Check how many records exist in each table
-- This helps verify tables are being used

SELECT 
  schemaname,
  tablename,
  n_live_tup as "Row Count"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'organizations',
    'assets',
    'invoices',
    'invoice_items',
    'quotations',
    'quotation_items',
    'clients',
    'transactions',
    'subscriptions',
    'organization_members',
    'team_invitations',
    'inventory_items'
  )
ORDER BY tablename;

-- =====================================================
-- 3. VERIFY TABLE STRUCTURE (SAMPLE)
-- =====================================================
-- Check that key columns exist in critical tables

-- Check users table
SELECT 
  'users' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('id', 'email', 'name', 'organization_id')
ORDER BY column_name;

-- Check organizations table
SELECT 
  'organizations' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
  AND column_name IN ('id', 'name', 'subscription_tier', 'polar_customer_id')
ORDER BY column_name;

-- Check invoices table
SELECT 
  'invoices' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoices'
  AND column_name IN ('id', 'invoice_number', 'organization_id', 'client_id', 'status')
ORDER BY column_name;

-- Check quotations table
SELECT 
  'quotations' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'quotations'
  AND column_name IN ('id', 'quotation_number', 'organization_id', 'client_id', 'status')
ORDER BY column_name;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================
-- 
-- Query 1: Should show all 13 tables with "✅ REQUIRED" and "✅ EXISTS"
-- Query 2: Shows row counts (may be 0 for new databases, that's OK)
-- Query 3: Shows key columns exist in critical tables
--
-- If any table shows "❌ MISSING", that table needs to be created!
-- =====================================================

