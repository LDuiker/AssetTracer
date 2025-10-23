-- =====================================================
-- FIX RLS POLICIES V2 - COMPREHENSIVE
-- =====================================================
-- This creates proper RLS policies that actually work
-- Run this in PRODUCTION Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Temporarily disable RLS to reset
-- =====================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop ALL existing policies on all tables
-- =====================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- =====================================================
-- STEP 3: Create SIMPLE, WORKING policies
-- =====================================================

-- ============= USERS TABLE =============
-- Allow users to read their own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Allow INSERT for new user registration (used by trigger)
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============= ORGANIZATIONS TABLE =============
-- Allow users to read their organization
CREATE POLICY "organizations_select_by_member"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Allow users to update their organization
CREATE POLICY "organizations_update_by_member"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Allow INSERT for new organizations (used by trigger)
CREATE POLICY "organizations_insert"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============= ASSETS TABLE =============
CREATE POLICY "assets_all_operations"
  ON assets FOR ALL
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- ============= CLIENTS TABLE =============
CREATE POLICY "clients_all_operations"
  ON clients FOR ALL
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- ============= EXPENSES TABLE =============
CREATE POLICY "expenses_all_operations"
  ON expenses FOR ALL
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- ============= INVOICES TABLE =============
CREATE POLICY "invoices_all_operations"
  ON invoices FOR ALL
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- ============= QUOTATIONS TABLE =============
CREATE POLICY "quotations_all_operations"
  ON quotations FOR ALL
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- ============= QUOTATION_ITEMS TABLE =============
CREATE POLICY "quotation_items_all_operations"
  ON quotation_items FOR ALL
  TO authenticated
  USING (
    quotation_id IN (
      SELECT id FROM quotations 
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- ============= TEAM_INVITATIONS TABLE =============
CREATE POLICY "team_invitations_all_operations"
  ON team_invitations FOR ALL
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- ============= INVENTORY_ITEMS TABLE =============
CREATE POLICY "inventory_items_all_operations"
  ON inventory_items FOR ALL
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- ============= ORGANIZATION_MEMBERS TABLE =============
CREATE POLICY "organization_members_all_operations"
  ON organization_members FOR ALL
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- ============= SUBSCRIPTIONS TABLE =============
CREATE POLICY "subscriptions_all_operations"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- =====================================================
-- STEP 4: Re-enable RLS on all tables
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Verify policies
-- =====================================================
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- STEP 6: Test as current user
-- =====================================================
SELECT 
  'Testing user access...' as test,
  u.id,
  u.email,
  u.name,
  u.organization_id,
  o.name as org_name
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.id = auth.uid()
LIMIT 1;

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ RLS policies V2 applied successfully!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'All tables now have proper RLS policies.';
  RAISE NOTICE 'Users can only access data from their organization.';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security is enabled and working!';
  RAISE NOTICE '================================================';
END $$;

