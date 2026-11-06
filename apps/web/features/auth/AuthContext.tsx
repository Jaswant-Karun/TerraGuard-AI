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
  getAccessToken,
  getStoredUser,
} from "@/services/auth";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Synchronously initialize from persistent storage (localStorage / sessionStorage)
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === "undefined") return null;
    return getStoredUser();
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return getAccessToken();
  });
  // If a valid stored user already exists, start with isLoading = false to prevent UI flash
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return !getStoredUser();
  });

  const syncStateFromStorage = useCallback(() => {
    const storedUser = getStoredUser();
    const storedToken = getAccessToken();
    setUser(storedUser);
    setToken(storedToken);
    setIsLoading(false);
  }, []);

  const checkAuth = useCallback(async () => {
    const cachedUser = getStoredUser();
    const cachedToken = getAccessToken();

    // Ensure immediate hydration from storage
    if (cachedUser) {
      setUser(cachedUser);
      setToken(cachedToken);
      setIsLoading(false);
    }

    try {
      // Background verification / token refresh
      const tokens = await apiRefresh();
      if (tokens) {
        setUser(tokens.user);
        setToken(tokens.access_token);
      } else {
        const currentUser = await fetchMe();
        if (currentUser) {
          setUser(currentUser);
          setToken(getAccessToken());
        } else if (!cachedUser) {
          setUser(null);
          setToken(null);
        }
      }
    } catch {
      // In case of network errors, do NOT log out the user if cached credentials exist
      if (!cachedUser) {
        setUser(null);
        setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen to storage events to sync across tabs and windows
    const handleStorageChange = () => {
      syncStateFromStorage();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("tg_auth_state_changed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tg_auth_state_changed", handleStorageChange);
    };
  }, [checkAuth, syncStateFromStorage]);

  const login = async (data: LoginPayload) => {
    setIsLoading(true);
    try {
      const authResult = await apiLogin(data);
      setUser(authResult.user);
      setToken(authResult.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterPayload) => {
    setIsLoading(true);
    try {
      await apiRegister(data);
      // Automatically sign in upon registration to establish session
      const authResult = await apiLogin({
        email: data.email,
        password: data.password,
      });
      setUser(authResult.user);
      setToken(authResult.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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
