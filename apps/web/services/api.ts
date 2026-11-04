/**
 * TerraGuard AI — Centralized Frontend API Service
 * Handles communication with the FastAPI backend under /api/v1
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

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

export async function fetchBackendHealth(): Promise<SystemHealthStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Backend returned HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
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

