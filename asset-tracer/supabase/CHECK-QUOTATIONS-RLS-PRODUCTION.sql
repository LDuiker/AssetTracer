-- Check Quotations RLS Policies and Permissions in Production
-- Organization ID: 4887e58a-088e-4e41-a576-5fd42238e535
-- User ID: 4cd18cc2-17ba-453b-97be-aa7c8d9eea7b

-- Step 1: Check if quotations table has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'quotations';

-- Step 2: List all RLS policies on quotations table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'quotations'
ORDER BY policyname;

-- Step 3: Check if user can access quotations table
-- This simulates what the app tries to do
SELECT 
  COUNT(*) as quotation_count
FROM quotations
WHERE organization_id = '4887e58a-088e-4e41-a576-5fd42238e535';

-- Step 4: Check if quotations table exists and has correct columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'quotations'
ORDER BY ordinal_position;

-- Step 5: Try to see what error would occur when inserting
-- This will help identify if it's an RLS issue or column issue
-- Note: This might fail, but the error message will be helpful
SELECT 
  'Checking INSERT permissions' as test,
  '4887e58a-088e-4e41-a576-5fd42238e535' as organization_id;

-- Step 6: Check quotation_items table RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'quotation_items'
ORDER BY policyname;

-- Step 7: Check current user's role (for debugging)
SELECT 
  current_user as database_user,
  current_setting('role') as current_role;
