-- =====================================================
-- QUICK DATABASE CHECK
-- =====================================================
-- Fast overview of your production database status
-- =====================================================

-- Check what tables exist
SELECT 
    '📊 TABLES IN DATABASE:' as info
UNION ALL
SELECT 
    '  ' || tablename || ' - ' || CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Off' END
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY 1;

SELECT '' as spacer, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as line;

-- Check critical missing tables
SELECT 
    '🔍 MISSING TABLES CHECK:' as info
UNION ALL
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'quotations')
        THEN '  ❌ quotations - Run CREATE-QUOTATIONS-TABLES.sql'
        ELSE '  ✅ quotations'
    END
UNION ALL
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'team_invitations')
        THEN '  ❌ team_invitations - Run ADD-TEAM-MANAGEMENT.sql'
        ELSE '  ✅ team_invitations'
    END
UNION ALL
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'inventory_items')
        THEN '  ❌ inventory_items - Optional'
        ELSE '  ✅ inventory_items'
    END;

SELECT '' as spacer, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as line;

-- Check critical columns
SELECT 
    '💳 SUBSCRIPTION FIELDS:' as info
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' 
            AND column_name = 'subscription_tier'
        )
        THEN '  ✅ subscription_tier'
        ELSE '  ❌ subscription_tier - Run COMPLETE-POLAR-MIGRATION.sql'
    END
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' 
            AND column_name = 'polar_customer_id'
        )
        THEN '  ✅ polar_customer_id'
        ELSE '  ❌ polar_customer_id - Run COMPLETE-POLAR-MIGRATION.sql'
    END;

SELECT '' as spacer, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as line;

-- Check functions
SELECT 
    '⚙️ FINANCIAL FUNCTIONS:' as info
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_asset_financials'
        )
        THEN '  ✅ get_asset_financials'
        ELSE '  ❌ get_asset_financials - Run functions.sql'
    END
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_monthly_pl'
        )
        THEN '  ✅ get_monthly_pl'
        ELSE '  ❌ get_monthly_pl - Run functions.sql'
    END
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_financial_summary'
        )
        THEN '  ✅ get_financial_summary'
        ELSE '  ❌ get_financial_summary - Run functions.sql'
    END;

SELECT '' as spacer, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as line;

-- Overall status
SELECT 
    '📊 OVERALL STATUS:' as info
UNION ALL
SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'
        ) >= 12
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_asset_financials')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'subscription_tier')
        THEN '  ✅ Database is fully set up and ready!'
        
        WHEN (
            SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'
        ) >= 8
        THEN '  ⚠️ Core tables exist. Run remaining migrations.'
        
        ELSE '  ❌ Incomplete setup. Start with complete-schema.sql'
    END;

-- =====================================================
-- End of Quick Check
-- =====================================================

