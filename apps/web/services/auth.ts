/**
 * TerraGuard AI — Authentication Service Client
 * Handles communication with FastAPI Auth endpoints under /api/v1/auth
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

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

// In-memory token management to prevent insecure long-lived exposure in localStorage
let memoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  memoryAccessToken = token;
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

  setAccessToken(data.access_token);
  // Store short-lived session identifier for refresh in sessionStorage
  if (typeof window !== "undefined") {
    sessionStorage.setItem("tg_refresh", data.refresh_token);
    sessionStorage.setItem("tg_user", JSON.stringify(data.user));
  }

  return data;
}

export async function refresh(): Promise<AuthTokens | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = sessionStorage.getItem("tg_refresh");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      logout();
      return null;
    }

    const data: AuthTokens = await res.json();
    setAccessToken(data.access_token);
    sessionStorage.setItem("tg_user", JSON.stringify(data.user));
    return data;
  } catch {
    logout();
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

  setAccessToken(null);
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("tg_refresh");
    sessionStorage.removeItem("tg_user");
  }
}

export async function fetchMe(): Promise<UserProfile | null> {
  const token = getAccessToken();
  if (!token) return null;

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
    return null;
  }

  return await res.json();
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

