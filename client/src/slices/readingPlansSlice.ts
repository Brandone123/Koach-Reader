import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { Book } from './booksSlice';
import { supabase } from '../lib/supabase';

// Types
export interface ReadingPlan {
  id: number;
  user_id: string;
  book_id: number;
  start_date: string;
  end_date: string;
  current_page: number;
  daily_goal: number;
  notes: string | null;
  last_read_date: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface ReadingSession {
  id: number;
  userId: number;
  bookId: number;
  readingPlanId: number | null;
  pagesRead: number;
  minutesSpent: number;
  koachEarned: number;
  notes?: string;
  createdAt: string;
}

interface ReadingPlansState {
  plans: ReadingPlan[];
  currentPlan: ReadingPlan | null;
  readingSessions: ReadingSession[];
  loading: boolean;
  error: string | null;
}

interface CreatePlanData {
  bookId: number;
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
  bookId: number;
  readingPlanId?: number;
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

// Mock API functions (to be replaced with real API calls)
const readingPlansAPI = {
  getReadingPlans: async (params: {} = {}): Promise<ReadingPlan[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated reading plans data
    const plans: { [key: number]: ReadingPlan } = {
      1: {
        id: 1,
        userId: "1",
        bookId: 1,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        current_page: 120,
        daily_goal: 14,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      2: {
        id: 2,
        userId: "1",
        bookId: 2,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        current_page: 45,
        daily_goal: 10,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    
    return Object.values(plans);
  },
  
  getReadingPlanById: async (planId: number): Promise<ReadingPlan> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated plan data
    const plans: { [key: number]: ReadingPlan } = {
      1: {
        id: 1,
        userId: "1",
        bookId: 1,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        current_page: 120,
        daily_goal: 14,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      2: {
        id: 2,
        userId: "1",
        bookId: 2,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        current_page: 45,
        daily_goal: 10,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    
    const plan = plans[planId];
    
    if (!plan) {
      throw new Error('Reading plan not found');
    }
    
    return plan;
  },
  
  createReadingPlan: async (planData: CreatePlanData): Promise<ReadingPlan> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated API response
    return {
      id: Math.floor(Math.random() * 1000), // Simulated ID
      userId: "1", // Assuming the current user's ID
      bookId: planData.bookId,
      start_date: planData.startDate,
      end_date: planData.endDate,
      current_page: 0,
      daily_goal: planData.pagesPerSession,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },
  
  updateReadingPlan: async (planData: UpdatePlanData): Promise<ReadingPlan> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For simplicity, we'll return a mock updated plan
    return {
      id: planData.id,
      userId: "1",
      bookId: 1,
      start_date: planData.startDate || new Date().toISOString(),
      end_date: planData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      current_page: planData.currentPage || 0,
      daily_goal: planData.pagesPerSession || 10,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },
  
  logReadingSession: async (sessionData: LogSessionData): Promise<ReadingSession> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Calculate Koach points (simple formula: 1 point per page)
    const koachEarned = sessionData.pagesRead;
    
    // Simulated API response
    return {
      id: Math.floor(Math.random() * 1000), // Simulated ID
      userId: 1, // Assuming the current user's ID
      bookId: sessionData.bookId,
      readingPlanId: sessionData.readingPlanId || null,
      pagesRead: sessionData.pagesRead,
      minutesSpent: sessionData.minutesSpent || 0,
      koachEarned,
      notes: sessionData.notes,
      createdAt: new Date().toISOString(),
    };
  },
  
  getReadingSessions: async (): Promise<ReadingSession[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated reading sessions
    return [
      {
        id: 1,
        userId: 1,
        bookId: 1,
        readingPlanId: 1,
        pagesRead: 14,
        minutesSpent: 30,
        koachEarned: 14,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        userId: 1,
        bookId: 1,
        readingPlanId: 1,
        pagesRead: 15,
        minutesSpent: 35,
        koachEarned: 15,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        userId: 1,
        bookId: 2,
        readingPlanId: 2,
        pagesRead: 10,
        minutesSpent: 25,
        koachEarned: 10,
        createdAt: new Date().toISOString(),
      },
    ];
  },
};

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
    userId, 
    bookId, 
    startDate, 
    endDate, 
    dailyGoal,
    notes 
  }: {
    userId: string;
    bookId: number;
    startDate: string;
    endDate: string;
    dailyGoal: number;
    notes?: string;
  }, { rejectWithValue }) => {
    try {
      const { data: plan, error } = await supabase
        .from('reading_plans')
        .insert([{
          user_id: userId,
          book_id: bookId,
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
  async (_, { rejectWithValue }) => {
    try {
      const sessions = await readingPlansAPI.getReadingSessions();
      return sessions;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logReadingSession = createAsyncThunk(
  'readingPlans/logReadingSession',
  async (sessionData: LogSessionData, { rejectWithValue, getState }) => {
    try {
      const session = await readingPlansAPI.logReadingSession(sessionData);
      
      // If this session is part of a reading plan, we'll also need to update the plan's currentPage
      if (sessionData.readingPlanId) {
        const state = getState() as RootState;
        const plan = state.readingPlans.plans.find(p => p.id === sessionData.readingPlanId);
        
        if (plan) {
          const updatedCurrentPage = plan.current_page + sessionData.pagesRead;
          // In a real application, we would call an API to update the plan
          // For now, we'll just include this information to be handled in the reducer
          return { session, planId: sessionData.readingPlanId, updatedCurrentPage };
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
export const selectBookReadingPlan = (state: RootState, bookId: number) => 
  state.readingPlans.plans.find(plan => plan.book_id === bookId);

// Export reducer
export default readingPlansSlice.reducer;