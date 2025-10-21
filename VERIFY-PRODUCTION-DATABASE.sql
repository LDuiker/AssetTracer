-- =====================================================
-- PRODUCTION DATABASE VERIFICATION SCRIPT
-- =====================================================
-- Run this in Supabase SQL Editor to verify your setup
-- =====================================================

-- =====================================================
-- 1. CHECK ALL TABLES
-- =====================================================
SELECT 
    '📊 TABLES' as section,
    '' as spacer;

SELECT 
    schemaname as schema,
    tablename as table_name,
    CASE 
        WHEN rowsecurity THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 2. COUNT ROWS IN EACH TABLE
-- =====================================================
SELECT 
    '' as spacer,
    '📈 ROW COUNTS' as section,
    '' as spacer2;

SELECT 
    'organizations' as table_name,
    COUNT(*) as row_count
FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'assets', COUNT(*) FROM assets
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'invoice_items', COUNT(*) FROM invoice_items
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'quotations', COUNT(*) FROM quotations WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotations')
UNION ALL
SELECT 'quotation_items', COUNT(*) FROM quotation_items WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotation_items')
UNION ALL
SELECT 'team_invitations', COUNT(*) FROM team_invitations WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_invitations')
UNION ALL
SELECT 'inventory_items', COUNT(*) FROM inventory_items WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items')
ORDER BY table_name;

-- =====================================================
-- 3. CHECK ORGANIZATIONS TABLE COLUMNS
-- =====================================================
SELECT 
    '' as spacer,
    '🏢 ORGANIZATIONS TABLE STRUCTURE' as section,
    '' as spacer2;

SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN '❌ Nullable' ELSE '✅ NOT NULL' END as nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'organizations'
ORDER BY ordinal_position;

-- =====================================================
-- 4. CHECK USERS TABLE COLUMNS
-- =====================================================
SELECT 
    '' as spacer,
    '👤 USERS TABLE STRUCTURE' as section,
    '' as spacer2;

SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN '❌ Nullable' ELSE '✅ NOT NULL' END as nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- 5. CHECK POLAR SUBSCRIPTION FIELDS
-- =====================================================
SELECT 
    '' as spacer,
    '💳 POLAR SUBSCRIPTION FIELDS CHECK' as section,
    '' as spacer2;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' 
            AND column_name = 'subscription_tier'
        ) THEN '✅ subscription_tier exists'
        ELSE '❌ subscription_tier MISSING'
    END as polar_check_1,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' 
            AND column_name = 'polar_customer_id'
        ) THEN '✅ polar_customer_id exists'
        ELSE '❌ polar_customer_id MISSING'
    END as polar_check_2,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' 
            AND column_name = 'polar_subscription_id'
        ) THEN '✅ polar_subscription_id exists'
        ELSE '❌ polar_subscription_id MISSING'
    END as polar_check_3;

-- =====================================================
-- 6. CHECK EMAIL NOTIFICATIONS FIELD
-- =====================================================
SELECT 
    '' as spacer,
    '📧 EMAIL NOTIFICATIONS CHECK' as section,
    '' as spacer2;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' 
            AND column_name = 'email_notifications_enabled'
        ) THEN '✅ email_notifications_enabled exists'
        ELSE '❌ email_notifications_enabled MISSING'
    END as email_check;

-- =====================================================
-- 7. CHECK TEAM MANAGEMENT FEATURES
-- =====================================================
SELECT 
    '' as spacer,
    '👥 TEAM MANAGEMENT CHECK' as section,
    '' as spacer2;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'team_invitations'
        ) THEN '✅ team_invitations table exists'
        ELSE '❌ team_invitations table MISSING'
    END as team_table_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'role'
        ) THEN '✅ users.role column exists'
        ELSE '❌ users.role column MISSING'
    END as role_column_check;

-- =====================================================
-- 8. CHECK QUOTATIONS TABLES
-- =====================================================
SELECT 
    '' as spacer,
    '📝 QUOTATIONS CHECK' as section,
    '' as spacer2;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'quotations'
        ) THEN '✅ quotations table exists'
        ELSE '❌ quotations table MISSING'
    END as quotations_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'quotation_items'
        ) THEN '✅ quotation_items table exists'
        ELSE '❌ quotation_items table MISSING'
    END as quotation_items_check;

-- =====================================================
-- 9. CHECK DATABASE FUNCTIONS
-- =====================================================
SELECT 
    '' as spacer,
    '⚙️ DATABASE FUNCTIONS' as section,
    '' as spacer2;

SELECT 
    routine_name as function_name,
    routine_type as type,
    CASE 
        WHEN routine_name LIKE 'get_%' THEN '✅ Financial Function'
        ELSE '📦 Other Function'
    END as category
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN (
        'get_asset_financials',
        'get_monthly_pl',
        'get_financial_summary',
        'get_asset_roi_rankings'
    )
ORDER BY routine_name;

-- =====================================================
-- 10. CHECK MISSING CRITICAL FUNCTIONS
-- =====================================================
SELECT 
    '' as spacer,
    '🔍 MISSING FUNCTIONS CHECK' as section,
    '' as spacer2;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_asset_financials'
        ) THEN '✅ get_asset_financials exists'
        ELSE '❌ get_asset_financials MISSING - Run functions.sql'
    END as function_check_1,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_monthly_pl'
        ) THEN '✅ get_monthly_pl exists'
        ELSE '❌ get_monthly_pl MISSING - Run functions.sql'
    END as function_check_2,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_financial_summary'
        ) THEN '✅ get_financial_summary exists'
        ELSE '❌ get_financial_summary MISSING - Run functions.sql'
    END as function_check_3;

-- =====================================================
-- 11. CHECK INDEXES
-- =====================================================
SELECT 
    '' as spacer,
    '🔍 INDEXES' as section,
    '' as spacer2;

SELECT 
    tablename as table_name,
    indexname as index_name,
    indexdef as definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 12. CHECK RLS POLICIES
-- =====================================================
SELECT 
    '' as spacer,
    '🔒 ROW LEVEL SECURITY POLICIES' as section,
    '' as spacer2;

SELECT 
    schemaname as schema,
    tablename as table_name,
    policyname as policy_name,
    CASE 
        WHEN cmd = '*' THEN 'ALL'
        WHEN cmd = 'r' THEN 'SELECT'
        WHEN cmd = 'a' THEN 'INSERT'
        WHEN cmd = 'w' THEN 'UPDATE'
        WHEN cmd = 'd' THEN 'DELETE'
        ELSE cmd
    END as command,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 13. SUMMARY REPORT
-- =====================================================
SELECT 
    '' as spacer,
    '📊 SETUP SUMMARY' as section,
    '' as spacer2;

WITH table_counts AS (
    SELECT COUNT(*) as total_tables
    FROM pg_tables
    WHERE schemaname = 'public'
),
function_counts AS (
    SELECT COUNT(*) as total_functions
    FROM information_schema.routines
    WHERE routine_schema = 'public'
        AND routine_name LIKE 'get_%'
),
policy_counts AS (
    SELECT COUNT(*) as total_policies
    FROM pg_policies
    WHERE schemaname = 'public'
)
SELECT 
    tc.total_tables || ' tables' as tables_created,
    fc.total_functions || ' financial functions' as functions_created,
    pc.total_policies || ' RLS policies' as security_policies,
    CASE 
        WHEN tc.total_tables >= 12 
            AND fc.total_functions >= 4 
            AND pc.total_policies > 0 
        THEN '✅ Database is fully set up!'
        WHEN tc.total_tables >= 8 
        THEN '⚠️ Core tables exist, but missing some features'
        ELSE '❌ Incomplete setup - continue migrations'
    END as overall_status
FROM table_counts tc, function_counts fc, policy_counts pc;

-- =====================================================
-- End of Verification Script
-- =====================================================

