import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Définition de l'interface pour un livre gratuit trimestriel
export interface FreeQuarterlyBook {
  id: number;
  title: string;
  author: string;
  description: string;
  coverImageUrl: any; // Change type to any to allow require()
  pageCount: number;
  availableUntil: string; // Date ISO string
  category: string;
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

// Fonction pour vérifier si les livres gratuits doivent être mis à jour (tous les 3 mois)
const shouldUpdateFreeBooks = (lastUpdated: string | null): boolean => {
  if (!lastUpdated) return true;
  
  const now = new Date();
  const lastUpdate = new Date(lastUpdated);
  
  // Calculer la différence en mois
  const diffMonths = (now.getFullYear() - lastUpdate.getFullYear()) * 12 
    + now.getMonth() - lastUpdate.getMonth();
  
  // Si ça fait 3 mois ou plus, mettre à jour
  return diffMonths >= 3;
};

// Fonction pour créer des dates d'expiration réalistes
const getExpirationDates = () => {
  const now = new Date();
  
  // Date d'expiration dans 30 jours pour le premier livre
  const expiryDate1 = new Date(now);
  expiryDate1.setDate(now.getDate() + 30);
  
  // Date d'expiration dans 60 jours pour le deuxième livre
  const expiryDate2 = new Date(now);
  expiryDate2.setDate(now.getDate() + 60);
  
  // Date d'expiration dans 90 jours pour le troisième livre
  const expiryDate3 = new Date(now);
  expiryDate3.setDate(now.getDate() + 90);
  
  return [expiryDate1, expiryDate2, expiryDate3];
};

// Thunk pour récupérer les livres gratuits trimestriels
export const fetchFreeQuarterlyBooks = createAsyncThunk(
  'freeQuarterlyBooks/fetchBooks',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { freeQuarterlyBooks } = getState() as RootState;
      
      // Vérifier si on doit mettre à jour les livres gratuits
      if (!shouldUpdateFreeBooks(freeQuarterlyBooks.lastUpdated) && freeQuarterlyBooks.books.length > 0) {
        return freeQuarterlyBooks.books;
      }
      
      // Dans un environnement réel, nous ferions un appel API ici
      // Pour cet exemple, nous allons simuler des données
      
      // Obtenir le trimestre actuel (0-3)
      const currentQuarter = Math.floor(new Date().getMonth() / 3);
      
      // Obtenir des dates d'expiration réalistes
      const [expiryDate1, expiryDate2, expiryDate3] = getExpirationDates();
      
      // Pour l'exemple, générer 3 livres différents par trimestre
      // Utiliser des IDs entre 1 et 100 pour assurer la compatibilité avec l'écran de détail du livre
      const freeBooks: FreeQuarterlyBook[] = [
        {
          id: 1, // ID compatible avec les livres existants dans l'app
          title: "Ne tirez pas sur l'oiseau moqueur",
          author: "Harper Lee",
          description: "Un roman d'une forte importance nationale contemporaine",
          coverImageUrl: require('../../assets/book.jpg'),
          pageCount: 336,
          availableUntil: expiryDate1.toISOString(),
          category: "fiction"
        },
        {
          id: 2, // ID compatible avec les livres existants dans l'app
          title: "La Bible annotée",
          author: "Collectif",
          description: "Une édition annotée et commentée de la Bible",
          coverImageUrl: require('../../assets/book.jpg'),
          pageCount: 1456,
          availableUntil: expiryDate2.toISOString(),
          category: "bible_studies"
        },
        {
          id: 3, // ID compatible avec les livres existants dans l'app
          title: "Vivre en Christ",
          author: "Max Lucado",
          description: "Un guide spirituel pour vivre pleinement sa foi au quotidien",
          coverImageUrl: require('../../assets/book.jpg'),
          pageCount: 245,
          availableUntil: expiryDate3.toISOString(),
          category: "spirituality"
        }
      ];
      
      return freeBooks;
    } catch (error) {
      return rejectWithValue("Erreur lors du chargement des livres gratuits trimestriels");
    }
  }
);

// Création du slice
const freeQuarterlyBooksSlice = createSlice({
  name: 'freeQuarterlyBooks',
  initialState,
  reducers: {
    // Définir des reducers supplémentaires si nécessaire
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

export default freeQuarterlyBooksSlice.reducer; 