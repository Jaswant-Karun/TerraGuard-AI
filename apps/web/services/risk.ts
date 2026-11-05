import {
  HistoricalRiskResponse,
  RiskAssessmentRequest,
  RiskAssessmentResponse,
  RiskExplanationResponse,
} from "@/types/risk";
import { getAccessToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000/api/v1";

export async function assessRisk(
  payload: RiskAssessmentRequest,
  token?: string | null
): Promise<RiskAssessmentResponse> {
  const effectiveToken = token || getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (effectiveToken) {
    headers["Authorization"] = `Bearer ${effectiveToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/risk/assess`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Risk assessment failed (HTTP ${res.status}): ${errorBody || res.statusText}`
    );
  }

  return res.json();
}

export async function fetchCurrentRisk(params?: {
  lat?: number;
  lng?: number;
}): Promise<RiskAssessmentResponse> {
  const query = new URLSearchParams();
  if (params?.lat !== undefined) query.set("lat", params.lat.toString());
  if (params?.lng !== undefined) query.set("lng", params.lng.toString());

  const url = `${API_BASE_URL}/risk/current${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch current risk assessment (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchRiskHistory(params?: {
  page?: number;
  pageSize?: number;
  zoneCode?: string;
}): Promise<HistoricalRiskResponse> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set("page", params.page.toString());
  if (params?.pageSize !== undefined)
    query.set("page_size", params.pageSize.toString());
  if (params?.zoneCode) query.set("zone_code", params.zoneCode);

  const url = `${API_BASE_URL}/risk/history${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch risk assessment history (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchRiskExplanation(
  assessmentId: string
): Promise<RiskExplanationResponse> {
  const res = await fetch(`${API_BASE_URL}/risk/explain/${assessmentId}`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch risk explanation (HTTP ${res.status})`);
  }

  return res.json();
}

