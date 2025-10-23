-- =====================================================
-- EXPORT 3 MISSING TABLES FROM STAGING
-- =====================================================
-- Run this in STAGING (ougntjrrskfsuognjmcw)
-- Copy ALL output and paste in chat
-- =====================================================

-- =====================================================
-- TABLE 1: organization_members
-- =====================================================

SELECT 
  'TABLE: organization_members' as info,
  column_name, 
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'organization_members' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- TABLE 2: subscriptions
-- =====================================================

SELECT 
  'TABLE: subscriptions' as info,
  column_name, 
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- TABLE 3: inventory_items
-- =====================================================

SELECT 
  'TABLE: inventory_items' as info,
  column_name, 
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'inventory_items' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- Get Foreign Key Constraints
-- =====================================================

SELECT
  'FOREIGN KEYS' as info,
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
  AND tc.table_name IN ('organization_members', 'subscriptions', 'inventory_items')
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- Get Indexes
-- =====================================================

SELECT
  'INDEXES' as info,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('organization_members', 'subscriptions', 'inventory_items')
ORDER BY tablename, indexname;

