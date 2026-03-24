import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { Book } from './booksSlice';
import { supabase } from '../lib/supabase';

// Types
export interface ReadingPlan {
  id: number;
  user_id: number;
  book_id: number;
  start_date: string;
  end_date: string;
  current_page: number;
  daily_goal: number;
  title: string;
  frequency: string;
  notes: string | null;
  last_read_date: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
  /** Enriched from join - total pages from book */
  total_pages?: number;
  /** Enriched from join - book details */
  book?: { title?: string; author?: { name?: string } };
}

export interface ReadingSession {
  id: number;
  user_id: number;
  book_id: number;
  reading_plan_id: number | null;
  pages_read: number;
  minutes_spent: number;
  session_date: string;
  koach_earned: number;
  notes?: string;
  created_at: string;
}

interface ReadingPlansState {
  plans: ReadingPlan[];
  currentPlan: ReadingPlan | null;
  readingSessions: ReadingSession[];
  loading: boolean;
  error: string | null;
}

interface CreatePlanData {
  book_id: number;
  title: string;
  startDate: string;
  endDate: string;
  totalPages: number;
  frequency: 'daily' | 'weekly';
  pagesPerSession: number;
  notes?: string;
}

interface UpdatePlanData {
  id: number;
  title?: string;
  startDate?: string;
  endDate?: string;
  currentPage?: number;
  frequency?: 'daily' | 'weekly';
  pagesPerSession?: number;
  notes?: string;
}

interface LogSessionData {
  book_id: number;
  reading_plan_id?: number;
  pagesRead: number;
  minutesSpent?: number;
  notes?: string;
}

// Initial state
const initialState: ReadingPlansState = {
  plans: [],
  currentPlan: null,
  readingSessions: [],
  loading: false,
  error: null,
};

// Real API only: use Supabase directly, no local mock data.

// Async thunks
export const fetchReadingPlans = createAsyncThunk(
  'readingPlans/fetchReadingPlans',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('reading_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as ReadingPlan[];
  }
);

export const createReadingPlan = createAsyncThunk(
  'readingPlans/createReadingPlan',
  async ({ 
    user_id, 
    book_id, 
    startDate, 
    endDate, 
    dailyGoal,
    notes 
  }: {
    user_id: string;
    book_id: number;
    startDate: string;
    endDate: string;
    dailyGoal: number;
    notes?: string;
  }, { rejectWithValue }) => {
    try {
      const { data: plan, error } = await supabase
        .from('reading_plans')
        .insert([{
          user_id: user_id,
          book_id: book_id,
          start_date: startDate,
          end_date: endDate,
          daily_goal: dailyGoal,
          notes,
          current_page: 0,
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;
      return plan;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateReadingProgress = createAsyncThunk(
  'readingPlans/updateReadingProgress',
  async ({ 
    planId, 
    currentPage,
    status
  }: {
    planId: number;
    currentPage: number;
    status?: 'active' | 'completed' | 'abandoned';
  }, { rejectWithValue }) => {
    try {
      const updateData: any = {
        current_page: currentPage,
        last_read_date: new Date().toISOString()
      };

      if (status) {
        updateData.status = status;
      }

      const { data: plan, error } = await supabase
        .from('reading_plans')
        .update(updateData)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return plan;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchReadingSessions = createAsyncThunk(
  'readingPlans/fetchReadingSessions',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const user = state.auth.user;
      if (!user) return [];

      const { data, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ReadingSession[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logReadingSession = createAsyncThunk(
  'readingPlans/logReadingSession',
  async (sessionData: LogSessionData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const user = state.auth.user;
      if (!user) {
        return rejectWithValue('User not authenticated');
      }

      const koachEarned = sessionData.pagesRead;
      const sessionPayload = {
        user_id: user.id,
        book_id: sessionData.book_id,
        reading_plan_id: sessionData.reading_plan_id ?? null,
        pages_read: sessionData.pagesRead,
        minutes_spent: sessionData.minutesSpent ?? 0,
        koach_earned: koachEarned,
        session_date: new Date().toISOString(),
      };

      const { data: session, error: sessionError } = await supabase
        .from('reading_sessions')
        .insert(sessionPayload)
        .select('*')
        .single();

      if (sessionError) throw sessionError;
      
      // If this session is part of a reading plan, we'll also need to update the plan's currentPage
      if (sessionData.reading_plan_id) {
        const plan = state.readingPlans.plans.find(p => p.id === sessionData.reading_plan_id);
        
        if (plan) {
          const updatedCurrentPage = plan.current_page + sessionData.pagesRead;

          await supabase
            .from('reading_plans')
            .update({
              current_page: updatedCurrentPage,
              last_read_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionData.reading_plan_id);

          return { session, planId: sessionData.reading_plan_id, updatedCurrentPage };
        }
      }
      
      return { session };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Reading plans slice
const readingPlansSlice = createSlice({
  name: 'readingPlans',
  initialState,
  reducers: {
    // Any synchronous actions here
    clearReadingPlans: (state) => {
      state.plans = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch reading plans
      .addCase(fetchReadingPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReadingPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
      })
      .addCase(fetchReadingPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch reading plans';
      })
      // Create reading plan
      .addCase(createReadingPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReadingPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.plans.unshift(action.payload);
      })
      .addCase(createReadingPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update reading progress
      .addCase(updateReadingProgress.fulfilled, (state, action) => {
        const index = state.plans.findIndex(plan => plan.id === action.payload.id);
        if (index !== -1) {
          state.plans[index] = action.payload;
        }
      })
      // Fetch reading sessions
      .addCase(fetchReadingSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReadingSessions.fulfilled, (state, action: PayloadAction<ReadingSession[]>) => {
        state.loading = false;
        state.readingSessions = action.payload;
      })
      .addCase(fetchReadingSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch reading sessions';
      })
      // Log reading session
      .addCase(logReadingSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        logReadingSession.fulfilled,
        (
          state,
          action: PayloadAction<{
            session: ReadingSession;
            planId?: number;
            updatedCurrentPage?: number;
          }>
        ) => {
          state.loading = false;
          state.readingSessions.unshift(action.payload.session);
          
          // If this session was part of a reading plan, update the plan's currentPage
          if (action.payload.planId && action.payload.updatedCurrentPage !== undefined) {
            const planIndex = state.plans.findIndex(plan => plan.id === action.payload.planId);
            if (planIndex !== -1) {
              state.plans[planIndex].current_page = action.payload.updatedCurrentPage;
            }
          }
        }
      )
      .addCase(logReadingSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to log reading session';
      });
  },
});

// Export actions
export const { clearReadingPlans } = readingPlansSlice.actions;

// Export selectors
export const selectReadingPlans = (state: RootState) => state.readingPlans.plans;
export const selectCurrentPlan = (state: RootState) => state.readingPlans.currentPlan;
export const selectReadingSessions = (state: RootState) => state.readingPlans.readingSessions;
export const selectReadingPlansLoading = (state: RootState) => state.readingPlans.loading;
export const selectReadingPlansError = (state: RootState) => state.readingPlans.error;
export const selectBookReadingPlan = (state: RootState, book_id: number) => 
  state.readingPlans.plans.find(plan => plan.book_id === book_id);

// Export reducer
export default readingPlansSlice.reducer;