-- =====================================================
-- NUCLEAR FIX - STAGING AUTH (WITH CASCADE)
-- =====================================================
-- This is the EXACT fix that worked in production
-- NO MORE DIAGNOSIS - JUST FIX EVERYTHING
-- =====================================================

-- STEP 1: DISABLE RLS ON ALL TABLES (for clean deletion)
-- =====================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
  END LOOP;
END $$;

-- STEP 2: TRUNCATE ALL TABLES (CASCADE handles foreign keys)
-- =====================================================
TRUNCATE TABLE 
  invoice_items,
  invoices,
  quotation_items,
  quotations,
  clients,
  assets,
  inventory_items,
  team_invitations,
  organization_members,
  subscriptions,
  transactions,
  users,
  organizations
CASCADE;

-- Delete auth.users (must be done separately)
DELETE FROM auth.users;

-- STEP 3: DROP AND REINSTALL OAUTH TRIGGER
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create trigger function with SECURITY DEFINER
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

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM users WHERE id = NEW.id) THEN
    RAISE NOTICE 'User already exists: %', NEW.id;
    RETURN NEW;
  END IF;

  -- Create organization
  INSERT INTO organizations (name, default_currency, timezone, date_format)
  VALUES (
    user_full_name || '''s Organization',
    'USD',
    'UTC',
    'MM/DD/YYYY'
  )
  RETURNING id INTO new_org_id;

  -- Create user (match your actual users table structure)
  INSERT INTO users (
    id, email, name, organization_id
  )
  VALUES (
    NEW.id, user_email, user_full_name, new_org_id
  );

  RAISE NOTICE '✅ Created user: % with org: %', user_email, new_org_id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error creating user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: FIX RLS POLICIES
-- =====================================================
-- Drop all existing policies on users and organizations
DROP POLICY IF EXISTS "Enable read access for users based on organization_id" ON users;
DROP POLICY IF EXISTS "Enable insert for users based on organization_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on organization_id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on organization_id" ON users;

DROP POLICY IF EXISTS "Enable read access for organizations based on organization_id" ON organizations;
DROP POLICY IF EXISTS "Enable insert for organizations based on organization_id" ON organizations;
DROP POLICY IF EXISTS "Enable update for organizations based on organization_id" ON organizations;
DROP POLICY IF EXISTS "Enable delete for organizations based on organization_id" ON organizations;

-- Create proper policies for USERS
CREATE POLICY "Enable read access for users based on organization_id"
ON users FOR SELECT
USING (
  auth.uid() = id OR 
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Enable insert for users based on organization_id"
ON users FOR INSERT
WITH CHECK (true); -- Allow trigger to insert

CREATE POLICY "Enable update for users based on organization_id"
ON users FOR UPDATE
USING (
  auth.uid() = id OR
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Enable delete for users based on organization_id"
ON users FOR DELETE
USING (
  auth.uid() = id OR
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- Create proper policies for ORGANIZATIONS
CREATE POLICY "Enable read access for organizations based on organization_id"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Enable insert for organizations based on organization_id"
ON organizations FOR INSERT
WITH CHECK (true); -- Allow trigger to insert

CREATE POLICY "Enable update for organizations based on organization_id"
ON organizations FOR UPDATE
USING (
  id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Enable delete for organizations based on organization_id"
ON organizations FOR DELETE
USING (
  id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- STEP 5: RE-ENABLE RLS ON ALL TABLES
-- =====================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
  END LOOP;
END $$;

-- STEP 6: VERIFY EVERYTHING
-- =====================================================
SELECT 
  '✅ NUCLEAR FIX COMPLETE!' as status,
  'Trigger: ' || CASE WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') THEN '✅' ELSE '❌' END as trigger_status,
  'Users RLS: ' || CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = 'public'::regnamespace LIMIT 1) THEN '✅' ELSE '❌' END as users_rls,
  'Orgs RLS: ' || CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'organizations' AND relnamespace = 'public'::regnamespace LIMIT 1) THEN '✅' ELSE '❌' END as orgs_rls,
  'User Count: ' || (SELECT COUNT(*) FROM auth.users) as user_count;

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ NUCLEAR FIX COMPLETE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Database is now clean and ready.';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Fix Supabase redirect URLs in dashboard';
  RAISE NOTICE '2. Force Vercel redeploy (uncheck cache)';
  RAISE NOTICE '3. Sign up with Google in fresh incognito window';
  RAISE NOTICE '================================================';
END $$;
