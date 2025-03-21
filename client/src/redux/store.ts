import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import booksReducer from './slices/booksSlice';
import readingPlansReducer from './slices/readingPlansSlice';
import koachReducer from './slices/koachSlice';
import challengesReducer from './slices/challengesSlice';
import notificationsReducer from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    books: booksReducer,
    readingPlans: readingPlansReducer,
    koach: koachReducer,
    challenges: challengesReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;