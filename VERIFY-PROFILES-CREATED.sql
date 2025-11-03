-- Quick check if profiles were created
SELECT 
  au.email,
  CASE WHEN u.id IS NOT NULL THEN '✅ HAS PROFILE' ELSE '❌ NO PROFILE' END as status,
  u.organization_id,
  o.name as org_name
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY au.email;

