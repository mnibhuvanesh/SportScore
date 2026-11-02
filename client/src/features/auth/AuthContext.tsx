import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '../../types';
import { apiRequest } from '../../lib/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
  isAdmin: boolean;
  isOrganizer: boolean;
  isCoach: boolean;
  isAthlete: boolean;
  isScorer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sportscore_session_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('sportscore_session_user', JSON.stringify(data.user));
      }
    } catch {
      // keep existing user if in localStorage
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('sportscore_session_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        setUser,
        logout,
        refetchUser: fetchCurrentUser,
        isAdmin: role === 'ADMIN',
        isOrganizer: role === 'ORGANIZER',
        isCoach: role === 'COACH',
        isAthlete: role === 'ATHLETE',
        isScorer: role === 'SCORER',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
