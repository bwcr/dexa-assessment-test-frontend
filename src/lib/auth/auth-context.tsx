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

      const { token, refreshToken, user: userData } = response.data;

      // Store tokens and user data
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
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
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state regardless of API response
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
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
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: acceptable for now
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            // Verify token is still valid by fetching fresh user data
            const response = await apiClient.getMe();
            if (response.data && !response.error) {
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            } else if (response.status === 401) {
              // Token expired, try to refresh
              const refreshResponse = await apiClient.refreshToken();
              if (refreshResponse.data && !refreshResponse.error) {
                localStorage.setItem('token', refreshResponse.data.token);
                localStorage.setItem(
                  'refreshToken',
                  refreshResponse.data.refreshToken,
                );
                localStorage.setItem(
                  'tokenExpires',
                  refreshResponse.data.tokenExpires.toString(),
                );
                // Try getting user data again
                const userResponse = await apiClient.getMe();
                if (userResponse.data && !userResponse.error) {
                  setUser(userResponse.data);
                  localStorage.setItem(
                    'user',
                    JSON.stringify(userResponse.data),
                  );
                } else {
                  // Refresh failed, clear auth
                  setUser(null);
                  localStorage.clear();
                }
              } else {
                // Refresh failed, clear auth
                setUser(null);
                localStorage.clear();
              }
            }
          } catch (error) {
            console.error('Auth initialization error:', error);
            setUser(null);
            localStorage.clear();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
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
