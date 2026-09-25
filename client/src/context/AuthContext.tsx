import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  goal: string;
  availableTime: string;
  energyLevel: 'Low' | 'Medium' | 'High';
  preferredStyle: 'Practical' | 'Visual' | 'Theoretical' | 'Mixed';
  focusDuration: number;
  preferredDifficulty: 'Easy' | 'Medium' | 'Hard';
  preferences?: string[];
  strengths?: string[];
  weaknesses?: string[];
  isOnboarded: boolean;
  isDemoUser?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nova_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nova_jwt'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (!localStorage.getItem('nova_jwt')) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await api.auth.getMe();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('nova_user', JSON.stringify(data.user));
      }
    } catch {
      localStorage.removeItem('nova_jwt');
      localStorage.removeItem('nova_user');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    if (data.success) {
      localStorage.setItem('nova_jwt', data.token);
      localStorage.setItem('nova_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api.auth.register({ name, email, password });
    if (data.success) {
      localStorage.setItem('nova_jwt', data.token);
      localStorage.setItem('nova_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
  };

  const demoLogin = async () => {
    setIsLoading(true);
    try {
      const data = await api.auth.demoLogin();
      if (data.success) {
        localStorage.setItem('nova_jwt', data.token);
        localStorage.setItem('nova_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('nova_jwt');
    localStorage.removeItem('nova_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      localStorage.setItem('nova_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
