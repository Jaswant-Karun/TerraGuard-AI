/**
 * TerraGuard AI — Centralized Frontend API Service & Robust HTTP Client
 * Standardized communication with the FastAPI backend under /api/v1
 * Provides timeouts, exponential backoff retries, Bearer token injection,
 * request validation, and centralized error parsing.
 */

import { getAccessToken } from "./auth";
import { API_BASE_URL, normalizeApiUrl } from "./config";

export { API_BASE_URL, normalizeApiUrl };

export interface SystemHealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  environment: string;
  timestamp: string;
  services: {
    api: string;
    database: string;
  };
}

export class ApiClientError extends Error {
  statusCode: number;
  errorCode: string;
  details?: Record<string, any>;
  path?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = "API_ERROR",
    details?: Record<string, any>,
    path?: string
  ) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.path = path;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  token?: string | null;
  skipAuth?: boolean;
}

/**
 * Core Request Dispatcher with Timeout and Exponential Backoff Retries
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    params,
    timeoutMs = 15000,
    retries = 2,
    retryDelayMs = 350,
    token,
    skipAuth = false,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  // 1. Build Query Parameters
  let url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  if (params) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        q.set(k, String(v));
      }
    }
    const qs = q.toString();
    if (qs) {
      url += `${url.includes("?") ? "&" : "?"}${qs}`;
    }
  }

  // 2. Assemble Headers & Bearer Token
  const effectiveToken = skipAuth ? null : token || getAccessToken();
  const headers = new Headers(customHeaders);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (effectiveToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${effectiveToken}`);
  }
  if (
    fetchOptions.body &&
    typeof fetchOptions.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  // 3. Execution Loop with Exponential Backoff
  let attempt = 0;
  const isIdempotent = ["GET", "HEAD", "OPTIONS"].includes(
    (fetchOptions.method || "GET").toUpperCase()
  );

  while (attempt <= (isIdempotent ? retries : 0)) {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutTimer);

      // Handle Non-2xx Responses
      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        const msg =
          errorData.message ||
          errorData.detail ||
          `HTTP Error ${response.status}: ${response.statusText}`;

        const err = new ApiClientError(
          msg,
          response.status,
          errorData.error_code || `HTTP_${response.status}`,
          errorData.details,
          response.url
        );

        // If 5xx server error on an idempotent request, allow retry
        if (response.status >= 500 && attempt < retries && isIdempotent) {
          attempt++;
          await new Promise((r) => setTimeout(r, retryDelayMs * Math.pow(2, attempt - 1)));
          continue;
        }

        throw err;
      }

      // Successful 204 No Content
      if (response.status === 204) {
        return null as T;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      clearTimeout(timeoutTimer);

      if (err.name === "AbortError") {
        throw new ApiClientError(
          `Request timeout after ${timeoutMs}ms: ${url}`,
          408,
          "REQUEST_TIMEOUT"
        );
      }

      // Retry on network disconnect for idempotent requests
      if (attempt < retries && isIdempotent && !(err instanceof ApiClientError)) {
        attempt++;
        await new Promise((r) => setTimeout(r, retryDelayMs * Math.pow(2, attempt - 1)));
        continue;
      }

      throw err;
    }
  }

  throw new ApiClientError(`Request failed after ${retries} attempts`, 500, "RETRY_EXHAUSTED");
}

/**
 * Unified API Client Interface
 */
export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};

/**
 * Diagnostics Health Probe
 */
export async function fetchBackendHealth(): Promise<SystemHealthStatus> {
  try {
    return await apiClient.get<SystemHealthStatus>("/health", {
      skipAuth: true,
      timeoutMs: 5000,
      retries: 1,
    });
  } catch {
    return {
      status: "unhealthy",
      version: "unknown",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      services: {
        api: "UNREACHABLE",
        database: "UNREACHABLE",
      },
    };
  }
}
