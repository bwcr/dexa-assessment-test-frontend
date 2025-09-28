'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { apiClient, type User } from '@/lib/api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, password);

      if (response.error || !response.data) {
        return { success: false, error: response.error || 'Login failed' };
      }

      const {
        token,
        refreshToken,
        tokenExpires,
        user: userData,
      } = response.data;

      // Store tokens and user data (tokens are now handled by API client)
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('tokenExpires', tokenExpires.toString());
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiClient.logout();
    } finally {
      // Clear state (API client handles token cleanup)
      setUser(null);
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getProfile();
      if (response.data && !response.error) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const validateStoredAuth = async (storedUser: string) => {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Verify token is still valid by fetching fresh user data
        // The API client will automatically handle token refresh if needed
        const response = await apiClient.getMe();
        if (response.data && !response.error) {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } else if (response.status === 401) {
          // Authentication failed, clear auth state
          setUser(null);
          localStorage.clear();
        }
      } catch {
        // Parse or API error, clear auth state
        setUser(null);
        localStorage.clear();
      }
    };

    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          await validateStoredAuth(storedUser);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
