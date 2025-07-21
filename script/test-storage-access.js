// Test script to verify Supabase storage access
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment variables
// Make sure to set these before running the script:
// For Windows: 
// $env:SUPABASE_URL="your-supabase-url"
// $env:SUPABASE_KEY="your-supabase-anon-key"
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set.');
  console.log('Run:');
  console.log('$env:SUPABASE_URL="your-supabase-url"');
  console.log('$env:SUPABASE_KEY="your-supabase-anon-key"');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test function to verify storage access
async function testStorageAccess() {
  try {
    console.log('Testing Supabase storage access...');

    // 1. List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      throw new Error(`Error listing buckets: ${bucketsError.message}`);
    }
    console.log('Available buckets:', buckets);

    // 2. Check if books bucket exists
    const booksBucket = buckets.find(b => b.name === 'books');
    if (!booksBucket) {
      throw new Error('Books bucket not found!');
    }

    // 3. Check if covers bucket exists
    const coversBucket = buckets.find(b => b.name === 'covers');
    if (!coversBucket) {
      throw new Error('Covers bucket not found!');
    }

    // 4. List contents of books bucket
    const { data: booksContent, error: booksError } = await supabase.storage
      .from('books')
      .list();
    
    if (booksError) {
      throw new Error(`Error listing books bucket: ${booksError.message}`);
    }
    console.log('Books bucket contents:', booksContent);

    // 5. List contents of covers bucket
    const { data: coversContent, error: coversError } = await supabase.storage
      .from('covers')
      .list();
    
    if (coversError) {
      throw new Error(`Error listing covers bucket: ${coversError.message}`);
    }
    console.log('Covers bucket contents:', coversContent);

    // 6. Test uploading a test file to books bucket
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for Supabase storage');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('books')
      .upload('test-file.txt', fs.readFileSync(testFilePath), {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Error uploading test file: ${uploadError.message}`);
    }
    console.log('Test file uploaded:', uploadData);

    // 7. Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('books')
      .getPublicUrl('test-file.txt');
    
    console.log('Public URL for test file:', publicUrlData.publicUrl);

    // 8. Clean up the test file
    fs.unlinkSync(testFilePath);
    
    console.log('✅ All storage tests passed successfully!');
  } catch (error) {
    console.error('❌ Storage test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testStorageAccess();
