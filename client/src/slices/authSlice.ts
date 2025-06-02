import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { supabase } from '../lib/supabase';

// Types
interface User {
  id: string;
  email: string;
  username: string;
  is_premium: boolean;
  koach_points: number;
  reading_streak: number;
  preferences?: {
    reading_frequency?: 'daily' | 'weekly' | 'monthly' | 'few_weekly' | 'occasionally';
    age_group?: string;
    preferred_categories?: string[];
    discovery_sources?: string[];
    language?: string;
    theme?: 'light' | 'dark' | 'system';
  };
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  has_completed_onboarding: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      console.log('Starting login process...');
      
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      if (!user) throw new Error('No user returned from auth');

      console.log('Authentication successful, fetching user profile...');

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      console.log('User profile fetched:', profile);

      return profile;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            has_completed_onboarding: false
          }
        }
      });

      if (error) throw error;
      if (!user) throw new Error('No user returned from auth');

      // Wait a bit for the trigger to create the user
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('No profile found');

      // Déconnexion immédiate
      await supabase.auth.signOut();

      return null; // Retourner null au lieu du profil pour éviter la redirection vers l'onboarding
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const setOnboardingCompleted = createAsyncThunk(
  'auth/setOnboardingCompleted',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('No user ID found');

      const { data, error } = await supabase
        .from('users')
        .update({ has_completed_onboarding: true })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'auth/updateUserPreferences',
  async (preferences: Partial<User['preferences']>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('No user ID found');

      const { data, error } = await supabase
        .from('users')
        .update({ preferences })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('Login fulfilled with payload:', action.payload);
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
        console.log('New state after login:', state);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.error = null;
      })

    // Set Onboarding Completed
    builder
      .addCase(setOnboardingCompleted.fulfilled, (state, action) => {
        if (state.user) {
          state.user = action.payload;
        }
      })

    // Update User Preferences
    builder
      .addCase(updateUserPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectError = (state: RootState) => state.auth.error;
export const selectHasCompletedOnboarding = (state: RootState) => 
  state.auth.user?.has_completed_onboarding ?? false;

export default authSlice.reducer;