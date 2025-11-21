-- =====================================================
-- ADD MISSING CONSTRAINTS TO PRODUCTION DATABASE
-- =====================================================
-- This script adds the required unique constraints for
-- quotations and invoices to enable per-organization numbering
-- =====================================================
-- 
-- IMPORTANT: These constraints allow each organization to have
-- independent numbering (e.g., Org A: QUO-2025-0001, Org B: QUO-2025-0001)
-- while preventing duplicates within the same organization
-- =====================================================

-- =====================================================
-- 1. ADD QUOTATIONS CONSTRAINT
-- =====================================================
-- Create unique constraint on (organization_id, quotation_number)
-- This allows same quotation_number for different organizations
-- but prevents duplicates within the same organization

CREATE UNIQUE INDEX IF NOT EXISTS quotations_organization_id_quotation_number_key 
ON quotations(organization_id, quotation_number);

-- =====================================================
-- 2. ADD INVOICES CONSTRAINT
-- =====================================================
-- Create unique constraint on (organization_id, invoice_number)
-- This allows same invoice_number for different organizations
-- but prevents duplicates within the same organization

CREATE UNIQUE INDEX IF NOT EXISTS invoices_organization_id_invoice_number_key 
ON invoices(organization_id, invoice_number);

-- =====================================================
-- 3. VERIFY CONSTRAINTS WERE CREATED
-- =====================================================
-- This query confirms the constraints exist and are correct

SELECT 
  'quotations' as table_name,
  indexname,
  indexdef,
  CASE 
    WHEN indexdef LIKE '%organization_id%' AND indexdef LIKE '%quotation_number%'
      THEN '✅ CORRECT - Per-organization uniqueness'
    ELSE '❌ WRONG - Check manually'
  END as "Status"
FROM pg_indexes
WHERE tablename = 'quotations' 
  AND indexname LIKE '%quotation_number%'

UNION ALL

SELECT 
  'invoices' as table_name,
  indexname,
  indexdef,
  CASE 
    WHEN indexdef LIKE '%organization_id%' AND indexdef LIKE '%invoice_number%'
      THEN '✅ CORRECT - Per-organization uniqueness'
    ELSE '❌ WRONG - Check manually'
  END as "Status"
FROM pg_indexes
WHERE tablename = 'invoices' 
  AND indexname LIKE '%invoice_number%'
ORDER BY table_name;

-- =====================================================
-- EXPECTED RESULT
-- =====================================================
-- You should see:
-- 
-- table_name  | indexname                                    | Status
-- ------------+----------------------------------------------+----------------------------------------
-- invoices    | invoices_organization_id_invoice_number_key  | ✅ CORRECT - Per-organization uniqueness
-- quotations  | quotations_organization_id_quotation_number_key | ✅ CORRECT - Per-organization uniqueness
--
-- If you see "✅ CORRECT" for both, the constraints are properly configured!
-- =====================================================

