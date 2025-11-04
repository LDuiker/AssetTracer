-- Renumber Existing Quotations Per Organization
-- This fixes quotations created with the old global numbering system
-- After running this, each organization will have sequential numbers starting from 0001

-- Step 1: Check current quotation numbers per organization
SELECT 
  o.name as organization_name,
  q.organization_id,
  q.quotation_number,
  q.created_at,
  ROW_NUMBER() OVER (PARTITION BY q.organization_id ORDER BY q.created_at) as should_be_number
FROM quotations q
JOIN organizations o ON q.organization_id = o.id
ORDER BY q.organization_id, q.created_at;

-- Step 2: OPTIONAL - Renumber all quotations per organization
-- WARNING: This will change quotation numbers! Only run if you need to fix existing data.
-- Uncomment the following to execute:

/*
DO $$
DECLARE
  org_record RECORD;
  quot_record RECORD;
  new_number INTEGER;
  year_prefix TEXT;
BEGIN
  -- Loop through each organization
  FOR org_record IN 
    SELECT DISTINCT organization_id 
    FROM quotations 
    ORDER BY organization_id
  LOOP
    new_number := 1;
    
    -- Loop through quotations for this org, ordered by creation date
    FOR quot_record IN 
      SELECT id, quotation_number, created_at
      FROM quotations
      WHERE organization_id = org_record.organization_id
      ORDER BY created_at
    LOOP
      -- Extract year from the quotation number or use creation year
      year_prefix := 'QUO-' || EXTRACT(YEAR FROM quot_record.created_at)::TEXT || '-';
      
      -- Update with new sequential number
      UPDATE quotations
      SET quotation_number = year_prefix || LPAD(new_number::TEXT, 4, '0')
      WHERE id = quot_record.id;
      
      new_number := new_number + 1;
      
      RAISE NOTICE 'Updated quotation % to % for org %', 
        quot_record.id, 
        year_prefix || LPAD((new_number - 1)::TEXT, 4, '0'),
        org_record.organization_id;
    END LOOP;
  END LOOP;
END $$;
*/

-- Step 3: Verify the renumbering (run after Step 2)
SELECT 
  o.name as organization_name,
  q.organization_id,
  q.quotation_number,
  q.created_at
FROM quotations q
JOIN organizations o ON q.organization_id = o.id
ORDER BY q.organization_id, q.quotation_number;

