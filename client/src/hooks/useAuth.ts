import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  login as loginAction, 
  register as registerAction, 
  logout as logoutAction,
  fetchCurrentUser,
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
  preferences?: any;
  createdAt: string;
}

interface AuthContextType {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  user: null,
  isLoading: false,
  error: null
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  useEffect(() => {
    // Load user data on mount
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  const login = async (credentials: LoginCredentials) => {
    await dispatch(loginAction(credentials)).unwrap();
  };

  const register = async (data: RegisterData) => {
    await dispatch(registerAction(data)).unwrap();
  };

  const logout = async () => {
    await dispatch(logoutAction()).unwrap();
  };

  const contextValue: AuthContextType = {
    login,
    register,
    logout,
    user,
    isLoading,
    error,
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