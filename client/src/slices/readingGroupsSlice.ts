import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { supabase } from '../lib/supabase';

export interface ReadingGroup {
  id: number;
  name: string;
  description: string;
  creator_id: string;
  is_private: boolean;
  cover_image_url?: string;
  current_book_id?: number;
  current_book?: string;
  member_count?: number | { count: number }[];
  rules?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface ReadingGroupsState {
  groups: ReadingGroup[];
  currentGroup: ReadingGroup | null;
  members: any[];
  discussions: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ReadingGroupsState = {
  groups: [],
  currentGroup: null,
  members: [],
  discussions: [],
  loading: false,
  error: null,
};

// Fetch reading groups
export const fetchReadingGroups = createAsyncThunk(
  'readingGroups/fetchReadingGroups',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('reading_groups')
        .select(`
          *,
          member_count:reading_group_members(count)
        `)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createReadingGroup = createAsyncThunk(
  'readingGroups/createReadingGroup',
  async (payload: Partial<ReadingGroup>, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('reading_groups')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchGroupById = createAsyncThunk(
  'readingGroups/fetchGroupById',
  async (groupId: number, { rejectWithValue }) => {
    try {
      const [{ data: group, error: groupError }, { data: members }, { data: discussions }] = await Promise.all([
        supabase.from('reading_groups').select('*').eq('id', groupId).single(),
        supabase.from('reading_group_members').select('*').eq('group_id', groupId),
        supabase.from('group_discussions').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
      ]);
      if (groupError) throw groupError;
      return { group, members: members || [], discussions: discussions || [] };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const joinGroup = createAsyncThunk(
  'readingGroups/joinGroup',
  async (groupId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase.from('reading_group_members').insert({ group_id: groupId, user_id: userId });
      if (error && !String(error.message).toLowerCase().includes('duplicate')) throw error;
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const leaveGroup = createAsyncThunk(
  'readingGroups/leaveGroup',
  async (groupId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('reading_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
      if (error) throw error;
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const readingGroupsSlice = createSlice({
  name: 'readingGroups',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReadingGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReadingGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchReadingGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createReadingGroup.fulfilled, (state, action) => {
        if (action.payload) state.groups.unshift(action.payload as ReadingGroup);
      })
      .addCase(fetchGroupById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGroup = action.payload.group as ReadingGroup;
        state.members = action.payload.members;
        state.discussions = action.payload.discussions;
      })
      .addCase(fetchGroupById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const selectReadingGroups = (state: RootState) => state.readingGroups.groups;
export const selectReadingGroupsLoading = (state: RootState) => state.readingGroups.loading;
export const selectReadingGroupsError = (state: RootState) => state.readingGroups.error;
export const selectCurrentGroup = (state: RootState) => state.readingGroups.currentGroup;
export const selectGroupLoading = (state: RootState) => state.readingGroups.loading;
export const selectGroupMembers = (state: RootState) => state.readingGroups.members;
export const selectGroupDiscussions = (state: RootState) => state.readingGroups.discussions;

export default readingGroupsSlice.reducer;