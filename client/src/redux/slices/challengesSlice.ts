import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Types
export interface Challenge {
  id: number;
  title: string;
  description: string;
  creatorId: number;
  startDate: string;
  endDate: string;
  goal: number;
  goalType: 'pages' | 'books' | 'minutes';
  bookId?: number;
  categoryId?: number;
  isPrivate: boolean;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeParticipant {
  id: number;
  challengeId: number;
  userId: number;
  progress: number;
  status: 'active' | 'completed' | 'abandoned';
  username: string;
  joinedAt: string;
}

interface ChallengesState {
  challenges: Challenge[];
  userChallenges: Challenge[];
  currentChallenge: Challenge | null;
  participants: ChallengeParticipant[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChallengesState = {
  challenges: [],
  userChallenges: [],
  currentChallenge: null,
  participants: [],
  isLoading: false,
  error: null,
};

// Async actions
export const fetchChallenges = createAsyncThunk(
  'challenges/fetchChallenges',
  async (_, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return [
        {
          id: 1,
          title: 'Summer Reading Challenge',
          description: 'Read 5 books over the summer',
          creatorId: 2,
          startDate: '2023-06-01',
          endDate: '2023-08-31',
          goal: 5,
          goalType: 'books',
          isPrivate: false,
          participantCount: 25,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Fantasy Book Club',
          description: 'Read 1000 pages of fantasy books',
          creatorId: 3,
          startDate: '2023-07-01',
          endDate: '2023-09-30',
          goal: 1000,
          goalType: 'pages',
          categoryId: 4,
          isPrivate: false,
          participantCount: 18,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    } catch (error) {
      return rejectWithValue('Failed to fetch challenges.');
    }
  }
);

export const fetchUserChallenges = createAsyncThunk(
  'challenges/fetchUserChallenges',
  async (_, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return [
        {
          id: 1,
          title: 'Summer Reading Challenge',
          description: 'Read 5 books over the summer',
          creatorId: 2,
          startDate: '2023-06-01',
          endDate: '2023-08-31',
          goal: 5,
          goalType: 'books',
          isPrivate: false,
          participantCount: 25,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    } catch (error) {
      return rejectWithValue('Failed to fetch your challenges.');
    }
  }
);

export const fetchChallengeById = createAsyncThunk(
  'challenges/fetchChallengeById',
  async (challengeId: number, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return {
        id: challengeId,
        title: 'Summer Reading Challenge',
        description: 'Read 5 books over the summer',
        creatorId: 2,
        startDate: '2023-06-01',
        endDate: '2023-08-31',
        goal: 5,
        goalType: 'books',
        isPrivate: false,
        participantCount: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue('Failed to fetch challenge details.');
    }
  }
);

export const fetchChallengeParticipants = createAsyncThunk(
  'challenges/fetchChallengeParticipants',
  async (challengeId: number, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return [
        {
          id: 1,
          challengeId,
          userId: 1,
          progress: 60,
          status: 'active',
          username: 'user1',
          joinedAt: new Date().toISOString(),
        },
        {
          id: 2,
          challengeId,
          userId: 2,
          progress: 80,
          status: 'active',
          username: 'user2',
          joinedAt: new Date().toISOString(),
        },
        {
          id: 3,
          challengeId,
          userId: 3,
          progress: 100,
          status: 'completed',
          username: 'user3',
          joinedAt: new Date().toISOString(),
        },
      ];
    } catch (error) {
      return rejectWithValue('Failed to fetch challenge participants.');
    }
  }
);

export const joinChallenge = createAsyncThunk(
  'challenges/joinChallenge',
  async (challengeId: number, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return {
        id: Math.floor(Math.random() * 1000),
        challengeId,
        userId: 1,
        progress: 0,
        status: 'active',
        username: 'currentUser',
        joinedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue('Failed to join challenge.');
    }
  }
);

export const updateChallengeProgress = createAsyncThunk(
  'challenges/updateChallengeProgress',
  async (
    { challengeId, progress }: { challengeId: number; progress: number },
    { rejectWithValue }
  ) => {
    try {
      // Mock data - will connect to server later
      return {
        challengeId,
        userId: 1,
        progress,
      };
    } catch (error) {
      return rejectWithValue('Failed to update challenge progress.');
    }
  }
);

// Slice
const challengesSlice = createSlice({
  name: 'challenges',
  initialState,
  reducers: {
    setCurrentChallenge: (state, action: PayloadAction<Challenge>) => {
      state.currentChallenge = action.payload;
    },
    clearCurrentChallenge: (state) => {
      state.currentChallenge = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Challenges
    builder.addCase(fetchChallenges.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchChallenges.fulfilled, (state, action) => {
      state.isLoading = false;
      state.challenges = action.payload;
    });
    builder.addCase(fetchChallenges.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch User Challenges
    builder.addCase(fetchUserChallenges.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUserChallenges.fulfilled, (state, action) => {
      state.isLoading = false;
      state.userChallenges = action.payload;
    });
    builder.addCase(fetchUserChallenges.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch Challenge By Id
    builder.addCase(fetchChallengeById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchChallengeById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentChallenge = action.payload;
    });
    builder.addCase(fetchChallengeById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch Challenge Participants
    builder.addCase(fetchChallengeParticipants.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchChallengeParticipants.fulfilled, (state, action) => {
      state.isLoading = false;
      state.participants = action.payload;
    });
    builder.addCase(fetchChallengeParticipants.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Join Challenge
    builder.addCase(joinChallenge.fulfilled, (state, action) => {
      state.participants.push(action.payload);
      if (state.currentChallenge) {
        state.currentChallenge.participantCount += 1;
      }

      // Add to user challenges if not already there
      const exists = state.userChallenges.some((c) => c.id === action.payload.challengeId);
      if (!exists && state.currentChallenge) {
        state.userChallenges.push(state.currentChallenge);
      }
    });

    // Update Challenge Progress
    builder.addCase(updateChallengeProgress.fulfilled, (state, action) => {
      const participant = state.participants.find(
        (p) => p.challengeId === action.payload.challengeId && p.userId === action.payload.userId
      );

      if (participant) {
        participant.progress = action.payload.progress;
        if (participant.progress >= 100) {
          participant.status = 'completed';
        }
      }
    });
  },
});

// Actions
export const { setCurrentChallenge, clearCurrentChallenge } = challengesSlice.actions;

// Selectors
export const selectAllChallenges = (state: RootState) => state.challenges.challenges;
export const selectUserChallenges = (state: RootState) => state.challenges.userChallenges;
export const selectCurrentChallenge = (state: RootState) => state.challenges.currentChallenge;
export const selectChallengeParticipants = (state: RootState) => state.challenges.participants;
export const selectIsLoading = (state: RootState) => state.challenges.isLoading;
export const selectError = (state: RootState) => state.challenges.error;

export default challengesSlice.reducer;