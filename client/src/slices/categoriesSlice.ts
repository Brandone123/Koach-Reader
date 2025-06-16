import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../lib/supabase';
import { RootState } from '../store';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  translations: CategoryTranslation[];
}

export interface CategoryTranslation {
  id: number;
  category_id: string;
  lang: string;
  label: string;
  description: string | null;
}

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [],
  isLoading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (lang: string = 'fr', { rejectWithValue }) => {
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select(`
          *,
          category_translation (
            id,
            lang,
            label,
            description
          )
        `);

      if (error) throw error;

      // Transform the data to include translations
      const transformedCategories = categories.map((category: any) => ({
        ...category,
        translations: category.category_translation,
        // Get the translation for the current language or fallback to the category name
        name: category.category_translation.find((t: any) => t.lang === lang)?.label || category.name
      }));

      return transformedCategories;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategories: (state) => {
      state.categories = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCategories } = categoriesSlice.actions;

// Corriger les sélecteurs pour utiliser RootState
export const selectCategories = (state: RootState) => state.categories.categories;
export const selectCategoriesLoading = (state: RootState) => state.categories.isLoading;
export const selectCategoriesError = (state: RootState) => state.categories.error;

export default categoriesSlice.reducer; 