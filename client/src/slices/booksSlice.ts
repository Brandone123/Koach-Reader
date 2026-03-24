import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { supabase } from '../lib/supabase';
import type { Author } from '../types/author';

// Types
export interface Book {
  id: number;
  title: string;
  author_id: number;
  author?: Author;
  description: string | null;
  isbn?: string | null;
  publication_date?: string | null;
  language: string | null;
  cover_url?: string | null;
  cover_image?: string | null;
  pdf_url?: string | null;
  audio_url?: string | null;
  total_pages: number;
  rating?: number | null;
  viewers?: number | null;
  is_free?: boolean;
  categories?: {
    id: string;
    name: string;
    icon_name?: string;
  }[];
  reading_time?: string;
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

// Async thunks
export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async (_, { rejectWithValue }) => {
    try {
      const { data: books, error } = await supabase
        .from('books')
        .select(`
          *,
          authors:author_id (*),
          book_categories (
            categories (
              id,
              name,
              icon_name
            )
          )
        `);

      if (error) throw error;

      // Transform the data to include categories and author
      const transformedBooks = books.map((book: any) => ({
        ...book,
        author: book.authors,
        categories: book.book_categories.map((bc: any) => bc.categories),
        reading_time: book.reading_time,
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
          (book.categories ?? []).some((c: { id: string }) => String(c.id) === String(action.payload))
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