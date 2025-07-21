import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client normal pour les opérations utilisateur
export const supabase = createClient(supabaseUrl, supabaseKey);

// Client admin pour les opérations nécessitant plus de privilèges
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Converts a Supabase storage URL to the correct format
 * The working format is: https://amjodckmmxmpholspskm.supabase.co/storage/v1/object/public/[bucket]/[filename]
 * 
 * @param url The URL to fix
 * @returns The corrected URL or the original if already correct
 */
export const fixSupabaseStorageUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  // If URL already has the correct format, return it
  if (url.includes('/storage/v1/object/public/')) {
    return url;
  }
  
  // Handle local file URLs (cannot be fixed)
  if (url.startsWith('file://')) {
    console.error('Local file URL detected, cannot use:', url);
    return null;
  }
  
  // Extract the filename from the URL
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  
  // Determine the bucket based on the URL or file extension
  let bucket = 'books';
  
  // Check file extension to guess the bucket
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      bucket = 'covers';
    }
  }
  
  // Reconstruct the URL with the correct format
  return `https://amjodckmmxmpholspskm.supabase.co/storage/v1/object/public/${bucket}/${filename}`;
};

/**
 * Handles missing signatures and other common Supabase storage errors
 * by testing the URL and providing an appropriate error message
 * 
 * @param url The URL to test
 * @returns An object with success status and error message if any
 */
export const testSupabaseStorageUrl = async (url: string | null): Promise<{success: boolean, message: string}> => {
  if (!url) {
    return { 
      success: false, 
      message: 'No URL provided' 
    };
  }
  
  // First fix the URL format
  const fixedUrl = fixSupabaseStorageUrl(url);
  if (!fixedUrl) {
    return { 
      success: false, 
      message: 'Could not fix the URL format' 
    };
  }
  
  try {
    // Test with a HEAD request
    const response = await fetch(fixedUrl, { method: 'HEAD' });
    
    if (!response.ok) {
      // Check for common error status codes
      if (response.status === 403) {
        return { 
          success: false, 
          message: 'Access denied. This could be due to missing signature or incorrect bucket permissions.' 
        };
      } else if (response.status === 404) {
        return { 
          success: false, 
          message: 'File not found. Check if the file exists in the bucket.' 
        };
      } else {
        return { 
          success: false, 
          message: `Request failed with status ${response.status}` 
        };
      }
    }
    
    return { 
      success: true, 
      message: 'URL is valid and accessible' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error testing URL: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};