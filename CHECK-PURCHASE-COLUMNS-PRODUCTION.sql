-- CHECK: Which purchase columns exist in production?

SELECT 
  'Assets Table Columns:' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'assets'
  AND column_name IN ('purchase_cost', 'purchase_price', 'current_value')
ORDER BY column_name;

-- If only purchase_cost exists, we need to remove/fix the trigger
-- If both exist, the trigger can stay
-- If only purchase_price exists, we need to rename it

