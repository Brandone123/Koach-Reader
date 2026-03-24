import { supabase, fixSupabaseStorageUrl } from "../lib/supabase";

/**
 * Updates all Supabase storage URLs in the books table to use the correct format
 * This utility can be used to fix all book URLs in a batch operation
 */
export const fixAllBookUrls = async (): Promise<{
  success: boolean;
  fixed: number;
  failed: number;
  message: string;
}> => {
  try {
    // Fetch all books with their URLs
    const { data: books, error: fetchError } = await supabase
      .from('books')
      .select('id, title, pdf_url, cover_url')
      .order('id');

    if (fetchError) {
      throw new Error(`Error fetching books: ${fetchError.message}`);
    }

    if (!books || books.length === 0) {
      return {
        success: true,
        fixed: 0,
        failed: 0,
        message: 'No books found to fix'
      };
    }

    let fixedCount = 0;
    let failedCount = 0;

    // Process each book
    for (const book of books) {
      try {
        const updates: Record<string, any> = {};
        let needsUpdate = false;

        // Fix PDF URL if it exists
        if (book.pdf_url) {
          const fixedPdfUrl = fixSupabaseStorageUrl(book.pdf_url);
          if (fixedPdfUrl && fixedPdfUrl !== book.pdf_url) {
            updates.pdf_url = fixedPdfUrl;
            needsUpdate = true;
          }
        }

        // Fix cover URL if it exists
        if (book.cover_url) {
          const fixedCoverUrl = fixSupabaseStorageUrl(book.cover_url);
          if (fixedCoverUrl && fixedCoverUrl !== book.cover_url) {
            updates.cover_url = fixedCoverUrl;
            needsUpdate = true;
            console.log(`Book ${book.id} (${book.title}): Cover URL fixed`);
          }
        }

        // Update the book if URLs were fixed
        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('books')
            .update(updates)
            .eq('id', book.id);

          if (updateError) {
            console.error(`Failed to update book ${book.id}:`, updateError);
            failedCount++;
          } else {
            fixedCount++;
          }
        }
      } catch (bookError) {
        console.error(`Error processing book ${book.id}:`, bookError);
        failedCount++;
      }
    }

    return {
      success: true,
      fixed: fixedCount,
      failed: failedCount,
      message: `Fixed ${fixedCount} books, failed to fix ${failedCount} books`
    };
  } catch (error) {
    return {
      success: false,
      fixed: 0,
      failed: 0,
      message: `Error fixing book URLs: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Fixes Supabase storage URLs in a book object without saving to the database
 * Useful for fixing URLs in memory before displaying content
 */
export const fixBookUrlsInObject = (book: any): any => {
  if (!book) return book;

  const fixedBook = { ...book };

  // Fix PDF URL
  if (fixedBook.pdf_url) {
    const fixedPdfUrl = fixSupabaseStorageUrl(fixedBook.pdf_url);
    if (fixedPdfUrl) {
      fixedBook.pdf_url = fixedPdfUrl;
    }
  }

  // Fix cover URL
  if (fixedBook.cover_url) {
    const fixedCoverUrl = fixSupabaseStorageUrl(fixedBook.cover_url);
    if (fixedCoverUrl) {
      fixedBook.cover_url = fixedCoverUrl;
    }
  }

  // Fix cover image (legacy field)
  if (fixedBook.cover_image) {
    const fixedCoverImage = fixSupabaseStorageUrl(fixedBook.cover_image);
    if (fixedCoverImage) {
      fixedBook.cover_image = fixedCoverImage;
    }
  }

  // Fix audio URL if it exists
  if (fixedBook.audio_url) {
    const fixedAudioUrl = fixSupabaseStorageUrl(fixedBook.audio_url);
    if (fixedAudioUrl) {
      fixedBook.audio_url = fixedAudioUrl;
    }
  }

  return fixedBook;
};

/**
 * Creates a utility script to fix all Supabase URL formats in the books table
 * @returns Instructions for running the utility
 */
export const createFixUrlsScript = (): string => {
  // This function creates a script that can be run to fix all URLs
  const script = `
// Fix Supabase Storage URLs Script
// Run this script to fix all URLs in the books table

import { fixAllBookUrls } from "./utils/fixSupabaseUrls";

const main = async () => {
  console.log("Starting URL fix operation...");
  
  const result = await fixAllBookUrls();
  
  console.log(result.message);
  console.log(\`Success: \${result.success}\`);
  console.log(\`Books fixed: \${result.fixed}\`);
  console.log(\`Books failed: \${result.failed}\`);
  
  console.log("URL fix operation completed");
};

main().catch(error => {
  console.error("Error running URL fix script:", error);
});
`;

  return script;
};

/**
 * Run this function to fix all book URLs in the database
 * This can be helpful when troubleshooting URL format issues
 */
export const runUrlFixer = async () => {
  try {
    const result = await fixAllBookUrls();
    return result;
  } catch (error) {
    console.error('Error running URL fixer:', error);
    return {
      success: false,
      fixed: 0,
      failed: 0,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}; 