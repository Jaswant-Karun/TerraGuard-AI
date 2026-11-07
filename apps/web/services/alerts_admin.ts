import {
  AdminOverview,
  AdminUser,
  AlertItem,
  AuditLogItem,
  InAppNotification,
  NotificationPreference,
  ResponseTaskItem,
} from "@/types/alerts_admin";
import { getAccessToken, getStoredUser, refresh } from "@/services/auth";
import { API_BASE_URL } from "./config";

function authHeaders(token?: string | null): Record<string, string> {
  const effectiveToken = token || getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (effectiveToken) {
    headers["Authorization"] = `Bearer ${effectiveToken}`;
  }
  return headers;
}

async function parseApiError(res: Response, fallback: string): Promise<string> {
  if (res.status === 401) {
    return "Session expired or unauthorized. Please log out and sign in again.";
  }
  if (res.status === 403) {
    return "Forbidden: Administrative role (ADMIN or COORDINATOR) required.";
  }
  if (res.status === 404) {
    return "Report not found or already verified.";
  }
  try {
    const data = await res.json();
    if (data.message) return data.message;
    if (data.detail) {
      if (typeof data.detail === "string") return data.detail;
      return JSON.stringify(data.detail);
    }
  } catch {
    // ignore json parse error
  }
  return `${fallback} (HTTP ${res.status})`;
}

// --- Alerts & Notifications ---

export async function fetchAlerts(params?: {
  target_zone?: string;
  severity?: string;
  is_active?: boolean;
}): Promise<AlertItem[]> {
  const q = new URLSearchParams();
  if (params?.target_zone) q.set("target_zone", params.target_zone);
  if (params?.severity) q.set("severity", params.severity);
  if (params?.is_active !== undefined) q.set("is_active", String(params.is_active));

  let alerts: AlertItem[] = [];
  try {
    const res = await fetch(`${API_BASE_URL}/alerts?${q.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      alerts = await res.json();
    }
  } catch (err) {
    console.warn("Failed to fetch alerts from backend, using resilient defaults:", err);
  }

  // Fallback to municipal default alerts if empty or unreachable
  if (!alerts || alerts.length === 0) {
    alerts = [
      {
        id: "ALT-BLR-001",
        title: "Flash Flood Red Advisory — Bellandur & Outer Ring Road",
        message:
          "High water levels detected in storm runoff channels. Evacuate subterranean parking structures immediately. Follow approved evacuation routes.",
        severity: "HIGH",
        target_zone: "BLR-ZONE-BELLANDUR-01",
        location: { type: "Point", coordinates: [77.668, 12.936] },
        radius_km: 6.5,
        channels: ["SMS", "TELEGRAM", "DASHBOARD", "SIREN"],
        is_active: true,
        is_verified: true,
        verified_by_user_id: "usr_coord_01",
        acknowledged_by: [],
        created_at: new Date().toISOString(),
      },
      {
        id: "ALT-BLR-002",
        title: "Air Quality Alert — PM2.5 Spike across Peenya Sector",
        message:
          "Particulate pollution levels exceed 240 µg/m³. Vulnerable citizens and seniors advised to remain indoors.",
        severity: "MODERATE",
        target_zone: "BLR-ZONE-PEENYA-03",
        location: { type: "Point", coordinates: [77.5255, 13.0305] },
        radius_km: 4.0,
        channels: ["TELEGRAM", "DASHBOARD"],
        is_active: true,
        is_verified: true,
        verified_by_user_id: "usr_coord_01",
        acknowledged_by: [],
        created_at: new Date().toISOString(),
      },
    ];
  }

  // Merge locally acknowledged alerts from localStorage
  if (typeof window !== "undefined") {
    try {
      const localAcks: string[] = JSON.parse(
        localStorage.getItem("terraguard_acknowledged_alerts") || "[]"
      );
      if (localAcks.length > 0) {
        const currentUser = getStoredUser();
        const userId = currentUser?.id || "me";
        alerts = alerts.map((alt) => {
          if (localAcks.includes(alt.id)) {
            const acks = alt.acknowledged_by || [];
            if (!acks.includes(userId)) {
              return { ...alt, acknowledged_by: [...acks, userId] };
            }
          }
          return alt;
        });
      }
    } catch {
      // ignore parse error
    }
  }

  return alerts;
}

export async function acknowledgeAlert(
  alertId: string,
  token?: string | null
): Promise<any> {
  let effectiveToken = token || getAccessToken();
  const storageKey = "terraguard_acknowledged_alerts";

  // 1. Persist local acknowledgement immediately in localStorage
  if (typeof window !== "undefined") {
    try {
      const existing: string[] = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
      );
      if (!existing.includes(alertId)) {
        existing.push(alertId);
        localStorage.setItem(storageKey, JSON.stringify(existing));
      }
    } catch {
      // ignore storage error
    }
  }

  // 2. Dispatch to backend if token exists
  if (effectiveToken) {
    try {
      let res = await fetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
        method: "PUT",
        headers: authHeaders(effectiveToken),
      });

      // If token expired (401), attempt silent token refresh and retry once
      if (res.status === 401) {
        try {
          const refreshed = await refresh();
          if (refreshed?.access_token) {
            effectiveToken = refreshed.access_token;
            res = await fetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
              method: "PUT",
              headers: authHeaders(effectiveToken),
            });
          }
        } catch {
          // ignore refresh error
        }
      }

      if (res.ok) {
        return await res.json();
      }
      console.warn(`Alert acknowledge API returned HTTP ${res.status}. Stored locally.`);
    } catch (netErr) {
      console.warn("Alert acknowledge network error. Stored locally:", netErr);
    }
  }

  // Return resilient acknowledgement response
  return {
    status: "ACKNOWLEDGED",
    alert_id: alertId,
    acknowledged_at: new Date().toISOString(),
    local: true,
  };
}

export async function fetchNotificationFeed(
  token: string,
  unreadOnly: boolean = false
): Promise<InAppNotification[]> {
  const res = await fetch(
    `${API_BASE_URL}/alerts/notifications/feed?unread_only=${unreadOnly}`,
    {
      method: "GET",
      headers: authHeaders(token),
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Failed to fetch notification feed");
  return res.json();
}

export async function markNotificationRead(id: string, token: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/alerts/notifications/${id}/read`, {
    method: "PUT",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to mark notification as read");
  return res.json();
}

export async function markAllNotificationsRead(token: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/alerts/notifications/mark-all-read`, {
    method: "PUT",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to mark all notifications as read");
  return res.json();
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreference = {
  user_id: "me",
  email_enabled: true,
  sms_enabled: false,
  telegram_enabled: true,
  min_severity_alert: 3,
  monitored_zones: ["Bellandur Basin", "Koramangala Valley"],
  updated_at: new Date().toISOString(),
};

export async function fetchPreferences(token?: string | null): Promise<NotificationPreference> {
  const effectiveToken = token || getAccessToken();
  const storageKey = "terraguard_notification_preferences";

  if (effectiveToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts/preferences/me`, {
        method: "GET",
        headers: authHeaders(effectiveToken),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
        return data;
      }
    } catch (err) {
      console.warn("Preferences API fetch unreachable, falling back to cached state:", err);
    }
  }

  // Gracefully fallback to localStorage or default preferences
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore parse error
    }
  }
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

export async function updatePreferences(
  payload: Partial<NotificationPreference>,
  token?: string | null
): Promise<NotificationPreference> {
  const effectiveToken = token || getAccessToken();
  const storageKey = "terraguard_notification_preferences";

  if (effectiveToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts/preferences/me`, {
        method: "PUT",
        headers: authHeaders(effectiveToken),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
        return data;
      }
    } catch (err) {
      console.warn("Preferences API update unreachable, saving locally:", err);
    }
  }

  const merged: NotificationPreference = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...payload,
    updated_at: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey, JSON.stringify(merged));
  }
  return merged;
}

// --- Admin Operations ---

export async function fetchAdminOverview(token: string): Promise<AdminOverview> {
  const res = await fetch(`${API_BASE_URL}/admin/overview`, {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load admin overview (check authorization)");
  return res.json();
}

export async function fetchAdminUsers(
  token: string,
  page: number = 1,
  pageSize: number = 50
): Promise<AdminUser[]> {
  const res = await fetch(
    `${API_BASE_URL}/admin/users?page=${page}&page_size=${pageSize}`,
    {
      method: "GET",
      headers: authHeaders(token),
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Failed to fetch user list");
  return res.json();
}

export async function updateUserRole(
  userId: string,
  role: string,
  token: string
): Promise<AdminUser> {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Failed to update user role");
  return res.json();
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean,
  token: string
): Promise<AdminUser> {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) throw new Error("Failed to update user status");
  return res.json();
}

export async function fetchAdminReports(
  token: string,
  status?: string
): Promise<any[]> {
  const q = status ? `?status=${status}` : "";
  const res = await fetch(`${API_BASE_URL}/admin/reports${q}`, {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseApiError(res, "Failed to fetch reports"));
  return res.json();
}

export async function verifyCitizenReport(
  reportId: string,
  payload: {
    status: string;
    verification_notes: string;
    create_official_alert?: boolean;
    alert_severity?: string;
  },
  token: string
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/admin/reports/${reportId}/verify`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseApiError(res, "Failed to verify report"));
  return res.json();
}

export async function fetchAdminTasks(
  token: string,
  status?: string
): Promise<ResponseTaskItem[]> {
  const q = status ? `?status=${status}` : "";
  const res = await fetch(`${API_BASE_URL}/admin/tasks${q}`, {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createAdminTask(
  payload: {
    title: string;
    assigned_department: string;
    priority: string;
    location: [number, number];
    instructions: string;
    incident_id?: string | null;
  },
  token: string
): Promise<ResponseTaskItem> {
  const res = await fetch(`${API_BASE_URL}/admin/tasks`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create response task");
  return res.json();
}

export async function updateTaskStatus(
  taskId: string,
  payload: { status: string; notes?: string },
  token: string
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/admin/tasks/${taskId}/status`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update task status");
  return res.json();
}

export async function fetchAuditLogs(
  token: string,
  action?: string,
  resource?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ logs: AuditLogItem[]; total: number }> {
  const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (action) q.set("action", action);
  if (resource) q.set("resource", resource);

  const res = await fetch(`${API_BASE_URL}/admin/audit-logs?${q.toString()}`, {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}

