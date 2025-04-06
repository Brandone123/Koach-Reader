import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Types
export interface Book {
  id: number;
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  views?: number;
  totalRating?: number;
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

interface Comment {
  id: number;
  bookId: number;
  userId: number;
  username: string;
  content: string;
  rating?: number;
  createdAt: string;
}

interface BooksState {
  books: Book[];
  userBooks: Book[];
  currentBook: Book | null;
  bookComments: Comment[];
  isLoading: boolean;
  error: string | null;
}

interface GetBooksParams {
  category?: string;
  limit?: number;
  offset?: number;
}

interface CreateBookData {
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  pageCount: number;
  category: string;
  language?: string;
  isPublic?: boolean;
  fileUrl?: string;
  audioUrl?: string;
  coverImageUrl?: string;
}

interface UpdateBookData {
  id: number;
  title?: string;
  subtitle?: string;
  author?: string;
  description?: string;
  pageCount?: number;
  views?: number;
  totalRating?: number;
  category?: string;
  language?: string;
  isPublic?: boolean;
  fileUrl?: string;
  audioUrl?: string;
  coverImageUrl?: string;
}

interface AddCommentData {
  bookId: number;
  content: string;
  rating?: number;
}

// Initial state
const initialState: BooksState = {
  books: [],
  userBooks: [],
  currentBook: null,
  bookComments: [],
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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulated API response
      return booksAPI.getBooks({});
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserBooks = createAsyncThunk(
  'books/fetchUserBooks',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would fetch books uploaded by the current user
      const books = await booksAPI.getBooks({});
      // Just return the same books for demo purposes
      return books;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBookById = createAsyncThunk(
  'books/fetchBookById',
  async (bookId: number, { rejectWithValue }) => {
    try {
      // In a real app, this would be a specific API call to get a book by ID
      const books = await booksAPI.getBooks({});
      const book = books.find(b => b.id === bookId);
      
      if (!book) {
        throw new Error('Book not found');
      }
      
      return book;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createBook = createAsyncThunk(
  'books/createBook',
  async (bookData: CreateBookData, { rejectWithValue }) => {
    try {
      const book = await booksAPI.createBook(bookData);
      return book;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateBook = createAsyncThunk(
  'books/updateBook',
  async (bookData: UpdateBookData, { rejectWithValue }) => {
    try {
      const book = await booksAPI.updateBook(bookData);
      return book;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBookComments = createAsyncThunk(
  'books/fetchBookComments',
  async (bookId: number, { rejectWithValue }) => {
    try {
      // In a real app, this would fetch comments for the specific book
      // For demo purposes, we'll return mock data
      return [
        {
          id: 1,
          bookId,
          userId: 2,
          username: 'user1',
          content: 'This book changed my life!',
          rating: 5,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          bookId,
          userId: 3,
          username: 'user2',
          content: 'Very insightful read.',
          rating: 4,
          createdAt: new Date().toISOString(),
        },
      ];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addBookComment = createAsyncThunk(
  'books/addBookComment',
  async (commentData: AddCommentData, { rejectWithValue }) => {
    try {
      const comment = await booksAPI.addBookComment(commentData);
      return comment;
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
    // Any synchronous actions here
    clearBooksError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch books
      .addCase(fetchBooks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action: PayloadAction<Book[]>) => {
        state.isLoading = false;
        state.books = action.payload;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch books';
      })
      // Fetch user books
      .addCase(fetchUserBooks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserBooks.fulfilled, (state, action: PayloadAction<Book[]>) => {
        state.isLoading = false;
        state.userBooks = action.payload;
      })
      .addCase(fetchUserBooks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch user books';
      })
      // Fetch book by ID
      .addCase(fetchBookById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookById.fulfilled, (state, action: PayloadAction<Book>) => {
        state.isLoading = false;
        state.currentBook = action.payload;
      })
      .addCase(fetchBookById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch book';
      })
      // Create book
      .addCase(createBook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBook.fulfilled, (state, action: PayloadAction<Book>) => {
        state.isLoading = false;
        state.books.push(action.payload);
        state.userBooks.push(action.payload);
      })
      .addCase(createBook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to create book';
      })
      // Update book
      .addCase(updateBook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBook.fulfilled, (state, action: PayloadAction<Book>) => {
        state.isLoading = false;
        
        // Update in books array
        const index = state.books.findIndex(book => book.id === action.payload.id);
        if (index !== -1) {
          state.books[index] = action.payload;
        }
        
        // Update in userBooks array
        const userIndex = state.userBooks.findIndex(book => book.id === action.payload.id);
        if (userIndex !== -1) {
          state.userBooks[userIndex] = action.payload;
        }
        
        // Update currentBook if it's the same book
        if (state.currentBook && state.currentBook.id === action.payload.id) {
          state.currentBook = action.payload;
        }
      })
      .addCase(updateBook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update book';
      })
      // Fetch book comments
      .addCase(fetchBookComments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookComments.fulfilled, (state, action: PayloadAction<Comment[]>) => {
        state.isLoading = false;
        state.bookComments = action.payload;
      })
      .addCase(fetchBookComments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch comments';
      })
      // Add book comment
      .addCase(addBookComment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addBookComment.fulfilled, (state, action: PayloadAction<Comment>) => {
        state.isLoading = false;
        state.bookComments.unshift(action.payload);
      })
      .addCase(addBookComment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to add comment';
      });
  },
});

// Export actions
export const { clearBooksError } = booksSlice.actions;

// Export selectors
export const selectBooks = (state: RootState) => state.books.books;
export const selectUserBooks = (state: RootState) => state.books.userBooks;
export const selectCurrentBook = (state: RootState) => state.books.currentBook;
export const selectBookComments = (state: RootState) => state.books.bookComments;
export const selectBooksLoading = (state: RootState) => state.books.isLoading;
export const selectBooksError = (state: RootState) => state.books.error;

// Export reducer
export default booksSlice.reducer;