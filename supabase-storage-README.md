# Supabase Storage Setup for Koach-Reader

This document explains how to correctly set up and use Supabase Storage for the Koach-Reader application, along with solutions to common issues like the "Missing signature" error.

## Table of Contents
1. [Storage Structure](#storage-structure)
2. [URL Formats](#url-formats)
3. [Initial Setup](#initial-setup)
4. [Common Issues and Solutions](#common-issues-and-solutions)
5. [Fixing Incorrect URLs](#fixing-incorrect-urls)

## Storage Structure

The Koach-Reader app uses two main storage buckets:

- **books**: For storing PDF and other book files
- **covers**: For storing book cover images

## URL Formats

### Correct URL Format
The correct URL format for accessing Supabase storage files is:
```
https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[filename]
```

Example:
```
https://amjodckmmxmpholspskm.supabase.co/storage/v1/object/public/covers/my-book-cover.jpg
```

### Incorrect URL Formats (That Cause Errors)
The following URL formats are **incorrect** and will cause "Missing signature" errors:

❌ Using the `/s3/` path:
```
https://amjodckmmxmpholspskm.supabase.co/storage/v1/s3/books/my-book.pdf
```

❌ Using the wrong API path:
```
https://amjodckmmxmpholspskm.supabase.co/rest/v1/books/my-book.pdf
```

## Initial Setup

### 1. Create Storage Buckets

Run the following SQL commands in the Supabase SQL editor:

```sql
-- Create public buckets for books and covers
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('books', 'Books Storage', true),
  ('covers', 'Cover Images', true);

-- Set up public access policies for books bucket
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'books');

-- Set up public access policies for covers bucket
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

-- Allow authenticated users to upload to both buckets
CREATE POLICY "Authenticated Users Can Upload"
  ON storage.objects FOR INSERT
  TO authenticated
  USING (bucket_id IN ('books', 'covers'));

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated Users Can Update Own Files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('books', 'covers') AND (auth.uid() = owner));

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated Users Can Delete Own Files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('books', 'covers') AND (auth.uid() = owner));
```

### 2. Configure CORS

Create a file called `configure-supabase-cors.js` with the following content:

```javascript
const fetch = require('node-fetch');

// Replace these with your actual Supabase URL and service role key
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const configureCORS = async () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const corsSettings = {
    "allowed_origins": ["*"],
    "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allowed_headers": ["*"],
    "exposed_headers": ["Content-Length", "Content-Range"],
    "max_age_seconds": 86400
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/cors`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(corsSettings)
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('CORS configuration successful:', data);
  } catch (error) {
    console.error('Error configuring CORS:', error);
  }
};

configureCORS();
```

Run the script to configure CORS:

```bash
node configure-supabase-cors.js
```

## Common Issues and Solutions

### 1. "Missing signature" Error

**Symptoms:**
- Images or PDFs don't load
- Console shows errors like "Missing signature" or "Access denied"
- Request fails with 403 Forbidden status

**Cause:**
This usually happens when using the wrong URL format. Specifically, when using `/s3/` format instead of `/object/public/`.

**Solution:**
1. Use the URL fixing utility in the app:
   ```javascript
   import { fixSupabaseStorageUrl } from '../lib/supabase';
   const fixedUrl = fixSupabaseStorageUrl(wrongUrl);
   ```

2. For admins, use the "Fix Storage URLs" button in the Profile screen to fix all URLs in the database.

### 2. Files Not Found (404) Error

**Symptoms:**
- Images or PDFs don't load
- Console shows 404 Not Found errors

**Cause:**
- The file might not exist in the bucket
- The bucket permissions might be incorrect
- The filename in the URL might be incorrect

**Solution:**
1. Check if the file exists in the Supabase dashboard under Storage
2. Verify bucket permissions (should be public for read access)
3. Check that the filename in the URL matches exactly (including case)

### 3. CORS Issues

**Symptoms:**
- Console shows CORS errors
- Files can't be uploaded or accessed from certain domains

**Solution:**
Run the CORS configuration script provided above.

## Fixing Incorrect URLs

### Manual Fix in Code
The application includes a utility function to fix incorrect URL formats:

```javascript
import { fixSupabaseStorageUrl } from '../lib/supabase';

// Fix a single URL
const fixedUrl = fixSupabaseStorageUrl(incorrectUrl);

// Fix URLs in a book object
import { fixBookUrlsInObject } from '../utils/fixSupabaseUrls';
const fixedBook = fixBookUrlsInObject(bookWithIncorrectUrls);
```

### Database Fix (Admin Only)
Admins can use the "Fix Storage URLs" button in their profile section to run a utility that fixes all incorrect URLs in the database at once.

## Testing Your Setup

You can test if your Supabase storage is correctly configured by visiting the following URL in a browser:

```
https://[your-project-ref].supabase.co/storage/v1/object/public/covers/test-image.jpg
```

Replace `[your-project-ref]` with your actual Supabase project reference, and ensure you've uploaded a test image with the name "test-image.jpg" to the "covers" bucket.

If this loads successfully, your storage is correctly configured. 