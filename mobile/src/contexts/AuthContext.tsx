import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';
import { User, LoginRequest, RegisterRequest } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token on mount
  useEffect(() => {
    loadToken();
  }, []);

  // Clear authentication state when token is invalid
  const clearAuthState = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    apiService.setToken(null);
    setToken(null);
    setUser(null);
  };

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        apiService.setToken(storedToken);
        try {
          const currentUser = await apiService.getCurrentUser();
          setToken(storedToken);
          setUser(currentUser);
        } catch (_error) {
          await clearAuthState();
        }
      }
    } catch (error) {
      console.error('Error loading token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    const response = await apiService.login(data);
    await AsyncStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    apiService.setToken(response.token);
    setUser(response.user);
  };

  const register = async (data: RegisterRequest) => {
    const response = await apiService.register(data);
    await AsyncStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    apiService.setToken(response.token);
    setUser(response.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    apiService.setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // Token is invalid/expired; clear it and re-throw so callers (e.g. profile refresh)
        // can surface the failure while forcing a logout state.
        await clearAuthState();
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
