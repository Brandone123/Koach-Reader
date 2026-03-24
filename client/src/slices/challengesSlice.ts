import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { supabase } from '../lib/supabase';

export type ChallengeGoalType = 'pages' | 'books' | 'minutes' | 'koach';

export interface Challenge {
  id: number;
  title: string;
  description: string;
  creatorId: string;
  creatorUsername?: string;
  bookTitle?: string;
  startDate: string;
  endDate: string;
  goal: number;
  goalType: ChallengeGoalType;
  bookId?: number | null;
  isPrivate: boolean;
  participantCount: number;
  myProgress?: number;
  status?: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeParticipant {
  id: number;
  challengeId?: number;
  userId: string;
  progress: number;
  username: string;
  status: 'active' | 'completed' | 'abandoned';
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

export type CreateChallengeInput = {
  title: string;
  description?: string;
  goalType: ChallengeGoalType;
  goal: number;
  startDate: string;
  endDate: string;
  isPrivate: boolean;
  bookId?: number | null;
};

function mapTargetTypeToGoalType(tt: string | null | undefined): ChallengeGoalType {
  const t = (tt || 'pages').toLowerCase();
  if (t === 'books' || t === 'pages' || t === 'minutes' || t === 'koach') return t;
  return 'pages';
}

function goalTypeToDb(tt: ChallengeGoalType): string {
  if (tt === 'minutes') return 'minutes';
  if (tt === 'koach') return 'koach';
  if (tt === 'books') return 'books';
  return 'pages';
}

function mapRowToChallenge(
  row: any,
  extras: { participantCount: number; myProgress: number }
): Challenge {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    creatorId: String(row.creator_id),
    startDate: row.start_date,
    endDate: row.end_date,
    goal: row.target_value ?? row.goal ?? 0,
    goalType: mapTargetTypeToGoalType(row.target_type ?? row.goal_type),
    bookId: row.book_id ?? null,
    isPrivate: row.is_private === true,
    participantCount: extras.participantCount,
    myProgress: extras.myProgress,
    status: (row.status || 'active') as Challenge['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface ChallengesState {
  challenges: Challenge[];
  myChallenges: Challenge[];
  discoverChallenges: Challenge[];
  currentChallenge: Challenge | null;
  participants: ChallengeParticipant[];
  comments: ChallengeComment[];
  listLoading: boolean;
  detailLoading: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChallengesState = {
  challenges: [],
  myChallenges: [],
  discoverChallenges: [],
  currentChallenge: null,
  participants: [],
  comments: [],
  listLoading: false,
  detailLoading: false,
  isLoading: false,
  error: null,
};

/** Charge listes Mes défis / Découvrir (Supabase, pas Express) */
export const loadChallenges = createAsyncThunk(
  'challenges/loadChallenges',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { myChallenges: [] as Challenge[], discoverChallenges: [] as Challenge[], all: [] as Challenge[] };
      }

      const { data: rows, error: e1 } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (e1) throw e1;

      const { data: parts, error: e2 } = await supabase
        .from('challenge_participants')
        .select('challenge_id, user_id, current_progress, status');

      if (e2) throw e2;

      const byChallenge = new Map<number, { user_id: string; current_progress: number; status: string }[]>();
      parts?.forEach((p: any) => {
        const list = byChallenge.get(p.challenge_id) || [];
        list.push(p);
        byChallenge.set(p.challenge_id, list);
      });

      const uid = user.id;
      const all: Challenge[] = [];

      for (const row of rows || []) {
        const plist = byChallenge.get(row.id) || [];
        const isParticipant = plist.some((p) => p.user_id === uid);
        const isCreator = String(row.creator_id) === uid;
        const isPrivate = row.is_private === true;

        if (isPrivate && !isCreator && !isParticipant) continue;

        const myP = plist.find((p) => p.user_id === uid);
        all.push(
          mapRowToChallenge(row, {
            participantCount: plist.length,
            myProgress: myP?.current_progress ?? 0,
          })
        );
      }

      const myChallenges = all.filter(
        (c) => String(c.creatorId) === uid || parts?.some((p: any) => p.challenge_id === c.id && p.user_id === uid)
      );

      const discoverChallenges = all.filter(
        (c) =>
          !c.isPrivate &&
          String(c.creatorId) !== uid &&
          !parts?.some((p: any) => p.challenge_id === c.id && p.user_id === uid)
      );

      return { myChallenges, discoverChallenges, all };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load challenges');
    }
  }
);

export const fetchChallenges = loadChallenges;
export const fetchUserChallenges = loadChallenges;

export const fetchChallengeById = createAsyncThunk(
  'challenges/fetchChallengeById',
  async (challengeId: number, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: row, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();
      if (error) throw error;
      if (!row) throw new Error('Not found');

      const { data: plist } = await supabase
        .from('challenge_participants')
        .select('user_id, current_progress')
        .eq('challenge_id', challengeId);

      const myP = plist?.find((p: any) => p.user_id === user?.id);

      const { data: creatorRow } = await supabase
        .from('users')
        .select('username')
        .eq('id', row.creator_id)
        .maybeSingle();

      let bookTitle: string | undefined;
      if (row.book_id) {
        const { data: bk } = await supabase.from('books').select('title').eq('id', row.book_id).maybeSingle();
        bookTitle = bk?.title ?? undefined;
      }

      const challenge = mapRowToChallenge(row, {
        participantCount: plist?.length ?? 0,
        myProgress: myP?.current_progress ?? 0,
      });
      return { ...challenge, creatorUsername: creatorRow?.username, bookTitle };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch challenge');
    }
  }
);

export const fetchChallengeParticipants = createAsyncThunk(
  'challenges/fetchChallengeParticipants',
  async (challengeId: number, { rejectWithValue }) => {
    try {
      const { data: parts, error } = await supabase
        .from('challenge_participants')
        .select('id, user_id, current_progress, status, created_at')
        .eq('challenge_id', challengeId)
        .order('current_progress', { ascending: false });

      if (error) throw error;
      if (!parts?.length) return [] as ChallengeParticipant[];

      const userIds = [...new Set(parts.map((p: any) => p.user_id))];
      const { data: profiles } = await supabase
        .from('users')
        .select('id, username')
        .in('id', userIds);

      const nameMap = new Map((profiles || []).map((u: any) => [u.id, u.username]));

      return parts.map((p: any) => ({
        id: p.id,
        challengeId,
        userId: p.user_id,
        progress: p.current_progress ?? 0,
        username: nameMap.get(p.user_id) || 'User',
        status: (p.status || 'active') as ChallengeParticipant['status'],
        joinedAt: p.created_at,
      }));
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch participants');
    }
  }
);

export const fetchChallengeComments = createAsyncThunk(
  'challenges/fetchChallengeComments',
  async (_challengeId: number) => [] as ChallengeComment[]
);

export const joinChallenge = createAsyncThunk(
  'challenges/joinChallenge',
  async (challengeId: number, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: ch } = await supabase.from('challenges').select('*').eq('id', challengeId).single();
      if (ch?.is_private === true && String(ch.creator_id) !== user.id) {
        throw new Error('Private challenge — invitation required');
      }

      const { error } = await supabase.from('challenge_participants').insert({
        challenge_id: challengeId,
        user_id: user.id,
        current_progress: 0,
        status: 'active',
      });

      if (error) {
        if (error.code === '23505') return { challengeId, alreadyMember: true };
        throw error;
      }
      return { challengeId, alreadyMember: false };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to join');
    }
  }
);

export const updateChallengeProgress = createAsyncThunk(
  'challenges/updateChallengeProgress',
  async ({ challengeId, progress }: { challengeId: number; progress: number }, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: ch } = await supabase.from('challenges').select('target_value').eq('id', challengeId).single();
      const goal = ch?.target_value ?? 0;

      const status = progress >= goal && goal > 0 ? 'completed' : 'active';

      const { error } = await supabase
        .from('challenge_participants')
        .update({
          current_progress: progress,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { challengeId, progress, status, userId: user.id };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update progress');
    }
  }
);

export const createChallenge = createAsyncThunk(
  'challenges/createChallenge',
  async (input: CreateChallengeInput, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let dbGoalType = goalTypeToDb(input.goalType);
      const insertRow: Record<string, unknown> = {
        creator_id: user.id,
        title: input.title.trim(),
        description: (input.description || '').trim(),
        target_type: dbGoalType,
        target_value: input.goal,
        start_date: new Date(input.startDate).toISOString(),
        end_date: new Date(input.endDate).toISOString(),
        status: 'active',
        is_private: input.isPrivate,
      };

      if (input.goalType === 'books' && input.bookId) {
        insertRow.book_id = input.bookId;
      } else {
        insertRow.book_id = null;
      }

      const { data: row, error } = await supabase.from('challenges').insert(insertRow).select().single();

      if (error) {
        const msg = error.message || '';
        if (msg.includes('minutes') || error.code === '22P02') {
          insertRow.target_type = 'pages';
          const { data: row2, error: e2 } = await supabase.from('challenges').insert(insertRow).select().single();
          if (e2) throw e2;
          await supabase.from('challenge_participants').insert({
            challenge_id: row2!.id,
            user_id: user.id,
            current_progress: 0,
            status: 'active',
          });
          return mapRowToChallenge(row2, { participantCount: 1, myProgress: 0 });
        }
        throw error;
      }

      await supabase.from('challenge_participants').insert({
        challenge_id: row!.id,
        user_id: user.id,
        current_progress: 0,
        status: 'active',
      });

      return mapRowToChallenge(row, { participantCount: 1, myProgress: 0 });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create challenge');
    }
  }
);

export const addChallengeComment = createAsyncThunk(
  'challenges/addChallengeComment',
  async () => null as null
);

const challengesSlice = createSlice({
  name: 'challenges',
  initialState,
  reducers: {
    clearCurrentChallenge: (state) => {
      state.currentChallenge = null;
      state.participants = [];
      state.comments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadChallenges.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(loadChallenges.fulfilled, (state, action) => {
        state.listLoading = false;
        state.challenges = action.payload.all;
        state.myChallenges = action.payload.myChallenges;
        state.discoverChallenges = action.payload.discoverChallenges;
      })
      .addCase(loadChallenges.rejected, (state, action) => {
        state.listLoading = false;
        state.error = (action.payload as string) || 'Failed to load';
        state.myChallenges = [];
        state.discoverChallenges = [];
      })

      .addCase(fetchChallengeById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchChallengeById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentChallenge = action.payload;
      })
      .addCase(fetchChallengeById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = (action.payload as string) || 'Failed';
      })

      .addCase(fetchChallengeParticipants.fulfilled, (state, action) => {
        state.participants = action.payload;
      })

      .addCase(fetchChallengeComments.fulfilled, (state, action) => {
        state.comments = action.payload;
      })

      .addCase(joinChallenge.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(joinChallenge.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(joinChallenge.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Join failed';
      })

      .addCase(updateChallengeProgress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateChallengeProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        const { challengeId, progress, status, userId } = action.payload;
        if (state.currentChallenge?.id === challengeId) {
          state.currentChallenge = { ...state.currentChallenge, myProgress: progress };
        }
        state.participants = state.participants.map((p) =>
          p.userId === userId ? { ...p, progress, status: status as ChallengeParticipant['status'] } : p
        );
      })
      .addCase(updateChallengeProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Update failed';
      })

      .addCase(createChallenge.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createChallenge.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myChallenges = [action.payload, ...state.myChallenges.filter((c) => c.id !== action.payload.id)];
      })
      .addCase(createChallenge.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Create failed';
      });
  },
});

export const { clearCurrentChallenge } = challengesSlice.actions;

export const selectAllChallenges = (state: RootState) => state.challenges.challenges;
export const selectUserChallenges = (state: RootState) => state.challenges.myChallenges;
export const selectDiscoverChallenges = (state: RootState) => state.challenges.discoverChallenges;
export const selectCurrentChallenge = (state: RootState) => state.challenges.currentChallenge;
export const selectChallengeParticipants = (state: RootState) => state.challenges.participants;
export const selectChallengeComments = (state: RootState) => state.challenges.comments;
export const selectChallengesLoading = (state: RootState) => state.challenges.isLoading;
export const selectChallengesListLoading = (state: RootState) => state.challenges.listLoading;
export const selectChallengesDetailLoading = (state: RootState) => state.challenges.detailLoading;
export const selectChallengesError = (state: RootState) => state.challenges.error;

export default challengesSlice.reducer;
