import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  isPremium: boolean;
  koachPoints: number;
  readingStreak: number;
  preferences: {
    readingFrequency?: 'daily' | 'weekly' | 'monthly';
    ageRange?: 'child' | 'teen' | 'adult';
    preferredCategories?: string[];
    spiritualGoals?: string[];
    preferredReadingFormat?: 'text' | 'audio';
    preferredReadingTime?: string;
    language?: string;
    theme?: 'light' | 'dark' | 'system';
  };
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

// Async actions
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      // Mock login for now - will connect to server later
      // Simulate API call
      return {
        user: {
          id: 1,
          username: credentials.username,
          email: `${credentials.username}@example.com`,
          isPremium: false,
          koachPoints: 0,
          readingStreak: 0,
          preferences: {},
          createdAt: new Date().toISOString(),
        },
        token: 'mock-token',
      };
    } catch (error) {
      return rejectWithValue('Login failed. Please check your credentials.');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { username: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      // Mock registration for now - will connect to server later
      // Simulate API call
      return {
        user: {
          id: 1,
          username: userData.username,
          email: userData.email,
          isPremium: false,
          koachPoints: 0,
          readingStreak: 0,
          preferences: {},
          createdAt: new Date().toISOString(),
        },
        token: 'mock-token',
      };
    } catch (error) {
      return rejectWithValue('Registration failed. Please try again.');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  // Mock logout for now - will connect to server later
  return null;
});

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateUserPreferences: (state, action: PayloadAction<Partial<User['preferences']>>) => {
      if (state.user) {
        state.user.preferences = {
          ...state.user.preferences,
          ...action.payload,
        };
      }
    },
    updateKoachPoints: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.koachPoints += action.payload;
      }
    },
    updateReadingStreak: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.readingStreak = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
    });
  },
});

// Actions
export const { updateUserPreferences, updateKoachPoints, updateReadingStreak } = authSlice.actions;

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsLoggedIn = (state: RootState) => !!state.auth.user;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectError = (state: RootState) => state.auth.error;
export const selectToken = (state: RootState) => state.auth.token;

export default authSlice.reducer;