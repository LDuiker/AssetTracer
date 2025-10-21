-- =====================================================
-- Create Company Logos Storage Bucket
-- =====================================================
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create the storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
-- Allow authenticated users to upload their organization's logo
CREATE POLICY "Users can upload their organization logo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their organization's logo
CREATE POLICY "Users can update their organization logo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their organization's logo
CREATE POLICY "Users can delete their organization logo"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all logos (for PDF generation)
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'company-logos';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Company logos bucket created successfully';
    RAISE NOTICE 'Bucket: company-logos (public)';
    RAISE NOTICE 'Policies: Upload, update, delete (authenticated users)';
    RAISE NOTICE 'Public read access enabled';
END $$;

