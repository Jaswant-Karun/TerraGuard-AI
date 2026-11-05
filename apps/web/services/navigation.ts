import {
  NearbyFacilitiesResponse,
  RouteQueryRequest,
  RouteQueryResponse,
} from "@/types/navigation";
import { getAccessToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

/**
 * Compute safe navigation routes with hazard avoidance and alternative paths
 */
export async function fetchSafeRoutes(
  payload: RouteQueryRequest,
  token?: string | null
): Promise<RouteQueryResponse> {
  const effectiveToken = token || getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (effectiveToken) {
    headers["Authorization"] = `Bearer ${effectiveToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/navigation/routes`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Failed to calculate safe routes (HTTP ${res.status}): ${
        errorBody || res.statusText
      }`
    );
  }

  return res.json();
}

/**
 * Fetch verified emergency facilities near a coordinate
 */
export async function fetchNearbyFacilities(
  lng: number,
  lat: number,
  radiusKm: number = 15.0,
  category?: string
): Promise<NearbyFacilitiesResponse> {
  const params = new URLSearchParams({
    lng: String(lng),
    lat: String(lat),
    radius_km: String(radiusKm),
  });
  if (category && category !== "ALL") {
    params.set("category", category);
  }

  const res = await fetch(
    `${API_BASE_URL}/navigation/facilities/nearby?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Failed to fetch nearby facilities (HTTP ${res.status}): ${
        errorBody || res.statusText
      }`
    );
  }

  return res.json();
}

/**
 * Fetch designated municipal evacuation corridors
 */
export async function fetchEvacuationCorridors(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/navigation/corridors`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Failed to fetch evacuation corridors (HTTP ${res.status}): ${
        errorBody || res.statusText
      }`
    );
  }

  return res.json();
}

