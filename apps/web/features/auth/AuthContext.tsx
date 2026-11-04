"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  UserProfile,
  LoginPayload,
  RegisterPayload,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refresh as apiRefresh,
  fetchMe,
} from "@/services/auth";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      // First attempt session restore via refresh token
      const tokens = await apiRefresh();
      if (tokens) {
        setUser(tokens.user);
      } else {
        const currentUser = await fetchMe();
        setUser(currentUser);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (data: LoginPayload) => {
    setIsLoading(true);
    try {
      const authResult = await apiLogin(data);
      setUser(authResult.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterPayload) => {
    setIsLoading(true);
    try {
      await apiRegister(data);
      // Auto-login upon registration
      const authResult = await apiLogin({
        email: data.email,
        password: data.password,
      });
      setUser(authResult.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

