-- =====================================================
-- Verify User Signup Trigger is Working
-- =====================================================

-- Check 1: Verify the trigger exists
SELECT 
  trigger_name,
  event_manipulation as "Event",
  event_object_table as "Table",
  action_timing as "Timing"
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check 2: Verify the function exists
SELECT 
  routine_name as "Function Name",
  routine_type as "Type"
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- Check 3: See all current users and their organizations
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  u.organization_id,
  o.name as organization_name,
  u.created_at
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at DESC;

-- =====================================================
-- If the first query returns 1 row, the trigger is active! ✅
-- If it returns 0 rows, run CREATE-USER-TRIGGER.sql again
-- =====================================================

