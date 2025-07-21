/**
 * This script tests access to Supabase storage buckets
 * It helps identify and diagnose storage permission issues
 */
import { supabase } from '../client/src/lib/supabase';

// Constants for Supabase storage buckets
const BUCKET_BOOKS = 'books';
const BUCKET_COVERS = 'covers';

const testStorageAccess = async () => {
  console.log('===== Testing Supabase Storage Access =====');
  
  try {
    // Test if we can list the buckets
    console.log('\nTesting bucket listing...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('✅ Successfully listed buckets');
    console.log('Available buckets:', buckets.map(b => b.name).join(', '));
    
    // Test if we can list the folders in the books bucket
    console.log(`\nTesting '${BUCKET_BOOKS}' bucket access...`);
    const { data: booksList, error: booksError } = await supabase.storage
      .from(BUCKET_BOOKS)
      .list();
    
    if (booksError) {
      console.error(`❌ Error listing '${BUCKET_BOOKS}' bucket:`, booksError);
    } else {
      console.log(`✅ Successfully accessed '${BUCKET_BOOKS}' bucket`);
      console.log(`Contents: ${booksList.map(item => item.name).join(', ') || 'Empty bucket'}`);
    }
    
    // Test if we can list the folders in the covers bucket
    console.log(`\nTesting '${BUCKET_COVERS}' bucket access...`);
    const { data: coversList, error: coversError } = await supabase.storage
      .from(BUCKET_COVERS)
      .list();
    
    if (coversError) {
      console.error(`❌ Error listing '${BUCKET_COVERS}' bucket:`, coversError);
    } else {
      console.log(`✅ Successfully accessed '${BUCKET_COVERS}' bucket`);
      console.log(`Contents: ${coversList.map(item => item.name).join(', ') || 'Empty bucket'}`);
    }

    // Test permissions for files folder in books bucket
    console.log(`\nTesting permissions for folders in '${BUCKET_BOOKS}' bucket...`);
    for (const folder of booksList || []) {
      if (folder.name && !folder.id) {  // It's a folder
        const { data: folderContents, error: folderError } = await supabase.storage
          .from(BUCKET_BOOKS)
          .list(folder.name);
          
        if (folderError) {
          console.error(`❌ Error accessing folder '${folder.name}' in '${BUCKET_BOOKS}':`, folderError);
        } else {
          console.log(`✅ Successfully accessed folder '${folder.name}' in '${BUCKET_BOOKS}'`);
          console.log(`Contents: ${folderContents.length ? folderContents.length + ' items' : 'Empty folder'}`);
        }
      }
    }
    
    // Test permissions for images folder in covers bucket
    console.log(`\nTesting permissions for folders in '${BUCKET_COVERS}' bucket...`);
    for (const folder of coversList || []) {
      if (folder.name && !folder.id) {  // It's a folder
        const { data: folderContents, error: folderError } = await supabase.storage
          .from(BUCKET_COVERS)
          .list(folder.name);
          
        if (folderError) {
          console.error(`❌ Error accessing folder '${folder.name}' in '${BUCKET_COVERS}':`, folderError);
        } else {
          console.log(`✅ Successfully accessed folder '${folder.name}' in '${BUCKET_COVERS}'`);
          console.log(`Contents: ${folderContents.length ? folderContents.length + ' items' : 'Empty folder'}`);
        }
      }
    }
    
    // Test uploading a small test file to books bucket
    console.log('\nTesting file upload to books bucket...');
    const testData = 'This is a test file';
    const { error: uploadBooksError } = await supabase.storage
      .from(BUCKET_BOOKS)
      .upload('test-file.txt', testData, {
        contentType: 'text/plain',
        upsert: true
      });
      
    if (uploadBooksError) {
      console.error('❌ Error uploading to books bucket:', uploadBooksError);
    } else {
      console.log('✅ Successfully uploaded test file to books bucket');
      
      // Delete the test file
      const { error: deleteBooksError } = await supabase.storage
        .from(BUCKET_BOOKS)
        .remove(['test-file.txt']);
        
      if (deleteBooksError) {
        console.error('❌ Error deleting test file from books bucket:', deleteBooksError);
      } else {
        console.log('✅ Successfully deleted test file from books bucket');
      }
    }
    
    // Test uploading a small test file to covers bucket
    console.log('\nTesting file upload to covers bucket...');
    const { error: uploadCoversError } = await supabase.storage
      .from(BUCKET_COVERS)
      .upload('test-image.txt', testData, {
        contentType: 'text/plain',
        upsert: true
      });
      
    if (uploadCoversError) {
      console.error('❌ Error uploading to covers bucket:', uploadCoversError);
    } else {
      console.log('✅ Successfully uploaded test file to covers bucket');
      
      // Delete the test file
      const { error: deleteCoversError } = await supabase.storage
        .from(BUCKET_COVERS)
        .remove(['test-image.txt']);
        
      if (deleteCoversError) {
        console.error('❌ Error deleting test file from covers bucket:', deleteCoversError);
      } else {
        console.log('✅ Successfully deleted test file from covers bucket');
      }
    }
    
    console.log('\n===== Storage Access Test Summary =====');
    if (!bucketsError && !booksError && !coversError && !uploadBooksError && !uploadCoversError) {
      console.log('✅ All storage tests passed successfully!');
    } else {
      console.log('❌ Some storage tests failed. See details above.');
    }
    
  } catch (error) {
    console.error('Error testing Supabase storage access:', error);
  }
};

// Run the test
testStorageAccess();

/**
 * To run this script:
 * 1. Make sure your environment variables are set correctly
 * 2. Run: npx ts-node script/test-storage-access.ts
 */ 