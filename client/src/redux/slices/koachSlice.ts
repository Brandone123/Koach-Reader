import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Types
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
  userId: number;
  badgeId: number;
  dateEarned: string;
  badge: Badge;
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
  achievementGoals: [
    {
      id: 'read_pages_30',
      name: 'Page Turner',
      description: 'Read 30 pages',
      currentValue: 0,
      targetValue: 30,
      progress: 0,
      completed: false,
      reward: {
        type: 'points',
        value: 50,
      },
    },
    {
      id: 'read_days_7',
      name: 'Weekly Reader',
      description: 'Read for 7 consecutive days',
      currentValue: 0,
      targetValue: 7,
      progress: 0,
      completed: false,
      reward: {
        type: 'badge',
        value: 100,
        badgeId: 1,
      },
    },
  ],
  isLoading: false,
  error: null,
};

// Async actions
export const fetchBadges = createAsyncThunk('koach/fetchBadges', async (_, { rejectWithValue }) => {
  try {
    // Mock data - will connect to server later
    return [
      {
        id: 1,
        name: 'Bookworm',
        description: 'Read for 7 consecutive days',
        imageUrl: 'https://via.placeholder.com/150',
        requirement: 'Read for 7 consecutive days',
        points: 100,
      },
      {
        id: 2,
        name: 'Vocabulary Master',
        description: 'Learn 100 new words',
        imageUrl: 'https://via.placeholder.com/150',
        requirement: 'Learn 100 new words',
        points: 150,
      },
      {
        id: 3,
        name: 'Speed Reader',
        description: 'Read 200 pages in a day',
        imageUrl: 'https://via.placeholder.com/150',
        requirement: 'Read 200 pages in a day',
        points: 200,
      },
    ];
  } catch (error) {
    return rejectWithValue('Failed to fetch badges.');
  }
});

export const fetchUserBadges = createAsyncThunk(
  'koach/fetchUserBadges',
  async (_, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return [
        {
          id: 1,
          userId: 1,
          badgeId: 1,
          dateEarned: new Date().toISOString(),
          badge: {
            id: 1,
            name: 'Bookworm',
            description: 'Read for 7 consecutive days',
            imageUrl: 'https://via.placeholder.com/150',
            requirement: 'Read for 7 consecutive days',
            points: 100,
          },
        },
      ];
    } catch (error) {
      return rejectWithValue('Failed to fetch user badges.');
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'koach/fetchLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return [
        { userId: 1, username: 'user1', points: 1250, rank: 1 },
        { userId: 2, username: 'user2', points: 980, rank: 2 },
        { userId: 3, username: 'user3', points: 820, rank: 3 },
        { userId: 4, username: 'user4', points: 750, rank: 4 },
        { userId: 5, username: 'user5', points: 620, rank: 5 },
      ];
    } catch (error) {
      return rejectWithValue('Failed to fetch leaderboard.');
    }
  }
);

// Slice
const koachSlice = createSlice({
  name: 'koach',
  initialState,
  reducers: {
    updateAchievementProgress: (
      state,
      action: PayloadAction<{ id: string; value: number }>
    ) => {
      const { id, value } = action.payload;
      const goal = state.achievementGoals.find((g) => g.id === id);

      if (goal) {
        goal.currentValue = Math.min(goal.targetValue, goal.currentValue + value);
        goal.progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
        goal.completed = goal.currentValue >= goal.targetValue;
      }
    },
    resetAchievementGoal: (state, action: PayloadAction<string>) => {
      const goal = state.achievementGoals.find((g) => g.id === action.payload);

      if (goal) {
        goal.currentValue = 0;
        goal.progress = 0;
        goal.completed = false;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Badges
    builder.addCase(fetchBadges.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchBadges.fulfilled, (state, action) => {
      state.isLoading = false;
      state.badges = action.payload;
    });
    builder.addCase(fetchBadges.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch User Badges
    builder.addCase(fetchUserBadges.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUserBadges.fulfilled, (state, action) => {
      state.isLoading = false;
      state.userBadges = action.payload;
    });
    builder.addCase(fetchUserBadges.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch Leaderboard
    builder.addCase(fetchLeaderboard.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchLeaderboard.fulfilled, (state, action) => {
      state.isLoading = false;
      state.leaderboard = action.payload;
    });
    builder.addCase(fetchLeaderboard.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

// Actions
export const { updateAchievementProgress, resetAchievementGoal } = koachSlice.actions;

// Selectors
export const selectBadges = (state: RootState) => state.koach.badges;
export const selectUserBadges = (state: RootState) => state.koach.userBadges;
export const selectLeaderboard = (state: RootState) => state.koach.leaderboard;
export const selectAchievementGoals = (state: RootState) => state.koach.achievementGoals;
export const selectIsLoading = (state: RootState) => state.koach.isLoading;
export const selectError = (state: RootState) => state.koach.error;

export default koachSlice.reducer;