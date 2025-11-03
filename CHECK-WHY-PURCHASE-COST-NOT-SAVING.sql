-- CHECK: Why purchase_cost doesn't save

SELECT '========================================' as separator;
SELECT '🔍 PURCHASE COST SAVING DIAGNOSTIC' as title;
SELECT '========================================' as separator;

-- Check 1: What columns exist in assets table?
SELECT '1️⃣ ASSETS TABLE COLUMNS:' as check;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'assets'
  AND column_name IN ('purchase_cost', 'purchase_price', 'current_value')
ORDER BY column_name;

-- Check 2: Are there triggers on assets table?
SELECT '2️⃣ TRIGGERS ON ASSETS TABLE:' as check;
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'assets';

-- Check 3: Show the sync_purchase_cost trigger if it exists
SELECT '3️⃣ SYNC_PURCHASE_COST TRIGGER FUNCTION:' as check;
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'sync_purchase_cost';

-- Check 4: Test insert with both columns
SELECT '4️⃣ TESTING INSERT:' as check;
INSERT INTO assets (
  name,
  organization_id,
  purchase_cost,
  purchase_price,
  current_value,
  status
) VALUES (
  'TEST ASSET',
  (SELECT id FROM organizations LIMIT 1),
  999.99,  -- purchase_cost
  111.11,  -- purchase_price
  500.00,  -- current_value
  'active'
) RETURNING id, name, purchase_cost, purchase_price, current_value;

-- Check what was actually saved
SELECT '5️⃣ WHAT WAS SAVED:' as check;
SELECT name, purchase_cost, purchase_price, current_value
FROM assets
WHERE name = 'TEST ASSET';

-- Clean up test
DELETE FROM assets WHERE name = 'TEST ASSET';

SELECT '========================================' as separator;
SELECT '📊 DIAGNOSIS:' as title;
SELECT '========================================' as separator;
SELECT 'Check if trigger is overwriting purchase_cost with purchase_price' as note;

