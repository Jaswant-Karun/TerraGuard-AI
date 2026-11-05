import { DigitalTwinSummaryResponse } from "@/types/digital_twin";
import { getAccessToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000/api/v1";

/**
 * Fetch digital twin timeline slices, sector analytics, and historical benchmarks
 */
export async function fetchDigitalTwinSummary(token?: string | null): Promise<DigitalTwinSummaryResponse> {
  const effectiveToken = token || getAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (effectiveToken) {
    headers["Authorization"] = `Bearer ${effectiveToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/digital-twin/summary`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Failed to load digital twin summary (HTTP ${res.status}): ${
        errorBody || res.statusText
      }`
    );
  }

  return res.json();
}

/**
 * Fetch 3D building footprint GeoJSON for extruded rendering
 */
export async function fetch3DBuildings(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/digital-twin/buildings`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Failed to load 3D buildings (HTTP ${res.status}): ${
        errorBody || res.statusText
      }`
    );
  }

  return res.json();
}

