'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authStorage } from '@/lib/auth';
import { authService } from '@/services/auth';
import { LoginCredentials, RegisterCredentials, RegisterResponse, User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterCredentials) => Promise<RegisterResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    if (!authStorage.getToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const meRes = await authService.getMe();
      const existingUser = authStorage.getUser();

      const updatedUser: User = {
        id: meRes.user.userId,
        email: existingUser?.email || '',
        name: existingUser?.name,
        role: meRes.user.role,
      };

      setUser(updatedUser);
      authStorage.setUser(updatedUser);
    } catch {
      authStorage.clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshUser();
    });
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      const authenticatedUser: User = {
        id: res.user.id,
        email: res.user.email,
        role: res.user.role,
      };
      authStorage.setToken(res.token);
      authStorage.setUser(authenticatedUser);
      setUser(authenticatedUser);
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterCredentials): Promise<RegisterResponse> => {
    return authService.register(data);
  };

  const logout = () => {
    authStorage.clearAuth();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
