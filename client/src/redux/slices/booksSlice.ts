import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Types
export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  pageCount: number;
  category: string;
  language: string;
  isPublic: boolean;
  uploadedById: number;
  fileUrl?: string;
  audioUrl?: string;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  bookId: number;
  userId: number;
  content: string;
  rating?: number;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

interface BooksState {
  books: Book[];
  currentBook: Book | null;
  userBooks: Book[];
  categories: Category[];
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
}

const initialState: BooksState = {
  books: [],
  currentBook: null,
  userBooks: [],
  categories: [],
  comments: [],
  isLoading: false,
  error: null,
};

// Async actions
export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async (
    { category, limit, offset }: { category?: string; limit?: number; offset?: number },
    { rejectWithValue }
  ) => {
    try {
      // Mock data - will connect to server later
      return [
        {
          id: 1,
          title: 'The Great Read',
          author: 'Author One',
          description: 'A great book about reading',
          pageCount: 250,
          category: 'Fiction',
          language: 'en',
          isPublic: true,
          uploadedById: 1,
          coverImageUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Think Fast',
          author: 'Author Two',
          description: 'A book about thinking faster',
          pageCount: 320,
          category: 'Self-Help',
          language: 'en',
          isPublic: true,
          uploadedById: 2,
          coverImageUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    } catch (error) {
      return rejectWithValue('Failed to fetch books.');
    }
  }
);

export const fetchBookById = createAsyncThunk(
  'books/fetchBookById',
  async (bookId: number, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return {
        id: bookId,
        title: 'The Great Read',
        author: 'Author One',
        description: 'A great book about reading',
        pageCount: 250,
        category: 'Fiction',
        language: 'en',
        isPublic: true,
        uploadedById: 1,
        coverImageUrl: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue('Failed to fetch book details.');
    }
  }
);

export const fetchUserBooks = createAsyncThunk(
  'books/fetchUserBooks',
  async (_, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return [
        {
          id: 1,
          title: 'My Uploaded Book',
          author: 'Me',
          description: 'A book I uploaded',
          pageCount: 200,
          category: 'Fiction',
          language: 'en',
          isPublic: true,
          uploadedById: 1,
          coverImageUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    } catch (error) {
      return rejectWithValue('Failed to fetch your books.');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'books/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return [
        { id: 1, name: 'Fiction', description: 'Fictional stories and novels' },
        { id: 2, name: 'Non-Fiction', description: 'Based on facts and real events' },
        { id: 3, name: 'Self-Help', description: 'Personal development and improvement' },
        { id: 4, name: 'Fantasy', description: 'Magical worlds and mythical creatures' },
        { id: 5, name: 'Science Fiction', description: 'Future technology and space exploration' },
        { id: 6, name: 'Romance', description: 'Love stories and relationships' },
        { id: 7, name: 'Mystery', description: 'Crime solving and suspense' },
        { id: 8, name: 'Biography', description: 'Life stories of real people' },
      ];
    } catch (error) {
      return rejectWithValue('Failed to fetch categories.');
    }
  }
);

// Slice
const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    setCurrentBook: (state, action: PayloadAction<Book>) => {
      state.currentBook = action.payload;
    },
    clearCurrentBook: (state) => {
      state.currentBook = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Books
    builder.addCase(fetchBooks.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchBooks.fulfilled, (state, action) => {
      state.isLoading = false;
      state.books = action.payload;
    });
    builder.addCase(fetchBooks.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch Book By Id
    builder.addCase(fetchBookById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchBookById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentBook = action.payload;
    });
    builder.addCase(fetchBookById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch User Books
    builder.addCase(fetchUserBooks.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUserBooks.fulfilled, (state, action) => {
      state.isLoading = false;
      state.userBooks = action.payload;
    });
    builder.addCase(fetchUserBooks.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch Categories
    builder.addCase(fetchCategories.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.isLoading = false;
      state.categories = action.payload;
    });
    builder.addCase(fetchCategories.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

// Actions
export const { setCurrentBook, clearCurrentBook } = booksSlice.actions;

// Selectors
export const selectAllBooks = (state: RootState) => state.books.books;
export const selectCurrentBook = (state: RootState) => state.books.currentBook;
export const selectUserBooks = (state: RootState) => state.books.userBooks;
export const selectCategories = (state: RootState) => state.books.categories;
export const selectIsLoading = (state: RootState) => state.books.isLoading;
export const selectError = (state: RootState) => state.books.error;

export default booksSlice.reducer;