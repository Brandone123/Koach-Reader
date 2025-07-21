-- Koach Reader Storage Setup
-- This script sets up the necessary storage buckets and permissions for the Koach Reader application

-- First, create the buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('books', 'books', TRUE),
  ('covers', 'covers', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create basic policy to allow authenticated users to view all files
CREATE POLICY "Allow public access to books" ON storage.objects
FOR SELECT 
USING (bucket_id = 'books');

CREATE POLICY "Allow public access to covers" ON storage.objects
FOR SELECT 
USING (bucket_id = 'covers');

-- Policy for inserting new files - only authenticated users
CREATE POLICY "Allow authenticated users to upload books" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'books' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to upload covers" ON storage.objects
FOR INSERT 
  WITH CHECK (
    bucket_id = 'covers' 
    AND auth.role() = 'authenticated'
  );

-- Policy for updating files - only the file owner or admins
CREATE POLICY "Allow owners and admins to update books" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'books'
    AND (
      auth.uid() = owner
      OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND is_admin = true
      )
    )
  );

CREATE POLICY "Allow owners and admins to update covers" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'covers'
    AND (
      auth.uid() = owner
      OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND is_admin = true
      )
    )
  );

-- Policy for deleting files - only the file owner or admins
CREATE POLICY "Allow owners and admins to delete books" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'books'
    AND (
      auth.uid() = owner
      OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND is_admin = true
      )
    )
  );

CREATE POLICY "Allow owners and admins to delete covers" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'covers'
    AND (
      auth.uid() = owner
      OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND is_admin = true
      )
    )
  );

-- Enable Row Level Security
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create folders for better organization
-- Note: This doesn't actually create folders (since object storage is flat)
-- but it establishes the naming convention for the application

-- Update the storage.objects table for uploads that don't have an owner
UPDATE storage.objects SET owner = (
  SELECT id FROM auth.users LIMIT 1
) WHERE owner IS NULL;

-- Create a function to detect the MIME type from file extension
CREATE OR REPLACE FUNCTION storage.get_mime_type(file_name TEXT)
RETURNS TEXT AS $$
DECLARE
  extension TEXT;
BEGIN
  extension := lower(substring(file_name FROM '\.([^\.]+)$'));
  
  CASE extension
    WHEN 'pdf' THEN RETURN 'application/pdf';
    WHEN 'jpg' THEN RETURN 'image/jpeg';
    WHEN 'jpeg' THEN RETURN 'image/jpeg';
    WHEN 'png' THEN RETURN 'image/png';
    WHEN 'gif' THEN RETURN 'image/gif';
    WHEN 'txt' THEN RETURN 'text/plain';
    ELSE RETURN 'application/octet-stream';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a trigger function to set the owner of uploaded files
CREATE OR REPLACE FUNCTION storage.set_file_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the owner to the current user if not explicitly set
  IF NEW.owner IS NULL THEN
    NEW.owner := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically set the owner
CREATE OR REPLACE TRIGGER set_file_owner_trigger
BEFORE INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION storage.set_file_owner();

-- Add this comment explaining how to run this script
COMMENT ON TABLE storage.buckets IS 'Run this SQL script using the Supabase SQL Editor or via the CLI: npx supabase db push -f supabase-storage-setup.sql'; 