-- =====================================================
-- QUICK CHECK: Staging OAuth Trigger Status
-- =====================================================
-- Run this in STAGING Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/sql
--
-- This will tell you EXACTLY what's wrong
-- =====================================================

-- Check 1: Does trigger exist?
SELECT 
  'Check 1: OAuth Trigger' as check_name,
  CASE WHEN EXISTS(
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  )
  THEN '✅ EXISTS' 
  ELSE '❌ MISSING - Run OAUTH-USER-AUTO-CREATE-FIXED.sql' 
  END as status;

-- Check 2: Is function properly configured?
SELECT 
  'Check 2: Trigger Function' as check_name,
  CASE WHEN EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND prosecdef = true
  )
  THEN '✅ SECURITY DEFINER configured' 
  ELSE '❌ WRONG SECURITY - Run OAUTH-USER-AUTO-CREATE-FIXED.sql' 
  END as status;

-- Check 3: Orphaned auth users (ones without profiles)
SELECT 
  'Check 3: Orphaned Users' as check_name,
  COUNT(*) || ' orphaned user(s) found' as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- Check 4: Show details of orphaned users
SELECT 
  'Check 4: Orphaned User Details' as check_name,
  au.email,
  au.created_at,
  '❌ No profile - needs to be fixed' as issue
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- Check 5: Template columns exist?
SELECT 
  'Check 5: Template Columns' as check_name,
  CASE WHEN EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' 
    AND column_name IN ('invoice_template', 'quotation_template')
  )
  THEN '✅ EXIST - Template selection ready' 
  ELSE '❌ MISSING - Run ADD-DOCUMENT-TEMPLATES.sql' 
  END as status;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT 
  '📋 STAGING STATUS SUMMARY' as summary,
  '' as details
UNION ALL
SELECT 
  '---' as summary,
  '' as details
UNION ALL
SELECT 
  'Trigger: ' as summary,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
    THEN 'OK'
    ELSE 'MISSING'
  END as details
UNION ALL
SELECT 
  'Function Security: ' as summary,
  CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user' AND prosecdef = true)
    THEN 'OK'
    ELSE 'BROKEN'
  END as details
UNION ALL
SELECT 
  'Orphaned Users: ' as summary,
  CAST(COUNT(*) AS TEXT)
FROM auth.users au LEFT JOIN users u ON au.id = u.id WHERE u.id IS NULL
UNION ALL
SELECT 
  'Template Columns: ' as summary,
  CASE WHEN EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' 
    AND column_name IN ('invoice_template', 'quotation_template')
  )
    THEN 'OK'
    ELSE 'MISSING'
  END as details;

