import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Types
export interface ReadingPlan {
  id: number;
  userId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  goalPages: number;
  goalMinutes: number;
  completedPages: number;
  completedMinutes: number;
  progress: number; // 0-100
  bookId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingSession {
  id: number;
  userId: number;
  bookId: number;
  readingPlanId: number | null;
  pagesRead: number;
  minutesSpent: number;
  date: string;
  koachEarned: number;
}

interface ReadingPlansState {
  readingPlans: ReadingPlan[];
  currentPlan: ReadingPlan | null;
  sessions: ReadingSession[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ReadingPlansState = {
  readingPlans: [],
  currentPlan: null,
  sessions: [],
  isLoading: false,
  error: null,
};

// Async actions
export const fetchReadingPlans = createAsyncThunk(
  'readingPlans/fetchReadingPlans',
  async (_, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return [
        {
          id: 1,
          userId: 1,
          name: 'Summer Reading Plan',
          description: 'Read 3 books over the summer',
          startDate: '2023-06-01',
          endDate: '2023-08-31',
          goalPages: 1000,
          goalMinutes: 3000,
          completedPages: 250,
          completedMinutes: 800,
          progress: 25,
          bookId: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    } catch (error) {
      return rejectWithValue('Failed to fetch reading plans.');
    }
  }
);

export const fetchReadingPlanById = createAsyncThunk(
  'readingPlans/fetchReadingPlanById',
  async (planId: number, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return {
        id: planId,
        userId: 1,
        name: 'Summer Reading Plan',
        description: 'Read 3 books over the summer',
        startDate: '2023-06-01',
        endDate: '2023-08-31',
        goalPages: 1000,
        goalMinutes: 3000,
        completedPages: 250,
        completedMinutes: 800,
        progress: 25,
        bookId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue('Failed to fetch reading plan details.');
    }
  }
);

export const createReadingSession = createAsyncThunk(
  'readingPlans/createReadingSession',
  async (
    {
      bookId,
      readingPlanId,
      pagesRead,
      minutesSpent,
    }: {
      bookId: number;
      readingPlanId: number | null;
      pagesRead: number;
      minutesSpent: number;
    },
    { rejectWithValue }
  ) => {
    try {
      // Mock data - will connect to server later
      return {
        id: Math.floor(Math.random() * 1000),
        userId: 1,
        bookId,
        readingPlanId,
        pagesRead,
        minutesSpent,
        date: new Date().toISOString(),
        koachEarned: pagesRead * 2, // 2 points per page
      };
    } catch (error) {
      return rejectWithValue('Failed to record reading session.');
    }
  }
);

// Slice
const readingPlansSlice = createSlice({
  name: 'readingPlans',
  initialState,
  reducers: {
    setCurrentPlan: (state, action: PayloadAction<ReadingPlan>) => {
      state.currentPlan = action.payload;
    },
    clearCurrentPlan: (state) => {
      state.currentPlan = null;
    },
    updatePlanProgress: (
      state,
      action: PayloadAction<{
        planId: number;
        pagesRead: number;
        minutesSpent: number;
      }>
    ) => {
      const { planId, pagesRead, minutesSpent } = action.payload;
      const plan = state.readingPlans.find((p) => p.id === planId);

      if (plan) {
        plan.completedPages += pagesRead;
        plan.completedMinutes += minutesSpent;
        plan.progress = Math.min(
          100,
          Math.round(((plan.completedPages / plan.goalPages) * 100 + (plan.completedMinutes / plan.goalMinutes) * 100) / 2)
        );
      }

      if (state.currentPlan?.id === planId) {
        state.currentPlan.completedPages += pagesRead;
        state.currentPlan.completedMinutes += minutesSpent;
        state.currentPlan.progress = Math.min(
          100,
          Math.round(
            ((state.currentPlan.completedPages / state.currentPlan.goalPages) * 100 +
              (state.currentPlan.completedMinutes / state.currentPlan.goalMinutes) * 100) /
              2
          )
        );
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Reading Plans
    builder.addCase(fetchReadingPlans.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchReadingPlans.fulfilled, (state, action) => {
      state.isLoading = false;
      state.readingPlans = action.payload;
    });
    builder.addCase(fetchReadingPlans.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch Reading Plan By Id
    builder.addCase(fetchReadingPlanById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchReadingPlanById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentPlan = action.payload;
    });
    builder.addCase(fetchReadingPlanById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create Reading Session
    builder.addCase(createReadingSession.fulfilled, (state, action) => {
      state.sessions.push(action.payload);

      // If the session is associated with a plan, update the plan's progress
      if (action.payload.readingPlanId) {
        const plan = state.readingPlans.find((p) => p.id === action.payload.readingPlanId);
        if (plan) {
          plan.completedPages += action.payload.pagesRead;
          plan.completedMinutes += action.payload.minutesSpent;
          plan.progress = Math.min(
            100,
            Math.round(((plan.completedPages / plan.goalPages) * 100 + (plan.completedMinutes / plan.goalMinutes) * 100) / 2)
          );
        }

        if (state.currentPlan?.id === action.payload.readingPlanId) {
          state.currentPlan.completedPages += action.payload.pagesRead;
          state.currentPlan.completedMinutes += action.payload.minutesSpent;
          state.currentPlan.progress = Math.min(
            100,
            Math.round(
              ((state.currentPlan.completedPages / state.currentPlan.goalPages) * 100 +
                (state.currentPlan.completedMinutes / state.currentPlan.goalMinutes) * 100) /
                2
            )
          );
        }
      }
    });
  },
});

// Actions
export const { setCurrentPlan, clearCurrentPlan, updatePlanProgress } = readingPlansSlice.actions;

// Selectors
export const selectAllReadingPlans = (state: RootState) => state.readingPlans.readingPlans;
export const selectCurrentPlan = (state: RootState) => state.readingPlans.currentPlan;
export const selectReadingSessions = (state: RootState) => state.readingPlans.sessions;
export const selectIsLoading = (state: RootState) => state.readingPlans.isLoading;
export const selectError = (state: RootState) => state.readingPlans.error;

export default readingPlansSlice.reducer;