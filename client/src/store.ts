import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import booksReducer from './slices/booksSlice';
import readingPlansReducer from './slices/readingPlansSlice';
import koachReducer from './slices/koachSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    books: booksReducer,
    readingPlans: readingPlansReducer,
    koach: koachReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;