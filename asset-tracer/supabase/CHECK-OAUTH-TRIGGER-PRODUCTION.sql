-- Check OAuth Trigger Status in Production

-- Step 1: Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 2: Check if function exists and has SECURITY DEFINER
SELECT 
  proname as function_name,
  CASE prosecdef 
    WHEN true THEN '✅ SECURITY DEFINER (Good!)'
    ELSE '❌ NOT SECURITY DEFINER (Problem!)'
  END as security_status,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Step 3: Check for all orphaned users (in auth.users but not in public.users)
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  pu.id as public_user_id,
  pu.organization_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- Step 4: Check for users missing organization_id
SELECT 
  u.id,
  u.email,
  u.name,
  u.organization_id,
  u.created_at
FROM public.users u
WHERE u.organization_id IS NULL
ORDER BY u.created_at DESC;
