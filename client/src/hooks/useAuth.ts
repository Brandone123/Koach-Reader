import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  login as loginAction, 
  register as registerAction, 
  logout as logoutAction,
  fetchCurrentUser,
  setOnboardingCompleted,
  selectUser,
  selectIsLoading,
  selectError
} from '../slices/authSlice';
import { AppDispatch } from '../store';

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  isPremium: boolean;
  koachPoints: number;
  readingStreak: number;
  preferences?: {
    readingFrequency?: 'daily' | 'weekly' | 'monthly';
    ageRange?: 'child' | 'teen' | 'adult';
    preferredCategories?: string[];
    spiritualGoals?: string[];
    preferredReadingFormat?: 'text' | 'audio';
    preferredReadingTime?: string;
    language?: string;
    theme?: 'light' | 'dark' | 'system';
  };
  createdAt: string;
  hasCompletedOnboarding?: boolean;
}

export interface AuthContextType {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  setOnboardingCompleted: () => void;
  updateOnboardingStatus: (status: boolean) => void;
  forceCompleteOnboarding: () => void;
  needsOnboarding: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  user: null,
  isLoading: false,
  error: null,
  setOnboardingCompleted: () => {},
  updateOnboardingStatus: (status: boolean) => {},
  forceCompleteOnboarding: () => {},
  needsOnboarding: false
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    // Load user data on mount
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    // Check if user needs onboarding
    if (user && user.hasCompletedOnboarding === false) {
      setNeedsOnboarding(true);
    } else {
      setNeedsOnboarding(false);
    }
  }, [user]);

  const login = async (credentials: LoginCredentials) => {
    await dispatch(loginAction(credentials)).unwrap();
  };

  const register = async (data: RegisterData) => {
    await dispatch(registerAction(data)).unwrap();
    // Newly registered users need onboarding
    setNeedsOnboarding(true);
  };

  const logout = async () => {
    await dispatch(logoutAction()).unwrap();
  };

  const setOnboardingCompleted = () => {
    if (user) {
      const updatedUser = { ...user, hasCompletedOnboarding: true };
      // In a real app, this would update the user data on the server
      // For now, we'll just update the local state
      setNeedsOnboarding(false);
      // Here you would typically dispatch an action to update the user in the Redux store
      // dispatch(updateUserAction({ ...user, hasCompletedOnboarding: true }));
    }
  };

  const updateOnboardingStatus = (status: boolean) => {
    if (user) {
      // Dispatch the action to update the onboarding status
      dispatch(setOnboardingCompleted(status));
      
      // Update the local state immediately
      setNeedsOnboarding(!status);
    }
  };

  const forceCompleteOnboarding = () => {
    if (user) {
      // Create a copy of the user with onboarding completed
      const updatedUser = { ...user, hasCompletedOnboarding: true };
      
      // Force update the local state
      setNeedsOnboarding(false);
      
      // In a real app, this would also update the backend
      console.log('Force completed onboarding for user:', updatedUser);
    }
  };

  const contextValue: AuthContextType = {
    login,
    register,
    logout,
    user,
    isLoading,
    error,
    setOnboardingCompleted,
    updateOnboardingStatus,
    forceCompleteOnboarding,
    needsOnboarding
  };

  // Return the context provider with children
  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}