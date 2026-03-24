import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { fetchApi } from '../utils/api';
import { supabase } from '../lib/supabase';

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

export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  rank: number;
  booksCompleted?: number;
  badgesCount?: number;
  avatarUrl?: string | null;
}

export interface BookLeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  currentPage: number;
  isCompleted: boolean;
  lastReadDate: string | null;
  rank: number;
}

interface KoachState {
  badges: Badge[];
  userBadges: UserBadge[];
  leaderboard: LeaderboardEntry[];
  bookLeaderboard: BookLeaderboardEntry[];
  achievementGoals: AchievementGoal[];
  isLoading: boolean;
  /** Dedicated flag so fetchBadges / other koach thunks don't race with leaderboard UI */
  leaderboardLoading: boolean;
  bookLeaderboardLoading: boolean;
  error: string | null;
}

const initialState: KoachState = {
  badges: [],
  userBadges: [],
  leaderboard: [],
  bookLeaderboard: [],
  achievementGoals: [],
  isLoading: false,
  leaderboardLoading: false,
  bookLeaderboardLoading: false,
  error: null,
};

// Async thunks
export const fetchBadges = createAsyncThunk(
  'koach/fetchBadges',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchApi('/api/badges');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch badges');
    }
  }
);

export const fetchUserBadges = createAsyncThunk(
  'koach/fetchUserBadges',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchApi('/api/user/badges');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user badges');
    }
  }
);

/**
 * Classement via Supabase (pas le serveur Express) : évite "Network request failed"
 * quand l’appareil n’atteint pas localhost / 10.0.2.2.
 * Nécessite des policies RLS lecture sur `users`, `user_badges`, `user_books`.
 */
export const fetchLeaderboard = createAsyncThunk(
  'koach/fetchLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, koach_points, books_completed, avatar_url')
        .order('koach_points', { ascending: false })
        .limit(100);

      if (error) throw error;

      const badgeCounts: Record<string, number> = {};
      const { data: userBadges, error: ubErr } = await supabase
        .from('user_badges')
        .select('user_id');
      if (!ubErr && userBadges) {
        userBadges.forEach((ub: { user_id: string }) => {
          badgeCounts[ub.user_id] = (badgeCounts[ub.user_id] || 0) + 1;
        });
      }

      const leaderboard: LeaderboardEntry[] = (users || []).map((u: any, i: number) => ({
        userId: u.id,
        username: u.username ?? 'User',
        points: u.koach_points ?? 0,
        booksCompleted: u.books_completed ?? 0,
        badgesCount: badgeCounts[u.id] ?? 0,
        avatarUrl: u.avatar_url ?? null,
        rank: i + 1,
      }));

      return leaderboard;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch leaderboard');
    }
  }
);

export const fetchBookLeaderboard = createAsyncThunk(
  'koach/fetchBookLeaderboard',
  async (bookId: number, { rejectWithValue }) => {
    try {
      const { data: rows, error } = await supabase
        .from('user_books')
        .select('user_id, current_page, is_completed, last_read_date')
        .eq('book_id', bookId)
        .order('current_page', { ascending: false })
        .order('is_completed', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!rows?.length) return [] as BookLeaderboardEntry[];

      const userIds = [...new Set(rows.map((r: { user_id: string }) => r.user_id))];
      const { data: profiles, error: pErr } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (pErr) throw pErr;

      const userMap = new Map((profiles || []).map((u: any) => [u.id, u]));

      return rows.map((ub: any, i: number) => {
        const u = userMap.get(ub.user_id) as
          | { username?: string; avatar_url?: string | null }
          | undefined;
        return {
          userId: ub.user_id,
          username: u?.username ?? 'Unknown',
          avatarUrl: u?.avatar_url ?? null,
          currentPage: ub.current_page ?? 0,
          isCompleted: !!ub.is_completed,
          lastReadDate: ub.last_read_date ?? null,
          rank: i + 1,
        } satisfies BookLeaderboardEntry;
      });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch book leaderboard');
    }
  }
);

export const fetchAchievementGoals = createAsyncThunk(
  'koach/fetchAchievementGoals',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchApi('/api/goals');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch achievement goals');
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

      // Fetch Leaderboard (own loading flag — avoids race with fetchBadges etc.)
      .addCase(fetchLeaderboard.pending, (state) => {
        state.leaderboardLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action: PayloadAction<LeaderboardEntry[]>) => {
        state.leaderboardLoading = false;
        state.leaderboard = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.leaderboardLoading = false;
        state.leaderboard = [];
        state.error = action.payload as string || 'Failed to fetch leaderboard';
      })
      .addCase(fetchBookLeaderboard.pending, (state) => {
        state.bookLeaderboardLoading = true;
      })
      .addCase(fetchBookLeaderboard.fulfilled, (state, action: PayloadAction<BookLeaderboardEntry[]>) => {
        state.bookLeaderboardLoading = false;
        state.bookLeaderboard = action.payload;
      })
      .addCase(fetchBookLeaderboard.rejected, (state) => {
        state.bookLeaderboardLoading = false;
        state.bookLeaderboard = [];
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
export const selectBookLeaderboard = (state: RootState) => state.koach.bookLeaderboard;
export const selectBookLeaderboardLoading = (state: RootState) => state.koach.bookLeaderboardLoading;
export const selectAchievementGoals = (state: RootState) => state.koach.achievementGoals;
export const selectIsLoading = (state: RootState) => state.koach.isLoading;
export const selectLeaderboardLoading = (state: RootState) => state.koach.leaderboardLoading;
export const selectError = (state: RootState) => state.koach.error;

export default koachSlice.reducer;