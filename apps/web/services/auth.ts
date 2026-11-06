/**
 * TerraGuard AI — Authentication Service Client
 * Handles communication with FastAPI Auth endpoints under /api/v1/auth
 * Provides robust multi-tier session persistence across localStorage, sessionStorage, and memory.
 */

import { API_BASE_URL } from "./config";

export type UserRole = "CITIZEN" | "ANALYST" | "COORDINATOR" | "ADMIN";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in_seconds: number;
  user: UserProfile;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Persistent Storage Keys
const STORAGE_KEY_TOKEN = "tg_access_token";
const STORAGE_KEY_REFRESH = "tg_refresh_token";
const STORAGE_KEY_USER = "tg_user";

// In-memory cache for fast synchronous access
let memoryAccessToken: string | null = null;

/**
 * Returns the currently active access token.
 * Synchronously checks memory, then localStorage, then sessionStorage.
 */
export function getAccessToken(): string | null {
  if (memoryAccessToken) {
    return memoryAccessToken;
  }
  if (typeof window !== "undefined") {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEY_TOKEN) ||
        sessionStorage.getItem(STORAGE_KEY_TOKEN) ||
        sessionStorage.getItem("tg_token");
      if (stored) {
        memoryAccessToken = stored;
        return stored;
      }
    } catch {
      // Storage access blocked or restricted
    }
  }
  return null;
}

/**
 * Updates the in-memory access token.
 */
export function setAccessToken(token: string | null): void {
  memoryAccessToken = token;
}

/**
 * Reads the cached UserProfile synchronously from persistent storage.
 */
export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY_USER) ||
      sessionStorage.getItem(STORAGE_KEY_USER) ||
      sessionStorage.getItem("tg_user");
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Reads the cached refresh token from persistent storage.
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      localStorage.getItem(STORAGE_KEY_REFRESH) ||
      sessionStorage.getItem(STORAGE_KEY_REFRESH) ||
      sessionStorage.getItem("tg_refresh") ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Persists session credentials across localStorage, sessionStorage, and memory.
 * Emits a cross-tab synchronization event.
 */
export function saveAuthSession(data: AuthTokens): void {
  setAccessToken(data.access_token);
  if (typeof window !== "undefined") {
    try {
      // 1. Primary multi-tab persistence
      localStorage.setItem(STORAGE_KEY_TOKEN, data.access_token);
      localStorage.setItem(STORAGE_KEY_REFRESH, data.refresh_token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));

      // 2. Secondary session storage persistence
      sessionStorage.setItem(STORAGE_KEY_TOKEN, data.access_token);
      sessionStorage.setItem(STORAGE_KEY_REFRESH, data.refresh_token);
      sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
      sessionStorage.setItem("tg_refresh", data.refresh_token);
      sessionStorage.setItem("tg_user", JSON.stringify(data.user));

      // 3. Dispatch local event for real-time React component sync
      window.dispatchEvent(new Event("tg_auth_state_changed"));
    } catch (e) {
      console.warn("[TerraGuard Auth] Could not persist to localStorage:", e);
    }
  }
}

/**
 * Purges session credentials completely upon explicit user logout.
 */
export function clearAuthSession(): void {
  setAccessToken(null);
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_REFRESH);
      localStorage.removeItem(STORAGE_KEY_USER);

      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
      sessionStorage.removeItem(STORAGE_KEY_REFRESH);
      sessionStorage.removeItem(STORAGE_KEY_USER);
      sessionStorage.removeItem("tg_token");
      sessionStorage.removeItem("tg_refresh");
      sessionStorage.removeItem("tg_user");

      window.dispatchEvent(new Event("tg_auth_state_changed"));
    } catch (e) {
      console.warn("[TerraGuard Auth] Could not clear storage:", e);
    }
  }
}

export async function register(payload: RegisterPayload): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Registration failed");
  }
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Authentication failed");
  }

  saveAuthSession(data);
  return data;
}

/**
 * Performs a silent token refresh.
 * Never logs out the user on transient network errors or server cold starts.
 * Only purges credentials if the backend explicitly reports the token is revoked.
 */
export async function refresh(): Promise<AuthTokens | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      // Only clear credentials if explicitly revoked or unauthorized
      if (res.status === 401 || res.status === 403) {
        try {
          const errData = await res.json();
          if (errData.error_code === "TOKEN_REVOKED" || errData.error_code === "INVALID_TOKEN") {
            clearAuthSession();
            return null;
          }
        } catch {
          // If error parsing failed, do not immediately wipe
        }
      }
      // On 500, 502, 503, 504 (e.g. Render waking up) preserve user session
      return null;
    }

    const data: AuthTokens = await res.json();
    saveAuthSession(data);
    return data;
  } catch (err) {
    // Transient network failure or offline mode: do NOT clear session
    console.warn("[TerraGuard Auth] Network failure during refresh, maintaining cached session", err);
    return null;
  }
}

export async function logout(): Promise<void> {
  const token = getAccessToken();
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors during logout teardown
    }
  }

  clearAuthSession();
}

export async function fetchMe(): Promise<UserProfile | null> {
  const token = getAccessToken();
  if (!token) {
    return getStoredUser();
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Attempt refresh
        const refreshed = await refresh();
        if (refreshed) {
          return refreshed.user;
        }
      }
      // Fallback to cached user profile on network or non-fatal status
      return getStoredUser();
    }

    const userProfile: UserProfile = await res.json();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userProfile));
        sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userProfile));
      } catch {
        // Ignore storage write issues
      }
    }
    return userProfile;
  } catch {
    // If network fails (e.g. offline, Render sleeping), return cached profile
    return getStoredUser();
  }
}

export async function requestPasswordReset(email: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Password reset request failed");
  }
  return data.reset_token || "";
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to reset password");
  }
}
