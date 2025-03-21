import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
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

interface AuthContextType {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  user: any | null;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

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

  return (
    <AuthContext.Provider
      value={{
        login,
        register,
        logout,
        user,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}