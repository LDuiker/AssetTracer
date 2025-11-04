-- Fix Orphaned User in Production
-- User ID: 4cd18cc2-17ba-453b-97be-aa7c8d9eea7b
-- Issue: User exists in auth.users but missing from public.users or missing organization_id

-- Step 1: Check if user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE id = '4cd18cc2-17ba-453b-97be-aa7c8d9eea7b';

-- Step 2: Check if user exists in public.users
SELECT 
  id,
  email,
  name,
  organization_id,
  created_at
FROM public.users
WHERE id = '4cd18cc2-17ba-453b-97be-aa7c8d9eea7b';

-- Step 3: If user doesn't exist in public.users, create them
-- Get user data from auth.users first
DO $$
DECLARE
  v_user_id UUID := '4cd18cc2-17ba-453b-97be-aa7c8d9eea7b';
  v_email TEXT;
  v_name TEXT;
  v_org_id UUID;
  v_user_exists BOOLEAN;
BEGIN
  -- Check if user exists in public.users
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = v_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    -- Get email from auth.users
    SELECT email, raw_user_meta_data->>'full_name' INTO v_email, v_name
    FROM auth.users
    WHERE id = v_user_id;
    
    -- Create organization for the user
    INSERT INTO public.organizations (
      id,
      name,
      subscription_tier,
      default_currency,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      COALESCE(v_name, split_part(v_email, '@', 1)) || '''s Organization',
      'free',
      'USD',
      NOW(),
      NOW()
    ) RETURNING id INTO v_org_id;
    
    -- Create user profile
    INSERT INTO public.users (
      id,
      email,
      name,
      organization_id,
      role,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_email,
      COALESCE(v_name, split_part(v_email, '@', 1)),
      v_org_id,
      'owner',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Created user profile and organization for user: %', v_email;
    RAISE NOTICE '✅ Organization ID: %', v_org_id;
  ELSE
    -- User exists, check if organization_id is missing
    SELECT organization_id INTO v_org_id
    FROM public.users
    WHERE id = v_user_id;
    
    IF v_org_id IS NULL THEN
      -- Create organization
      INSERT INTO public.organizations (
        id,
        name,
        subscription_tier,
        default_currency,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        (SELECT COALESCE(name, split_part(email, '@', 1)) FROM public.users WHERE id = v_user_id) || '''s Organization',
        'free',
        'USD',
        NOW(),
        NOW()
      ) RETURNING id INTO v_org_id;
      
      -- Update user with organization_id
      UPDATE public.users
      SET organization_id = v_org_id,
          updated_at = NOW()
      WHERE id = v_user_id;
      
      RAISE NOTICE '✅ Created organization and linked to user';
      RAISE NOTICE '✅ Organization ID: %', v_org_id;
    ELSE
      RAISE NOTICE '✅ User already has organization_id: %', v_org_id;
    END IF;
  END IF;
END $$;

-- Step 4: Verify the fix
SELECT 
  u.id,
  u.email,
  u.name,
  u.organization_id,
  o.name as organization_name,
  o.subscription_tier
FROM public.users u
LEFT JOIN public.organizations o ON u.organization_id = o.id
WHERE u.id = '4cd18cc2-17ba-453b-97be-aa7c8d9eea7b';
