import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { fetchApi } from '../utils/api';
import { mockFetchApi } from '../utils/mockApi';

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
  myProgress?: number;
  status?: 'active' | 'completed' | 'abandoned';
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

export interface ChallengeComment {
  id: number;
  challengeId: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
}

interface ChallengesState {
  challenges: Challenge[];
  userChallenges: Challenge[];
  currentChallenge: Challenge | null;
  participants: ChallengeParticipant[];
  comments: ChallengeComment[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChallengesState = {
  challenges: [],
  userChallenges: [],
  currentChallenge: null,
  participants: [],
  comments: [],
  isLoading: false,
  error: null,
};

// Fetch all challenges
export const fetchChallenges = createAsyncThunk(
  'challenges/fetchChallenges',
  async (_, { rejectWithValue }) => {
    try {
      // Try to fetch from real API
      const data = await fetchApi('/api/challenges');
      return data;
    } catch (error) {
      try {
        // Fall back to mock API
        const mockData = await mockFetchApi('/api/challenges');
        return mockData;
      } catch (mockError: any) {
        return rejectWithValue(mockError.message || 'Failed to fetch challenges');
      }
    }
  }
);

// Fetch challenges the user is participating in
export const fetchUserChallenges = createAsyncThunk(
  'challenges/fetchUserChallenges',
  async (_, { rejectWithValue }) => {
    try {
      // Try to fetch from real API
      const data = await fetchApi('/api/user/challenges');
      return data;
    } catch (error) {
      try {
        // Fall back to mock API
        // In the mock scenario, we'll filter challenges with myProgress defined
        const mockData = await mockFetchApi('/api/challenges');
        return mockData.filter((challenge: any) => challenge.myProgress !== undefined);
      } catch (mockError: any) {
        return rejectWithValue(mockError.message || 'Failed to fetch user challenges');
      }
    }
  }
);

// Fetch challenge details by ID
export const fetchChallengeById = createAsyncThunk(
  'challenges/fetchChallengeById',
  async (challengeId: number, { rejectWithValue }) => {
    try {
      // Try to fetch from real API
      const data = await fetchApi(`/api/challenges/${challengeId}`);
      return data;
    } catch (error) {
      try {
        // Fall back to mock API
        const mockData = await mockFetchApi(`/api/challenges/${challengeId}`);
        return mockData;
      } catch (mockError: any) {
        return rejectWithValue(mockError.message || 'Failed to fetch challenge details');
      }
    }
  }
);

// Fetch challenge participants
export const fetchChallengeParticipants = createAsyncThunk(
  'challenges/fetchChallengeParticipants',
  async (challengeId: number, { rejectWithValue }) => {
    try {
      // Try to fetch from real API
      const data = await fetchApi(`/api/challenges/${challengeId}/participants`);
      return data;
    } catch (error) {
      try {
        // Fall back to mock API
        const mockData = await mockFetchApi(`/api/challenges/${challengeId}/participants`);
        return mockData;
      } catch (mockError: any) {
        return rejectWithValue(mockError.message || 'Failed to fetch challenge participants');
      }
    }
  }
);

// Fetch challenge comments
export const fetchChallengeComments = createAsyncThunk(
  'challenges/fetchChallengeComments',
  async (challengeId: number, { rejectWithValue }) => {
    try {
      // Try to fetch from real API
      const data = await fetchApi(`/api/challenges/${challengeId}/comments`);
      return data;
    } catch (error) {
      try {
        // Fall back to mock API
        const mockData = await mockFetchApi(`/api/challenges/${challengeId}/comments`);
        return mockData;
      } catch (mockError: any) {
        return rejectWithValue(mockError.message || 'Failed to fetch challenge comments');
      }
    }
  }
);

// Join a challenge
export const joinChallenge = createAsyncThunk(
  'challenges/joinChallenge',
  async (challengeId: number, { rejectWithValue }) => {
    try {
      // Try to use real API
      const response = await fetchApi(`/api/challenges/${challengeId}/join`, {
        method: 'POST'
      });
      return { ...response, challengeId };
    } catch (error) {
      try {
        // Fall back to mock API
        const mockResponse = await mockFetchApi(`/api/challenges/${challengeId}/join`, {
          method: 'POST'
        });
        return { ...mockResponse, challengeId };
      } catch (mockError: any) {
        return rejectWithValue(mockError.message || 'Failed to join challenge');
      }
    }
  }
);

// Update challenge progress
export const updateChallengeProgress = createAsyncThunk(
  'challenges/updateChallengeProgress',
  async ({ challengeId, progress }: { challengeId: number; progress: number }, { rejectWithValue }) => {
    try {
      // Try to use real API
      const response = await fetchApi(`/api/challenges/${challengeId}/progress`, {
        method: 'POST',
        body: { progress }
      });
      return { ...response, challengeId, progress };
    } catch (error) {
      try {
        // Fall back to mock API
        const mockResponse = await mockFetchApi(`/api/challenges/${challengeId}/progress`, {
          method: 'POST',
          body: { progress }
        });
        return { ...mockResponse, challengeId, progress };
      } catch (mockError: any) {
        return rejectWithValue(mockError.message || 'Failed to update challenge progress');
      }
    }
  }
);

// Create a new challenge
export const createChallenge = createAsyncThunk(
  'challenges/createChallenge',
  async (challengeData: Omit<Challenge, 'id' | 'participantCount' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      // Try to use real API
      const response = await fetchApi('/api/challenges', {
        method: 'POST',
        body: challengeData
      });
      return response;
    } catch (error) {
      try {
        // Fall back to mock API
        const mockResponse = await mockFetchApi('/api/challenges', {
          method: 'POST',
          body: challengeData
        });
        return mockResponse;
      } catch (mockError: any) {
        return rejectWithValue(mockError.message || 'Failed to create challenge');
      }
    }
  }
);

// Add a comment to a challenge
export const addChallengeComment = createAsyncThunk(
  'challenges/addChallengeComment',
  async ({ challengeId, content }: { challengeId: number; content: string }, { rejectWithValue }) => {
    try {
      // Try to use real API
      const response = await fetchApi(`/api/challenges/${challengeId}/comments`, {
        method: 'POST',
        body: { content }
      });
      return response;
    } catch (error) {
      try {
        // Fall back to mock API
        const mockResponse = await mockFetchApi(`/api/challenges/${challengeId}/comments`, {
          method: 'POST',
          body: { content }
        });
        return mockResponse;
      } catch (mockError: any) {
        return rejectWithValue(mockError.message || 'Failed to add comment');
      }
    }
  }
);

const challengesSlice = createSlice({
  name: 'challenges',
  initialState,
  reducers: {
    clearCurrentChallenge: (state) => {
      state.currentChallenge = null;
      state.participants = [];
      state.comments = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Challenges
      .addCase(fetchChallenges.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChallenges.fulfilled, (state, action: PayloadAction<Challenge[]>) => {
        state.isLoading = false;
        state.challenges = action.payload;
      })
      .addCase(fetchChallenges.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch challenges';
      })

      // Fetch User Challenges
      .addCase(fetchUserChallenges.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserChallenges.fulfilled, (state, action: PayloadAction<Challenge[]>) => {
        state.isLoading = false;
        state.userChallenges = action.payload;
      })
      .addCase(fetchUserChallenges.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch user challenges';
      })

      // Fetch Challenge By ID
      .addCase(fetchChallengeById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChallengeById.fulfilled, (state, action: PayloadAction<Challenge>) => {
        state.isLoading = false;
        state.currentChallenge = action.payload;
      })
      .addCase(fetchChallengeById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch challenge details';
      })

      // Fetch Challenge Participants
      .addCase(fetchChallengeParticipants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChallengeParticipants.fulfilled, (state, action: PayloadAction<ChallengeParticipant[]>) => {
        state.isLoading = false;
        state.participants = action.payload;
      })
      .addCase(fetchChallengeParticipants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch challenge participants';
      })
      
      // Fetch Challenge Comments
      .addCase(fetchChallengeComments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChallengeComments.fulfilled, (state, action: PayloadAction<ChallengeComment[]>) => {
        state.isLoading = false;
        state.comments = action.payload;
      })
      .addCase(fetchChallengeComments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch challenge comments';
      })

      // Join Challenge
      .addCase(joinChallenge.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinChallenge.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the challenge in challenges list with new status
        state.challenges = state.challenges.map(challenge => 
          challenge.id === action.payload.challengeId
            ? { ...challenge, status: 'active' as const, myProgress: 0 }
            : challenge
        );
        // Add to user challenges if not already there
        if (!state.userChallenges.some(c => c.id === action.payload.challengeId)) {
          const challenge = state.challenges.find(c => c.id === action.payload.challengeId);
          if (challenge) {
            state.userChallenges.push({
              ...challenge,
              status: 'active' as const,
              myProgress: 0
            });
          }
        }
        // Update current challenge if it's the one being joined
        if (state.currentChallenge && state.currentChallenge.id === action.payload.challengeId) {
          state.currentChallenge = {
            ...state.currentChallenge,
            status: 'active' as const,
            myProgress: 0
          };
        }
      })
      .addCase(joinChallenge.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to join challenge';
      })

      // Update Challenge Progress
      .addCase(updateChallengeProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateChallengeProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        const { challengeId, progress } = action.payload;
        const status = progress >= (state.currentChallenge?.goal || 0) ? 'completed' as const : 'active' as const;
        
        // Update in challenges list
        state.challenges = state.challenges.map(challenge => 
          challenge.id === challengeId
            ? { ...challenge, myProgress: progress, status }
            : challenge
        );
        
        // Update in user challenges
        state.userChallenges = state.userChallenges.map(challenge => 
          challenge.id === challengeId
            ? { ...challenge, myProgress: progress, status }
            : challenge
        );
        
        // Update current challenge
        if (state.currentChallenge && state.currentChallenge.id === challengeId) {
          state.currentChallenge = {
            ...state.currentChallenge,
            myProgress: progress,
            status
          };
        }
        
        // Update the current user's entry in participants list
        const currentUserId = state.participants.find(p => p.status === 'active')?.userId;
        if (currentUserId) {
          state.participants = state.participants.map(participant => {
            if (participant.userId === currentUserId) {
              return {
                ...participant,
                progress,
                status
              };
            }
            return participant;
          });
        }
      })
      .addCase(updateChallengeProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update challenge progress';
      })
      
      // Create Challenge
      .addCase(createChallenge.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createChallenge.fulfilled, (state, action: PayloadAction<Challenge>) => {
        state.isLoading = false;
        state.challenges.push(action.payload);
        state.userChallenges.push(action.payload);
      })
      .addCase(createChallenge.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to create challenge';
      })
      
      // Add Challenge Comment
      .addCase(addChallengeComment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addChallengeComment.fulfilled, (state, action: PayloadAction<ChallengeComment>) => {
        state.isLoading = false;
        state.comments.unshift(action.payload);
      })
      .addCase(addChallengeComment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to add comment';
      });
  },
});

export const { clearCurrentChallenge } = challengesSlice.actions;

// Selectors
export const selectAllChallenges = (state: RootState) => state.challenges.challenges;
export const selectUserChallenges = (state: RootState) => state.challenges.userChallenges;
export const selectCurrentChallenge = (state: RootState) => state.challenges.currentChallenge;
export const selectChallengeParticipants = (state: RootState) => state.challenges.participants;
export const selectChallengeComments = (state: RootState) => state.challenges.comments;
export const selectChallengesLoading = (state: RootState) => state.challenges.isLoading;
export const selectChallengesError = (state: RootState) => state.challenges.error;

export default challengesSlice.reducer;