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
  member_count?: number;
  created_at: string;
  updated_at: string;
}

interface ReadingGroupsState {
  groups: ReadingGroup[];
  loading: boolean;
  error: string | null;
}

const initialState: ReadingGroupsState = {
  groups: [],
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
      });
  },
});

export const selectReadingGroups = (state: RootState) => state.readingGroups.groups;
export const selectReadingGroupsLoading = (state: RootState) => state.readingGroups.loading;
export const selectReadingGroupsError = (state: RootState) => state.readingGroups.error;

export default readingGroupsSlice.reducer;