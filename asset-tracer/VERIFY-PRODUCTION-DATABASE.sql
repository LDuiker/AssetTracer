-- =====================================================
-- VERIFY PRODUCTION DATABASE SECURITY
-- =====================================================
-- Run these queries in Supabase SQL Editor
-- Location: Supabase Dashboard → SQL Editor
-- =====================================================

-- =====================================================
-- 1. CHECK ROW LEVEL SECURITY (RLS) STATUS
-- =====================================================
-- This query shows which tables have RLS enabled
-- All tables should show rowsecurity = true

SELECT 
  tablename,
  rowsecurity as "RLS Enabled",
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED' 
    ELSE '❌ DISABLED - SECURITY RISK!' 
  END as "Status"
FROM pg_tables 
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

-- Expected Result: All tables should show "✅ ENABLED"
-- If any table shows "❌ DISABLED", that's a security risk!

-- =====================================================
-- 2. CHECK RLS POLICIES EXIST
-- =====================================================
-- This query shows what RLS policies are defined
-- Each table should have policies for SELECT, INSERT, UPDATE, DELETE

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "Command",
  qual as "Using Expression",
  with_check as "With Check Expression"
FROM pg_policies
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
ORDER BY tablename, cmd, policyname;

-- Expected: Each table should have policies for:
-- - SELECT (read access)
-- - INSERT (create access)
-- - UPDATE (modify access)
-- - DELETE (remove access)

-- =====================================================
-- 3. VERIFY UNIQUE CONSTRAINTS FOR QUOTATIONS
-- =====================================================
-- This checks that quotation_number is unique per organization
-- NOT globally unique (which would cause conflicts)

SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as "Columns",
  CASE 
    WHEN tc.constraint_name LIKE '%organization_id%' AND tc.constraint_name LIKE '%quotation_number%' 
      THEN '✅ CORRECT - Per-organization uniqueness'
    WHEN tc.constraint_name LIKE '%quotation_number%' AND tc.constraint_name NOT LIKE '%organization_id%'
      THEN '❌ WRONG - Global uniqueness (will cause conflicts!)'
    ELSE '⚠️ CHECK MANUALLY'
  END as "Status"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'quotations'
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.constraint_name;

-- Expected Result: Should see constraint like:
-- "quotations_organization_id_quotation_number_key" or
-- "quotations_quotation_number_organization_id_key"
-- Status should be "✅ CORRECT - Per-organization uniqueness"

-- =====================================================
-- 4. VERIFY UNIQUE CONSTRAINTS FOR INVOICES
-- =====================================================
-- This checks that invoice_number is unique per organization
-- NOT globally unique (which would cause conflicts)

SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as "Columns",
  CASE 
    WHEN tc.constraint_name LIKE '%organization_id%' AND tc.constraint_name LIKE '%invoice_number%' 
      THEN '✅ CORRECT - Per-organization uniqueness'
    WHEN tc.constraint_name LIKE '%invoice_number%' AND tc.constraint_name NOT LIKE '%organization_id%'
      THEN '❌ WRONG - Global uniqueness (will cause conflicts!)'
    ELSE '⚠️ CHECK MANUALLY'
  END as "Status"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'invoices'
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.constraint_name;

-- Expected Result: Should see constraint like:
-- "invoices_organization_id_invoice_number_key" or
-- "invoices_invoice_number_organization_id_key"
-- Status should be "✅ CORRECT - Per-organization uniqueness"

-- =====================================================
-- 5. CHECK ALL UNIQUE CONSTRAINTS (SUMMARY)
-- =====================================================
-- Quick overview of all unique constraints

SELECT 
  tc.table_name,
  tc.constraint_name,
  STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as "Columns"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('quotations', 'invoices', 'clients', 'assets', 'users', 'organizations')
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 6. VERIFY FOREIGN KEY CONSTRAINTS
-- =====================================================
-- Check that foreign keys are properly set up
-- This ensures data integrity

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'invoices',
    'invoice_items',
    'quotations',
    'quotation_items',
    'assets',
    'clients'
  )
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- INTERPRETATION GUIDE
-- =====================================================
-- 
-- RLS STATUS:
-- ✅ All tables should show "✅ ENABLED"
-- ❌ If any table shows "❌ DISABLED", run:
--    ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
--
-- QUOTATIONS CONSTRAINT:
-- ✅ Should have constraint with BOTH organization_id AND quotation_number
-- ❌ If constraint only has quotation_number (no organization_id), it's wrong!
--    Fix: Drop wrong constraint and create correct one
--
-- INVOICES CONSTRAINT:
-- ✅ Should have constraint with BOTH organization_id AND invoice_number
-- ❌ If constraint only has invoice_number (no organization_id), it's wrong!
--    Fix: Drop wrong constraint and create correct one
--
-- =====================================================

