-- =====================================================
-- CHECK FOR MISSING TABLES
-- =====================================================
-- This script checks which tables you have vs which you SHOULD have
-- =====================================================

-- Step 1: List ALL your current tables
SELECT 
  '=== CURRENT TABLES ===' as section,
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 2: Check for expected tables (11 total)
DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'CHECKING FOR EXPECTED TABLES';
  RAISE NOTICE '================================================';
  
  -- Check base tables (8)
  FOREACH table_exists IN ARRAY ARRAY[
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'organizations'),
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'users'),
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'clients'),
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'assets'),
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'invoices'),
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'invoice_items'),
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'transactions'),
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'expenses')
  ]
  LOOP
    NULL; -- Checked below
  END LOOP;
  
  -- Check organizations
  IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'organizations') THEN
    RAISE NOTICE '✅ organizations';
  ELSE
    RAISE NOTICE '❌ MISSING: organizations (run complete-schema.sql)';
    missing_tables := array_append(missing_tables, 'organizations');
  END IF;
  
  -- Check users
  IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
    RAISE NOTICE '✅ users';
  ELSE
    RAISE NOTICE '❌ MISSING: users (run complete-schema.sql)';
    missing_tables := array_append(missing_tables, 'users');
  END IF;
  
  -- Check clients
  IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'clients') THEN
    RAISE NOTICE '✅ clients';
  ELSE
    RAISE NOTICE '❌ MISSING: clients (run complete-schema.sql)';
    missing_tables := array_append(missing_tables, 'clients');
  END IF;
  
  -- Check assets
  IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'assets') THEN
    RAISE NOTICE '✅ assets';
  ELSE
    RAISE NOTICE '❌ MISSING: assets (run complete-schema.sql)';
    missing_tables := array_append(missing_tables, 'assets');
  END IF;
  
  -- Check invoices
  IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'invoices') THEN
    RAISE NOTICE '✅ invoices';
  ELSE
    RAISE NOTICE '❌ MISSING: invoices (run complete-schema.sql)';
    missing_tables := array_append(missing_tables, 'invoices');
  END IF;
  
  -- Check invoice_items
  IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'invoice_items') THEN
    RAISE NOTICE '✅ invoice_items';
  ELSE
    RAISE NOTICE '❌ MISSING: invoice_items (run complete-schema.sql)';
    missing_tables := array_append(missing_tables, 'invoice_items');
  END IF;
  
  -- Check transactions
  IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'transactions') THEN
    RAISE NOTICE '✅ transactions';
  ELSE
    RAISE NOTICE '❌ MISSING: transactions (run complete-schema.sql)';
    missing_tables := array_append(missing_tables, 'transactions');
  END IF;
  
  -- Check expenses
  IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'expenses') THEN
    RAISE NOTICE '✅ expenses';
  ELSE
    RAISE NOTICE '❌ MISSING: expenses (run complete-schema.sql)';
    missing_tables := array_append(missing_tables, 'expenses');
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '--- Additional Tables ---';
  
  -- Check quotations
  IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'quotations') THEN
    RAISE NOTICE '✅ quotations';
  ELSE
    RAISE NOTICE '❌ MISSING: quotations (run CREATE-QUOTATIONS-TABLES.sql)';
    missing_tables := array_append(missing_tables, 'quotations');
  END IF;
  
  -- Check quotation_items
  IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'quotation_items') THEN
    RAISE NOTICE '✅ quotation_items';
  ELSE
    RAISE NOTICE '❌ MISSING: quotation_items (run CREATE-QUOTATIONS-TABLES.sql)';
    missing_tables := array_append(missing_tables, 'quotation_items');
  END IF;
  
  -- Check team_invitations
  IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'team_invitations') THEN
    RAISE NOTICE '✅ team_invitations';
  ELSE
    RAISE NOTICE '❌ MISSING: team_invitations (run ADD-TEAM-MANAGEMENT.sql)';
    missing_tables := array_append(missing_tables, 'team_invitations');
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  IF array_length(missing_tables, 1) IS NULL THEN
    RAISE NOTICE '🎉 ALL TABLES EXIST! Database is complete!';
  ELSE
    RAISE NOTICE '⚠️ MISSING % TABLE(S)', array_length(missing_tables, 1);
    RAISE NOTICE 'Missing tables: %', array_to_string(missing_tables, ', ');
  END IF;
  RAISE NOTICE '================================================';
END $$;

-- Step 3: Count total tables
SELECT 
  COUNT(*) as total_tables,
  CASE 
    WHEN COUNT(*) = 11 THEN '✅ Correct (should be 11)'
    WHEN COUNT(*) < 11 THEN '⚠️ Missing tables (should be 11)'
    ELSE '⚠️ Extra tables (should be 11)'
  END as status
FROM pg_tables
WHERE schemaname = 'public';

-- Step 4: Show table row counts
SELECT 
  'TABLE ROW COUNTS' as section,
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

