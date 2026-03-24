import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { RootState } from '../store';
import { ApiNotification, toUiNotification } from '../utils/notificationMappers';
import { supabase } from '../lib/supabase';

let notificationsRealtimeChannel: RealtimeChannel | null = null;

export interface Notification {
  id: number;
  userId: string;
  type: 'achievement' | 'challenge' | 'friend' | 'reading' | 'system' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  data?: {
    [key: string]: any;
  };
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data || []) as ApiNotification[]).map(toUiNotification);
    } catch (error) {
      console.error('[notifications/fetch]', error);
      return rejectWithValue('Failed to fetch notifications.');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
      return notificationId;
    } catch (error) {
      return rejectWithValue('Failed to mark notification as read.');
    }
  }
);

export const subscribeNotificationsRealtime = createAsyncThunk(
  'notifications/subscribeRealtime',
  async (userId: string, { dispatch }) => {
    if (notificationsRealtimeChannel) {
      await supabase.removeChannel(notificationsRealtimeChannel);
      notificationsRealtimeChannel = null;
    }
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          dispatch(fetchNotifications());
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn('[notifications realtime]', status, err.message || err);
        }
        if (status === 'SUBSCRIBED') {
          dispatch(fetchNotifications());
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(
            '[notifications realtime] Vérifiez que la table public.notifications est dans la publication supabase_realtime (voir supabase-notifications-realtime.sql).'
          );
        }
      });
    notificationsRealtimeChannel = channel;
    await dispatch(fetchNotifications());
  }
);

export const unsubscribeNotificationsRealtime = createAsyncThunk(
  'notifications/unsubscribeRealtime',
  async () => {
    if (notificationsRealtimeChannel) {
      await supabase.removeChannel(notificationsRealtimeChannel);
      notificationsRealtimeChannel = null;
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;
      if (!userId) return true;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
      return true;
    } catch (error) {
      return rejectWithValue('Failed to mark all notifications as read.');
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.isLoading = false;
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n: Notification) => !n.read).length;
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(markNotificationAsRead.fulfilled, (state, action) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount -= 1;
      }
    });

    builder.addCase(markAllNotificationsAsRead.fulfilled, (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true;
      });
      state.unreadCount = 0;
    });
  },
});

export const { addNotification, clearAllNotifications } = notificationsSlice.actions;
export const selectAllNotifications = (state: RootState) => state.notifications.notifications;
export const selectNotifications = (state: RootState) => state.notifications.notifications;
export const selectNotificationsLoading = (state: RootState) => state.notifications.isLoading;
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;
export const selectIsLoading = (state: RootState) => state.notifications.isLoading;
export const selectError = (state: RootState) => state.notifications.error;

export default notificationsSlice.reducer;
