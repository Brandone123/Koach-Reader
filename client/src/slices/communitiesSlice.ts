import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { supabase } from '../lib/supabase';

export interface Community {
  id: number;
  name: string;
  description: string;
  creator_id: string;
  is_private: boolean;
  cover_image_url?: string;
  category?: string;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

interface CommunitiesState {
  communities: Community[];
  loading: boolean;
  error: string | null;
}

const initialState: CommunitiesState = {
  communities: [],
  loading: false,
  error: null,
};

// Fetch communities
export const fetchCommunities = createAsyncThunk(
  'communities/fetchCommunities',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          member_count:community_members(count)
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

const communitiesSlice = createSlice({
  name: 'communities',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommunities.fulfilled, (state, action) => {
        state.loading = false;
        state.communities = action.payload;
      })
      .addCase(fetchCommunities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const selectCommunities = (state: RootState) => state.communities.communities;
export const selectCommunitiesLoading = (state: RootState) => state.communities.loading;
export const selectCommunitiesError = (state: RootState) => state.communities.error;

export default communitiesSlice.reducer;