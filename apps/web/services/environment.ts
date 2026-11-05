import {
  AirQualityDetails,
  CurrentEnvironment,
  ForecastEnvironment,
} from "@/types/environment";
import { getAccessToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export async function fetchCurrentEnvironment(params?: {
  lat?: number;
  lng?: number;
  bypassCache?: boolean;
  token?: string | null;
}): Promise<CurrentEnvironment> {
  const query = new URLSearchParams();
  if (params?.lat !== undefined) query.set("lat", params.lat.toString());
  if (params?.lng !== undefined) query.set("lng", params.lng.toString());
  if (params?.bypassCache) query.set("bypass_cache", "true");

  const url = `${API_BASE_URL}/environment/current${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const token = params?.token || getAccessToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch current environment (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchEnvironmentForecast(params?: {
  lat?: number;
  lng?: number;
  days?: number;
}): Promise<ForecastEnvironment> {
  const query = new URLSearchParams();
  if (params?.lat !== undefined) query.set("lat", params.lat.toString());
  if (params?.lng !== undefined) query.set("lng", params.lng.toString());
  if (params?.days !== undefined) query.set("days", params.days.toString());

  const url = `${API_BASE_URL}/environment/forecast${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch weather forecast (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchAirQualityDetails(params?: {
  lat?: number;
  lng?: number;
}): Promise<AirQualityDetails> {
  const query = new URLSearchParams();
  if (params?.lat !== undefined) query.set("lat", params.lat.toString());
  if (params?.lng !== undefined) query.set("lng", params.lng.toString());

  const url = `${API_BASE_URL}/environment/air-quality${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch air quality telemetry (HTTP ${res.status})`);
  }

  return res.json();
}

