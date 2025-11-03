-- =====================================================
-- COMPLETE STAGING DATABASE SETUP
-- =====================================================
-- This applies ALL fixes from production to staging
-- Run this ONCE in staging Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Drop and Recreate OAuth Trigger
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  user_email := NEW.email;
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(user_email, '@', 1)
  );

  -- Check if user already exists in public.users
  IF EXISTS (SELECT 1 FROM users WHERE id = NEW.id) THEN
    RAISE NOTICE 'User already exists in public.users: %', NEW.id;
    RETURN NEW;
  END IF;

  -- Create a new organization for this user
  INSERT INTO organizations (name, default_currency, timezone, date_format)
  VALUES (
    user_full_name || '''s Organization',
    'USD',
    'UTC',
    'MM/DD/YYYY'
  )
  RETURNING id INTO new_org_id;

  -- Create the user record in public.users
  INSERT INTO users (
    id,
    email,
    name,
    organization_id,
    phone
  )
  VALUES (
    NEW.id,
    user_email,
    user_full_name,
    new_org_id,
    NEW.raw_user_meta_data->>'phone'
  );

  RAISE NOTICE 'Created new user: % with organization: %', NEW.id, new_org_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a public.users entry and an organization for new auth.users.';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to run handle_new_user after a new user is created in auth.users.';

-- =====================================================
-- STEP 2: Apply Comprehensive RLS Policies
-- =====================================================

-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
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

-- Create simple, working policies
CREATE POLICY "users_select_own" ON users FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "users_insert_own" ON users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "organizations_select_by_member" ON organizations FOR SELECT TO authenticated 
  USING (id = (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "organizations_update_by_member" ON organizations FOR UPDATE TO authenticated 
  USING (id = (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "organizations_insert" ON organizations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "assets_all_operations" ON assets FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "clients_all_operations" ON clients FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "expenses_all_operations" ON expenses FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "invoices_all_operations" ON invoices FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "invoice_items_all_operations" ON invoice_items FOR ALL TO authenticated 
  USING (invoice_id IN (SELECT id FROM invoices WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())))
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())));

CREATE POLICY "quotations_all_operations" ON quotations FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "quotation_items_all_operations" ON quotation_items FOR ALL TO authenticated 
  USING (quotation_id IN (SELECT id FROM quotations WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())));

CREATE POLICY "team_invitations_all_operations" ON team_invitations FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "inventory_items_all_operations" ON inventory_items FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "organization_members_all_operations" ON organization_members FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "subscriptions_all_operations" ON subscriptions FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Fix Existing Users Without Profiles
-- =====================================================
-- Create profiles for any auth users without public.users entries
DO $$
DECLARE
  new_org_id UUID;
  auth_user_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  FOR auth_user_id, user_email, user_name IN
    SELECT
      au.id,
      au.email,
      COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1)
      )
    FROM auth.users au
    LEFT JOIN users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    -- Create organization
    INSERT INTO organizations (
      name, default_currency, timezone, date_format
    )
    VALUES (
      user_name || '''s Organization',
      'USD', 'UTC', 'MM/DD/YYYY'
    )
    RETURNING id INTO new_org_id;

    -- Create user
    INSERT INTO users (id, email, name, organization_id)
    VALUES (auth_user_id, user_email, user_name, new_org_id);

    RAISE NOTICE '✅ Profile created for: %', user_email;
  END LOOP;

  IF NOT FOUND THEN
    RAISE NOTICE 'No missing user profiles found.';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT '✅ OAuth trigger installed!' as status
WHERE EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created');

SELECT '✅ RLS policies applied to ' || COUNT(DISTINCT tablename) || ' tables' as status
FROM pg_policies WHERE schemaname = 'public';

SELECT '✅ All auth users have profiles!' as status
WHERE NOT EXISTS(
  SELECT 1 FROM auth.users au
  LEFT JOIN users u ON au.id = u.id
  WHERE u.id IS NULL
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ STAGING DATABASE SETUP COMPLETE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Applied:';
  RAISE NOTICE '  ✅ OAuth trigger with SECURITY DEFINER';
  RAISE NOTICE '  ✅ RLS policies on all 13 tables';
  RAISE NOTICE '  ✅ Fixed existing users without profiles';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Clear browser cache or use incognito';
  RAISE NOTICE '  2. Try logging in to staging again';
  RAISE NOTICE '  3. Dashboard should load successfully!';
  RAISE NOTICE '================================================';
END $$;

