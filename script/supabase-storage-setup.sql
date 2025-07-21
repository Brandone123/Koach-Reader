-- Supabase Storage Configuration Script

-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Set bucket policies to allow public access to read files
-- Policy for the books bucket - allow public read access
CREATE POLICY "Public Access for Books"
ON storage.objects
FOR SELECT
USING (bucket_id = 'books');

-- Policy for the covers bucket - allow public read access
CREATE POLICY "Public Access for Covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'covers');

-- 3. Set policies to allow authenticated users to upload files
-- Policy for the books bucket - allow authenticated users to insert
CREATE POLICY "Authenticated Users Can Upload Books"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'books');

-- Policy for the covers bucket - allow authenticated users to insert
CREATE POLICY "Authenticated Users Can Upload Covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'covers');

-- 4. Set policies to allow users to update their own files
-- Policy for the books bucket - allow users to update their own files
CREATE POLICY "Users Can Update Their Own Books"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'books' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'books' AND auth.uid() = owner);

-- Policy for the covers bucket - allow users to update their own files
CREATE POLICY "Users Can Update Their Own Covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'covers' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'covers' AND auth.uid() = owner);

-- 5. Set policies to allow users to delete their own files
-- Policy for the books bucket - allow users to delete their own files
CREATE POLICY "Users Can Delete Their Own Books"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'books' AND auth.uid() = owner);

-- Policy for the covers bucket - allow users to delete their own files
CREATE POLICY "Users Can Delete Their Own Covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'covers' AND auth.uid() = owner);

-- 6. Configure CORS for Storage
-- This needs to be done via the Supabase dashboard or API
-- Here's a representation of what needs to be configured:

/*
CORS Configuration for Supabase Storage:

{
  "allowed_origins": ["*"],  // For production, replace with your specific domains
  "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowed_headers": ["Authorization", "Content-Type", "Accept", "Origin", "User-Agent"],
  "max_age_seconds": 3600,
  "expose_headers": ["Content-Length", "Content-Range"]
}
*/

-- Note: You'll need to run this script in the Supabase SQL editor
-- or use the Supabase CLI to apply these configurations. 