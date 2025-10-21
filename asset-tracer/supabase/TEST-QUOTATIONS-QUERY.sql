-- =====================================================
-- TEST QUOTATIONS QUERY
-- =====================================================
-- This script tests the exact query that the API uses
-- Run this to see if there's a database-level error
-- =====================================================

-- Step 1: Test basic quotations select
SELECT 
  '1. Basic quotations select' AS test_step,
  id, 
  organization_id, 
  client_id,
  quotation_number,
  status,
  total
FROM quotations
LIMIT 5;

-- Step 2: Test clients table structure
SELECT 
  '2. Clients table structure' AS test_step,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- Step 3: Test the join with clients (this is what's in the API)
SELECT 
  '3. Quotations with client join' AS test_step,
  q.*,
  c.id as client_id_check,
  c.name as client_name,
  c.email as client_email,
  c.company as client_company
FROM quotations q
LEFT JOIN clients c ON q.client_id = c.id
LIMIT 5;

-- Step 4: Check if there are any quotations without valid clients
SELECT 
  '4. Orphaned quotations check' AS test_step,
  COUNT(*) as quotations_without_valid_client
FROM quotations q
LEFT JOIN clients c ON q.client_id = c.id
WHERE c.id IS NULL;

-- Step 5: Get current user's organization_id
-- Replace 'YOUR_USER_ID' with actual user ID from auth.users
SELECT 
  '5. User organization lookup' AS test_step,
  id as user_id,
  organization_id,
  email
FROM users
WHERE email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

