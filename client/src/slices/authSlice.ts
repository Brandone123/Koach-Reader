import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Types
interface User {
  id: number;
  username: string;
  email: string;
  isPremium: boolean;
  koachPoints: number;
  readingStreak: number;
  preferences?: {
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
  hasCompletedOnboarding?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface UpdateProfileData {
  username?: string;
  email?: string;
  preferences?: User['preferences'];
  hasCompletedOnboarding?: boolean;
}

interface UpdatePreferencesData {
  preferences: User['preferences'];
}

interface UpdateLanguageData {
  language: string;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

// Mock API functions (to be replaced with real API calls)
const authAPI = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated API response
    if (credentials.username === 'demo' && credentials.password === 'password') {
      return {
        user: {
          id: 1,
          username: 'demo',
          email: 'demo@example.com',
          isPremium: false,
          koachPoints: 120,
          readingStreak: 5,
          preferences: {
            readingFrequency: 'daily',
            theme: 'light',
          },
          createdAt: new Date().toISOString(),
        },
        token: 'mock-token-12345',
      };
    } else {
      throw new Error('Invalid credentials');
    }
  },
  
  register: async (userData: RegisterData): Promise<{ user: User; token: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if username is taken (in a real app, this would be a server-side check)
    if (userData.username === 'demo') {
      throw new Error('Username already taken');
    }
    
    // Simulated API response
    return {
      user: {
        id: 2,
        username: userData.username,
        email: userData.email,
        isPremium: false,
        koachPoints: 0,
        readingStreak: 0,
        preferences: {
          readingFrequency: 'daily',
          theme: 'light',
        },
        createdAt: new Date().toISOString(),
        hasCompletedOnboarding: false,
      },
      token: 'mock-token-67890',
    };
  },
  
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated API response - would update the user based on the provided data
    return {
      id: 1,
      username: data.username || 'demo',
      email: data.email || 'demo@example.com',
      isPremium: false,
      koachPoints: 120,
      readingStreak: 5,
      preferences: data.preferences || {
        readingFrequency: 'daily',
        theme: 'light',
      },
      createdAt: new Date().toISOString(),
    };
  },
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  // In a real app, you would call an API endpoint to invalidate the token
  return null;
});

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would be a fetch to get the current user using the stored token
      return {
        user: {
          id: 1,
          username: 'demo',
          email: 'demo@example.com',
          isPremium: false,
          koachPoints: 120,
          readingStreak: 5,
          preferences: {
            readingFrequency: 'daily',
            theme: 'light',
          },
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: UpdateProfileData, { rejectWithValue }) => {
    try {
      const user = await authAPI.updateProfile(profileData);
      return { user };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePreferences = createAsyncThunk(
  'auth/updatePreferences',
  async (data: UpdatePreferencesData, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would make an actual API call to update preferences
      // For now, we'll just return the updated preferences
      return data.preferences;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update preferences');
    }
  }
);

export const updateLanguage = createAsyncThunk(
  'auth/updateLanguage',
  async (data: UpdateLanguageData, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would make an actual API call to update language
      // For now, we'll just return the updated language
      return data.language;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update language');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Add any synchronous actions here
    clearError: (state) => {
      state.error = null;
    },
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.hasCompletedOnboarding = action.payload;
      }
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      if (state.user && state.user.preferences) {
        state.user.preferences.language = action.payload;
      } else if (state.user) {
        state.user.preferences = { language: action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Login failed';
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Registration failed';
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      })
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<{ user: User }>) => {
        state.isLoading = false;
        state.user = action.payload.user;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch user';
      })
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<{ user: User }>) => {
        state.isLoading = false;
        state.user = action.payload.user;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update profile';
      })
      // Update preferences
      .addCase(updatePreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePreferences.fulfilled, (state, action: PayloadAction<User['preferences']>) => {
        state.isLoading = false;
        if (state.user) {
          state.user.preferences = action.payload;
        }
      })
      .addCase(updatePreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update language
      .addCase(updateLanguage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLanguage.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        if (state.user) {
          if (!state.user.preferences) {
            state.user.preferences = {};
          }
          state.user.preferences.language = action.payload;
        }
      })
      .addCase(updateLanguage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearError, setOnboardingCompleted, setLanguage } = authSlice.actions;

// Export selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsLoggedIn = (state: RootState) => !!state.auth.user;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectError = (state: RootState) => state.auth.error;
export const selectToken = (state: RootState) => state.auth.token;

// Export reducer
export default authSlice.reducer;