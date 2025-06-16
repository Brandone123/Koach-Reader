import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { supabase } from '../lib/supabase';

// Types
export interface Book {
  id: number;
  title: string;
  author: string;
  description: string | null;
  isbn: string | null;
  publication_date: string | null;
  language: string | null;
  cover_url: string | null;
  total_pages: number;
  rating: number | null;
  cover_image: string | null;
  viewers: number | null;
  pdf_url: string | null;
  audio_url?: string | null;
  categories: string[];
  is_free: boolean;
  created_at: string;
  updated_at: string;
}

interface BooksState {
  books: Book[];
  filteredBooks: Book[];
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: BooksState = {
  books: [],
  filteredBooks: [],
  selectedCategory: null,
  isLoading: false,
  error: null,
};

// Mock API functions (to be replaced with real API calls)
const booksAPI = {
  getBooks: async (params: GetBooksParams): Promise<Book[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated books data
    const books: { [key: number]: Book } = {
      1: {
        id: 1,
        title: 'The Bible',
        subtitle: '',
        author: 'Various Authors',
        description: 'The Bible is a collection of religious texts or scriptures sacred to Christians, Jews, Samaritans, and others.',
        pageCount: 1200,
        views: 300,
        totalRating: 2,
        category: 'Religious',
        language: 'English',
        isPublic: true,
        uploadedById: 1,
        coverImageUrl: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      2: {
        id: 2,
        title: 'The Purpose Driven Life',
        subtitle: '',
        author: 'Rick Warren',
        description: 'The Purpose Driven Life is a devotional book written by Christian pastor Rick Warren and published by Zondervan.',
        pageCount: 368,
        views: 600,
        totalRating: 3,
        category: 'Self-Help',
        language: 'English',
        isPublic: true,
        uploadedById: 1,
        coverImageUrl: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      3: {
        id: 3,
        title: 'Mere Christianity',
        subtitle: '',
        author: 'C.S. Lewis',
        description: 'Mere Christianity is a theological book by C.S. Lewis, adapted from a series of BBC radio talks.',
        pageCount: 256,
        views: 900,
        totalRating: 4,
        category: 'Religious',
        language: 'English',
        isPublic: true,
        uploadedById: 1,
        coverImageUrl: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    
    // Filter by category if specified
    const filteredBooks = params.category
      ? Object.values(books).filter(book => book.category === params.category)
      : Object.values(books);
    
    // Apply pagination if specified
    if (params.limit !== undefined && params.offset !== undefined) {
      return filteredBooks.slice(params.offset, params.offset + params.limit);
    }
    
    return filteredBooks;
  },
  
  createBook: async (bookData: CreateBookData): Promise<Book> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated API response
    return {
      id: 4, // Simulated ID (in a real app, the server would assign this)
      ...bookData,
      uploadedById: 1, // Assuming the current user's ID
      isPublic: bookData.isPublic ?? true,
      language: bookData.language ?? 'English',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
  
  updateBook: async (bookData: UpdateBookData): Promise<Book> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated API response
    // In a real app, we'd fetch the existing book and merge the updates
    return {
      id: bookData.id,
      title: bookData.title || 'Updated Book',
      subtitle: bookData.subtitle || '',
      author: bookData.author || 'Unknown Author',
      description: bookData.description || 'No description available',
      pageCount: bookData.pageCount || 100,
      views: bookData.views || 0,
      totalRating: bookData.totalRating || 0,
      category: bookData.category || 'General',
      language: bookData.language || 'English',
      isPublic: bookData.isPublic ?? true,
      uploadedById: 1,
      fileUrl: bookData.fileUrl,
      audioUrl: bookData.audioUrl,
      coverImageUrl: bookData.coverImageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
  
  addBookComment: async (commentData: AddCommentData): Promise<Comment> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated API response
    return {
      id: Math.floor(Math.random() * 1000), // Simulated ID
      bookId: commentData.bookId,
      userId: 1, // Assuming the current user's ID
      username: 'demo', // Assuming the current user's username
      content: commentData.content,
      rating: commentData.rating,
      createdAt: new Date().toISOString(),
    };
  },
};

// Async thunks
export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async (_, { rejectWithValue }) => {
    try {
      const { data: books, error } = await supabase
        .from('books')
        .select(`
          *,
          book_categories (
            categories (
              id,
              name,
              icon_name
            )
          )
        `);

      if (error) throw error;

      // Transform the data to include categories
      const transformedBooks = books.map((book: any) => ({
        ...book,
        categories: book.book_categories.map((bc: any) => bc.categories)
      }));

      return transformedBooks;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBooksByCategory = createAsyncThunk(
  'books/fetchBooksByCategory',
  async (categoryId: string, { rejectWithValue }) => {
    try {
      const { data: books, error } = await supabase
        .from('book_categories')
        .select(`
          books (*),
          categories (
            id,
            name
          )
        `)
        .eq('category_id', categoryId);

      if (error) throw error;

      return books.map((item: any) => ({
        ...item.books,
        category: item.categories.name
      }));
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Books slice
const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
      if (action.payload === null) {
        state.filteredBooks = state.books;
      } else {
        state.filteredBooks = state.books.filter(book => 
          book.categories.includes(action.payload)
        );
      }
    },
    clearBooks: (state) => {
      state.books = [];
      state.filteredBooks = [];
      state.selectedCategory = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books = action.payload;
        state.filteredBooks = action.payload;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchBooksByCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBooksByCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.filteredBooks = action.payload;
      })
      .addCase(fetchBooksByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { setSelectedCategory, clearBooks } = booksSlice.actions;

// Export selectors
export const selectBooks = (state: RootState) => state.books.books;
export const selectFilteredBooks = (state: RootState) => state.books.filteredBooks;
export const selectSelectedCategory = (state: RootState) => state.books.selectedCategory;
export const selectBooksLoading = (state: RootState) => state.books.isLoading;
export const selectBooksError = (state: RootState) => state.books.error;

// Export reducer
export default booksSlice.reducer;