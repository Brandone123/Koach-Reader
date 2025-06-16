import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { supabase } from '../lib/supabase';

// Définition de l'interface pour un livre gratuit
export interface FreeQuarterlyBook {
  id: number;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  total_pages: number;
  is_free: boolean;
  category: string;
  updated_at: string;
  expiration_date: string;
  days_remaining: number;
}

interface FreeQuarterlyBooksState {
  books: FreeQuarterlyBook[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// État initial
const initialState: FreeQuarterlyBooksState = {
  books: [],
  loading: false,
  error: null,
  lastUpdated: null
};

// Fonction pour calculer la date d'expiration (3 mois après updated_at)
const calculateExpirationDate = (updatedAt: string): string => {
  const date = new Date(updatedAt);
  date.setMonth(date.getMonth() + 3);
  return date.toISOString();
};

// Fonction pour calculer les jours restants
const calculateDaysRemaining = (expirationDate: string): number => {
  const now = new Date();
  const expiration = new Date(expirationDate);
  const diffTime = expiration.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Thunk pour récupérer les livres gratuits
export const fetchFreeQuarterlyBooks = createAsyncThunk(
  'freeQuarterlyBooks/fetchBooks',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { freeQuarterlyBooks } = getState() as RootState;
      
      // Vérifier si on doit mettre à jour les livres gratuits
      if (freeQuarterlyBooks.books.length > 0) {
        return freeQuarterlyBooks.books;
      }
      
      // Récupérer les livres gratuits de Supabase
      const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .eq('is_free', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Ajouter les dates d'expiration et les jours restants
      const booksWithExpiration = books.map(book => ({
        ...book,
        expiration_date: calculateExpirationDate(book.updated_at),
        days_remaining: calculateDaysRemaining(calculateExpirationDate(book.updated_at))
      }));

      return booksWithExpiration as FreeQuarterlyBook[];
    } catch (error) {
      return rejectWithValue("Erreur lors du chargement des livres gratuits");
    }
  }
);

// Création du slice
const freeQuarterlyBooksSlice = createSlice({
  name: 'freeQuarterlyBooks',
  initialState,
  reducers: {
    updateDaysRemaining: (state) => {
      state.books = state.books.map(book => ({
        ...book,
        days_remaining: calculateDaysRemaining(book.expiration_date)
      }));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFreeQuarterlyBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFreeQuarterlyBooks.fulfilled, (state, action: PayloadAction<FreeQuarterlyBook[]>) => {
        state.loading = false;
        state.books = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchFreeQuarterlyBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// Sélecteurs
export const selectFreeQuarterlyBooks = (state: RootState) => state.freeQuarterlyBooks.books;
export const selectFreeQuarterlyBooksLoading = (state: RootState) => state.freeQuarterlyBooks.loading;
export const selectFreeQuarterlyBooksError = (state: RootState) => state.freeQuarterlyBooks.error;

export const { updateDaysRemaining } = freeQuarterlyBooksSlice.actions;
export default freeQuarterlyBooksSlice.reducer; 