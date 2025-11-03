-- CHECK: Why asset update is failing in production

SELECT '1️⃣ Check Assets Table Columns' as check;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'assets'
ORDER BY ordinal_position;

SELECT '2️⃣ Check Purchase Cost Trigger' as check;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'assets'
  AND trigger_name = 'sync_purchase_cost_trigger';

SELECT '3️⃣ Check if Trigger Function Exists' as check;
SELECT 
  proname as function_name,
  prosrc as function_code
FROM pg_proc 
WHERE proname = 'sync_purchase_cost';

SELECT '4️⃣ Try to Update a Test Asset' as check;
-- Find an existing asset
SELECT 
  id,
  name,
  purchase_cost,
  current_value,
  status
FROM assets
LIMIT 1;

-- Try updating it (replace ID with actual one)
-- UPDATE assets 
-- SET current_value = current_value 
-- WHERE id = 'dd1827b0-5740-40f0-a9ec-b9e9c5d0ad14';

SELECT '5️⃣ Check RLS Policies on Assets' as check;
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
WHERE tablename = 'assets';

SELECT '✅ Diagnostics complete!' as result;

