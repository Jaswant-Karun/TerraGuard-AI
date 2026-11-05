import { AnalyticsFilterParams, AnalyticsOverviewResponse } from "@/types/analytics";
import { getAccessToken } from "@/services/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

function authHeaders(token?: string | null): Record<string, string> {
  const effectiveToken = token || getAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (effectiveToken) {
    headers["Authorization"] = `Bearer ${effectiveToken}`;
  }
  return headers;
}

export async function fetchAnalyticsOverview(
  params?: AnalyticsFilterParams,
  token?: string | null
): Promise<AnalyticsOverviewResponse> {
  const q = new URLSearchParams();
  if (params?.time_range) q.set("time_range", params.time_range);
  if (params?.start_date) q.set("start_date", params.start_date);
  if (params?.end_date) q.set("end_date", params.end_date);
  if (params?.location) q.set("location", params.location);
  if (params?.risk_category) q.set("risk_category", params.risk_category);
  if (params?.verification_status) q.set("verification_status", params.verification_status);

  const res = await fetch(`${API_BASE_URL}/analytics/overview?${q.toString()}`, {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to load analytics intelligence overview");
  }

  return res.json();
}

export async function downloadReportFile(
  format: "csv" | "pdf",
  params?: AnalyticsFilterParams,
  token?: string | null
): Promise<void> {
  const q = new URLSearchParams();
  q.set("format", format);
  if (params?.time_range) q.set("time_range", params.time_range);
  if (params?.start_date) q.set("start_date", params.start_date);
  if (params?.end_date) q.set("end_date", params.end_date);
  if (params?.location) q.set("location", params.location);
  if (params?.risk_category) q.set("risk_category", params.risk_category);
  if (params?.verification_status) q.set("verification_status", params.verification_status);

  const res = await fetch(`${API_BASE_URL}/analytics/reports/export?${q.toString()}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error(`Failed to generate ${format.toUpperCase()} report`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition");
  let filename = `terraguard_analytics_${params?.time_range || "30d"}.${format}`;
  if (disposition && disposition.includes("filename=")) {
    const matches = disposition.match(/filename="?([^"]+)"?/);
    if (matches && matches[1]) {
      filename = matches[1];
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}
