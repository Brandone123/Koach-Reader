import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { fetchApi } from '../utils/api';
import { mockFetchApi } from '../utils/mockApi';

export interface Badge {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  requirement: string;
  points: number;
}

export interface UserBadge {
  id: number;
  badgeId: number;
  userId: number;
  dateEarned: string;
  badge?: Badge;
}

export interface AchievementGoal {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  targetValue: number;
  progress: number; // 0-100
  completed: boolean;
  reward: {
    type: 'badge' | 'points';
    value: number;
    badgeId?: number;
  };
}

interface KoachState {
  badges: Badge[];
  userBadges: UserBadge[];
  leaderboard: Array<{ userId: number; username: string; points: number; rank: number }>;
  achievementGoals: AchievementGoal[];
  isLoading: boolean;
  error: string | null;
}

const initialState: KoachState = {
  badges: [],
  userBadges: [],
  leaderboard: [],
  achievementGoals: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchBadges = createAsyncThunk(
  'koach/fetchBadges',
  async (_, { rejectWithValue }) => {
    try {
      // Try to fetch from the real API
      const data = await fetchApi('/api/badges');
      return data;
    } catch (error) {
      try {
        // Fall back to mock API if the real request fails
        const mockData = await mockFetchApi('/api/badges');
        return mockData;
      } catch (mockError: any) {
        return rejectWithValue(mockError.message || 'Failed to fetch badges');
      }
    }
  }
);

export const fetchUserBadges = createAsyncThunk(
  'koach/fetchUserBadges',
  async (_, { rejectWithValue }) => {
    try {
      // Try to fetch from the real API
      const data = await fetchApi('/api/user/badges');
      return data;
    } catch (error) {
      try {
        // Fall back to mock API if the real request fails
        const mockData = await mockFetchApi('/api/user/badges');
        return mockData;
      } catch (mockError: any) {
        return rejectWithValue(mockError.message || 'Failed to fetch user badges');
      }
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'koach/fetchLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      // Try to fetch from the real API
      const data = await fetchApi('/api/leaderboard');
      return data;
    } catch (error) {
      try {
        // Fall back to mock API if the real request fails
        const mockData = await mockFetchApi('/api/leaderboard');
        return mockData;
      } catch (mockError: any) {
        return rejectWithValue(
          mockError.message || 'Failed to fetch leaderboard'
        );
      }
    }
  }
);

export const fetchAchievementGoals = createAsyncThunk(
  'koach/fetchAchievementGoals',
  async (_, { rejectWithValue }) => {
    try {
      // Try to fetch from the real API
      const data = await fetchApi('/api/goals');
      return data;
    } catch (error) {
      try {
        // Fall back to mock API if the real request fails
        const mockData = await mockFetchApi('/api/goals');
        return mockData;
      } catch (mockError: any) {
        return rejectWithValue(
          mockError.message || 'Failed to fetch achievement goals'
        );
      }
    }
  }
);

const koachSlice = createSlice({
  name: 'koach',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Badges
      .addCase(fetchBadges.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBadges.fulfilled, (state, action: PayloadAction<Badge[]>) => {
        state.isLoading = false;
        state.badges = action.payload;
      })
      .addCase(fetchBadges.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch badges';
      })

      // Fetch User Badges
      .addCase(fetchUserBadges.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserBadges.fulfilled, (state, action: PayloadAction<UserBadge[]>) => {
        state.isLoading = false;
        state.userBadges = action.payload;
      })
      .addCase(fetchUserBadges.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch user badges';
      })

      // Fetch Leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action: PayloadAction<Array<{ userId: number; username: string; points: number; rank: number }>>) => {
        state.isLoading = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch leaderboard';
      })

      // Fetch Achievement Goals
      .addCase(fetchAchievementGoals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAchievementGoals.fulfilled, (state, action: PayloadAction<AchievementGoal[]>) => {
        state.isLoading = false;
        state.achievementGoals = action.payload;
      })
      .addCase(fetchAchievementGoals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch achievement goals';
      });
  },
});

// Selectors
export const selectBadges = (state: RootState) => state.koach.badges;
export const selectUserBadges = (state: RootState) => state.koach.userBadges;
export const selectLeaderboard = (state: RootState) => state.koach.leaderboard;
export const selectAchievementGoals = (state: RootState) => state.koach.achievementGoals;
export const selectIsLoading = (state: RootState) => state.koach.isLoading;
export const selectError = (state: RootState) => state.koach.error;

export default koachSlice.reducer;