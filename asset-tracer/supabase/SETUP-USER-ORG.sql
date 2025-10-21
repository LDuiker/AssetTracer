-- =====================================================
-- Setup User and Organization
-- =====================================================
-- This script creates an organization and links your
-- authenticated user to it, fixing the "Organization not found" error
-- =====================================================

DO $$
DECLARE
  current_user_id uuid;
  current_email text;
  new_org_id uuid;
BEGIN
  RAISE NOTICE 'Starting user and organization setup...';
  RAISE NOTICE '';
  
  -- Step 1: Get your current auth user
  SELECT id, email INTO current_user_id, current_email
  FROM auth.users
  LIMIT 1;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found. Please sign in first.';
  END IF;
  
  RAISE NOTICE '✅ Found auth user:';
  RAISE NOTICE '   Email: %', current_email;
  RAISE NOTICE '   ID: %', current_user_id;
  RAISE NOTICE '';
  
  -- Step 2: Create organization if it doesn't exist
  INSERT INTO organizations (name)
  VALUES ('My Company')
  ON CONFLICT DO NOTHING
  RETURNING id INTO new_org_id;
  
  -- If organization already exists, get its ID
  IF new_org_id IS NULL THEN
    SELECT id INTO new_org_id
    FROM organizations
    LIMIT 1;
    
    IF new_org_id IS NULL THEN
      -- No organizations exist, create one
      INSERT INTO organizations (name)
      VALUES ('My Company')
      RETURNING id INTO new_org_id;
      
      RAISE NOTICE '✅ Created new organization:';
    ELSE
      RAISE NOTICE '✅ Using existing organization:';
    END IF;
  ELSE
    RAISE NOTICE '✅ Created new organization:';
  END IF;
  
  RAISE NOTICE '   Name: My Company';
  RAISE NOTICE '   ID: %', new_org_id;
  RAISE NOTICE '';
  
  -- Step 3: Create or update user record
  INSERT INTO users (id, email, organization_id)
  VALUES (current_user_id, current_email, new_org_id)
  ON CONFLICT (id) 
  DO UPDATE SET 
    organization_id = new_org_id;
  
  RAISE NOTICE '✅ User linked to organization';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Setup complete! ✅';
  RAISE NOTICE '================================================';
END $$;

-- Verify the setup
SELECT 
  u.id as user_id,
  u.email,
  u.organization_id,
  o.name as organization_name,
  u.name as user_name,
  u.created_at
FROM users u
JOIN organizations o ON u.organization_id = o.id;

