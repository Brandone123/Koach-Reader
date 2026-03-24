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
  member_count?: number | { count: number }[];
  rules?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface CommunitiesState {
  communities: Community[];
  currentCommunity: Community | null;
  members: any[];
  posts: any[];
  loading: boolean;
  error: string | null;
}

const initialState: CommunitiesState = {
  communities: [],
  currentCommunity: null,
  members: [],
  posts: [],
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

export const createCommunity = createAsyncThunk(
  'communities/createCommunity',
  async (payload: Partial<Community>, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('communities')
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

export const fetchCommunityById = createAsyncThunk(
  'communities/fetchCommunityById',
  async (communityId: number, { rejectWithValue }) => {
    try {
      const [{ data: community, error: communityError }, { data: members }, { data: posts }] = await Promise.all([
        supabase.from('communities').select('*').eq('id', communityId).single(),
        supabase.from('community_members').select('*').eq('community_id', communityId),
        supabase.from('community_posts').select('*').eq('community_id', communityId).order('created_at', { ascending: false }),
      ]);

      if (communityError) throw communityError;
      return { community, members: members || [], posts: posts || [] };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const joinCommunity = createAsyncThunk(
  'communities/joinCommunity',
  async (communityId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase.from('community_members').insert({ community_id: communityId, user_id: userId });
      if (error && !String(error.message).toLowerCase().includes('duplicate')) throw error;
      return communityId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const leaveCommunity = createAsyncThunk(
  'communities/leaveCommunity',
  async (communityId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);
      if (error) throw error;
      return communityId;
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
      })
      .addCase(createCommunity.fulfilled, (state, action) => {
        if (action.payload) state.communities.unshift(action.payload as Community);
      })
      .addCase(fetchCommunityById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommunityById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCommunity = action.payload.community as Community;
        state.members = action.payload.members;
        state.posts = action.payload.posts;
      })
      .addCase(fetchCommunityById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const selectCommunities = (state: RootState) => state.communities.communities;
export const selectCommunitiesLoading = (state: RootState) => state.communities.loading;
export const selectCommunitiesError = (state: RootState) => state.communities.error;
export const selectCurrentCommunity = (state: RootState) => state.communities.currentCommunity;
export const selectCommunityLoading = (state: RootState) => state.communities.loading;
export const selectCommunityMembers = (state: RootState) => state.communities.members;
export const selectCommunityPosts = (state: RootState) => state.communities.posts;

export default communitiesSlice.reducer;