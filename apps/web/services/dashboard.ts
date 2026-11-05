import {
  DashboardNotification,
  DashboardSummary,
  LocationOption,
} from "@/types/dashboard";
import { getAccessToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchDashboardSummary(params?: {
  locationId?: string;
  zoneCode?: string;
  timeRange?: string;
}): Promise<DashboardSummary> {
  const query = new URLSearchParams();
  if (params?.locationId) query.set("location_id", params.locationId);
  if (params?.zoneCode) query.set("zone_code", params.zoneCode);
  if (params?.timeRange) query.set("time_range", params.timeRange);

  const url = `${API_BASE_URL}/dashboard/summary${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard summary (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchDashboardLocations(): Promise<LocationOption[]> {
  const res = await fetch(`${API_BASE_URL}/dashboard/locations`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch command locations (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchDashboardNotifications(): Promise<DashboardNotification[]> {
  const res = await fetch(`${API_BASE_URL}/dashboard/notifications`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch notifications (HTTP ${res.status})`);
  }

  return res.json();
}

