import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Types
export interface Notification {
  id: number;
  userId: number;
  type: 'achievement' | 'challenge' | 'friend' | 'reading' | 'system';
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

// Async actions
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      // Mock data - will connect to server later
      return [
        {
          id: 1,
          userId: 1,
          type: 'achievement',
          title: 'Badge Earned!',
          message: 'You earned the Bookworm badge for reading 7 days in a row!',
          read: false,
          data: {
            badgeId: 1,
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          userId: 1,
          type: 'challenge',
          title: 'Challenge Update',
          message: 'You\'re halfway through the Summer Reading Challenge!',
          read: true,
          data: {
            challengeId: 1,
            progress: 50,
          },
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
        {
          id: 3,
          userId: 1,
          type: 'friend',
          title: 'Friend Request',
          message: 'User2 sent you a friend request',
          read: false,
          data: {
            friendId: 2,
            friendUsername: 'User2',
          },
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        },
      ];
    } catch (error) {
      return rejectWithValue('Failed to fetch notifications.');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      // Mock API call - will connect to server later
      return notificationId;
    } catch (error) {
      return rejectWithValue('Failed to mark notification as read.');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      // Mock API call - will connect to server later
      return true;
    } catch (error) {
      return rejectWithValue('Failed to mark all notifications as read.');
    }
  }
);

// Slice
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
    // Fetch Notifications
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

    // Mark Notification As Read
    builder.addCase(markNotificationAsRead.fulfilled, (state, action) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount -= 1;
      }
    });

    // Mark All Notifications As Read
    builder.addCase(markAllNotificationsAsRead.fulfilled, (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true;
      });
      state.unreadCount = 0;
    });
  },
});

// Actions
export const { addNotification, clearAllNotifications } = notificationsSlice.actions;

// Selectors
export const selectAllNotifications = (state: RootState) => state.notifications.notifications;
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;
export const selectIsLoading = (state: RootState) => state.notifications.isLoading;
export const selectError = (state: RootState) => state.notifications.error;

export default notificationsSlice.reducer;