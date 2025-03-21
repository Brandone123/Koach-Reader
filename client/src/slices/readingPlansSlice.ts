import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { Book } from './booksSlice';

// Types
export interface ReadingPlan {
  id: number;
  userId: number;
  bookId: number;
  title: string;
  startDate: string;
  endDate: string;
  totalPages: number;
  currentPage: number;
  frequency: 'daily' | 'weekly';
  pagesPerSession: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  book?: {
    title: string;
    author: string;
    coverImageUrl?: string;
  };
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
  isLoading: boolean;
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
  isLoading: false,
  error: null,
};

// Mock API functions (to be replaced with real API calls)
const readingPlansAPI = {
  getReadingPlans: async (): Promise<ReadingPlan[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated reading plans data
    const plans: { [key: number]: ReadingPlan } = {
      1: {
        id: 1,
        userId: 1,
        bookId: 1,
        title: 'Read The Bible in 90 Days',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        totalPages: 1200,
        currentPage: 120,
        frequency: 'daily',
        pagesPerSession: 14,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        book: {
          title: 'The Bible',
          author: 'Various Authors',
          coverImageUrl: 'https://via.placeholder.com/150',
        },
      },
      2: {
        id: 2,
        userId: 1,
        bookId: 2,
        title: 'Purpose Driven Life Study',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        totalPages: 368,
        currentPage: 45,
        frequency: 'daily',
        pagesPerSession: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        book: {
          title: 'The Purpose Driven Life',
          author: 'Rick Warren',
          coverImageUrl: 'https://via.placeholder.com/150',
        },
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
        userId: 1,
        bookId: 1,
        title: 'Read The Bible in 90 Days',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        totalPages: 1200,
        currentPage: 120,
        frequency: 'daily',
        pagesPerSession: 14,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        book: {
          title: 'The Bible',
          author: 'Various Authors',
          coverImageUrl: 'https://via.placeholder.com/150',
        },
      },
      2: {
        id: 2,
        userId: 1,
        bookId: 2,
        title: 'Purpose Driven Life Study',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        totalPages: 368,
        currentPage: 45,
        frequency: 'daily',
        pagesPerSession: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        book: {
          title: 'The Purpose Driven Life',
          author: 'Rick Warren',
          coverImageUrl: 'https://via.placeholder.com/150',
        },
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
      userId: 1, // Assuming the current user's ID
      ...planData,
      currentPage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      book: {
        title: 'Newly Added Book',
        author: 'Author Name',
      },
    };
  },
  
  updateReadingPlan: async (planData: UpdatePlanData): Promise<ReadingPlan> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For simplicity, we'll return a mock updated plan
    return {
      id: planData.id,
      userId: 1,
      bookId: 1,
      title: planData.title || 'Updated Reading Plan',
      startDate: planData.startDate || new Date().toISOString(),
      endDate: planData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      totalPages: 300,
      currentPage: planData.currentPage || 0,
      frequency: planData.frequency || 'daily',
      pagesPerSession: planData.pagesPerSession || 10,
      notes: planData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      book: {
        title: 'Sample Book',
        author: 'Sample Author',
      },
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
  async (_, { rejectWithValue }) => {
    try {
      const plans = await readingPlansAPI.getReadingPlans();
      return plans;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchReadingPlanById = createAsyncThunk(
  'readingPlans/fetchReadingPlanById',
  async (planId: number, { rejectWithValue }) => {
    try {
      const plan = await readingPlansAPI.getReadingPlanById(planId);
      return plan;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createReadingPlan = createAsyncThunk(
  'readingPlans/createReadingPlan',
  async (planData: CreatePlanData, { rejectWithValue }) => {
    try {
      const plan = await readingPlansAPI.createReadingPlan(planData);
      return plan;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateReadingPlan = createAsyncThunk(
  'readingPlans/updateReadingPlan',
  async (planData: UpdatePlanData, { rejectWithValue }) => {
    try {
      const plan = await readingPlansAPI.updateReadingPlan(planData);
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
          const updatedCurrentPage = plan.currentPage + sessionData.pagesRead;
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
    clearReadingPlansError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch reading plans
      .addCase(fetchReadingPlans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReadingPlans.fulfilled, (state, action: PayloadAction<ReadingPlan[]>) => {
        state.isLoading = false;
        state.plans = action.payload;
      })
      .addCase(fetchReadingPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch reading plans';
      })
      // Fetch reading plan by ID
      .addCase(fetchReadingPlanById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReadingPlanById.fulfilled, (state, action: PayloadAction<ReadingPlan>) => {
        state.isLoading = false;
        state.currentPlan = action.payload;
      })
      .addCase(fetchReadingPlanById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch reading plan';
      })
      // Create reading plan
      .addCase(createReadingPlan.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReadingPlan.fulfilled, (state, action: PayloadAction<ReadingPlan>) => {
        state.isLoading = false;
        state.plans.push(action.payload);
        state.currentPlan = action.payload;
      })
      .addCase(createReadingPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to create reading plan';
      })
      // Update reading plan
      .addCase(updateReadingPlan.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateReadingPlan.fulfilled, (state, action: PayloadAction<ReadingPlan>) => {
        state.isLoading = false;
        
        // Update in plans array
        const index = state.plans.findIndex(plan => plan.id === action.payload.id);
        if (index !== -1) {
          state.plans[index] = action.payload;
        }
        
        // Update currentPlan if it's the same plan
        if (state.currentPlan && state.currentPlan.id === action.payload.id) {
          state.currentPlan = action.payload;
        }
      })
      .addCase(updateReadingPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update reading plan';
      })
      // Fetch reading sessions
      .addCase(fetchReadingSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReadingSessions.fulfilled, (state, action: PayloadAction<ReadingSession[]>) => {
        state.isLoading = false;
        state.readingSessions = action.payload;
      })
      .addCase(fetchReadingSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch reading sessions';
      })
      // Log reading session
      .addCase(logReadingSession.pending, (state) => {
        state.isLoading = true;
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
          state.isLoading = false;
          state.readingSessions.unshift(action.payload.session);
          
          // If this session was part of a reading plan, update the plan's currentPage
          if (action.payload.planId && action.payload.updatedCurrentPage !== undefined) {
            const planIndex = state.plans.findIndex(plan => plan.id === action.payload.planId);
            if (planIndex !== -1) {
              state.plans[planIndex].currentPage = action.payload.updatedCurrentPage;
              
              // Also update currentPlan if it's the same plan
              if (state.currentPlan && state.currentPlan.id === action.payload.planId) {
                state.currentPlan.currentPage = action.payload.updatedCurrentPage;
              }
            }
          }
        }
      )
      .addCase(logReadingSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to log reading session';
      });
  },
});

// Export actions
export const { clearReadingPlansError } = readingPlansSlice.actions;

// Export selectors
export const selectReadingPlans = (state: RootState) => state.readingPlans.plans;
export const selectCurrentPlan = (state: RootState) => state.readingPlans.currentPlan;
export const selectReadingSessions = (state: RootState) => state.readingPlans.readingSessions;
export const selectReadingPlansLoading = (state: RootState) => state.readingPlans.isLoading;
export const selectReadingPlansError = (state: RootState) => state.readingPlans.error;

// Export reducer
export default readingPlansSlice.reducer;