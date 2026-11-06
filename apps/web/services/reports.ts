import {
  ReportItem,
  ReportListResponse,
  VisionAnalysisDTO,
} from "@/types/report";
import { getAccessToken } from "./auth";
import { API_BASE_URL } from "./config";

export async function submitHazardReport(
  formData: FormData,
  token?: string | null
): Promise<ReportItem> {
  const effectiveToken = token || getAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (effectiveToken) {
    headers["Authorization"] = `Bearer ${effectiveToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/reports`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Failed to submit hazard report (HTTP ${res.status}): ${
        errorBody || res.statusText
      }`
    );
  }

  return res.json();
}

export async function analyzeImagePreview(
  imageFile: File,
  categoryHint?: string,
  descriptionHint?: string
): Promise<VisionAnalysisDTO> {
  const formData = new FormData();
  formData.append("image", imageFile);
  if (categoryHint) formData.append("category_hint", categoryHint);
  if (descriptionHint) formData.append("description_hint", descriptionHint);

  const res = await fetch(`${API_BASE_URL}/reports/analyze-image`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `AI Vision inspection failed (HTTP ${res.status}): ${
        errorBody || res.statusText
      }`
    );
  }

  return res.json();
}

export async function fetchReports(params?: {
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  category?: string;
  status?: string;
  isDuplicate?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<ReportListResponse> {
  const query = new URLSearchParams();
  if (params?.lat !== undefined) query.set("lat", params.lat.toString());
  if (params?.lng !== undefined) query.set("lng", params.lng.toString());
  if (params?.radiusMeters !== undefined)
    query.set("radius_meters", params.radiusMeters.toString());
  if (params?.category) query.set("category", params.category);
  if (params?.status) query.set("status", params.status);
  if (params?.isDuplicate !== undefined)
    query.set("is_duplicate", String(params.isDuplicate));
  if (params?.page !== undefined) query.set("page", params.page.toString());
  if (params?.pageSize !== undefined)
    query.set("page_size", params.pageSize.toString());

  const url = `${API_BASE_URL}/reports${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch hazard reports (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchReportById(reportId: string): Promise<ReportItem> {
  const res = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch hazard report (HTTP ${res.status})`);
  }

  return res.json();
}

export async function updateReportStatus(
  reportId: string,
  status: string,
  notes?: string,
  token?: string | null
): Promise<ReportItem> {
  const effectiveToken = token || getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (effectiveToken) {
    headers["Authorization"] = `Bearer ${effectiveToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/reports/${reportId}/status`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      status,
      verification_notes: notes,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Failed to update report status (HTTP ${res.status}): ${
        errorBody || res.statusText
      }`
    );
  }

  return res.json();
}

