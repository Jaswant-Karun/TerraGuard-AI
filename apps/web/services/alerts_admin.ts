import {
  AdminOverview,
  AdminUser,
  AlertItem,
  AuditLogItem,
  InAppNotification,
  NotificationPreference,
  ResponseTaskItem,
} from "@/types/alerts_admin";
import { getAccessToken } from "@/services/auth";
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

  const res = await fetch(`${API_BASE_URL}/alerts?${q.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load alerts");
  return res.json();
}

export async function acknowledgeAlert(alertId: string, token: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
    method: "PUT",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to acknowledge alert");
  return res.json();
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

export async function fetchPreferences(token: string): Promise<NotificationPreference> {
  const res = await fetch(`${API_BASE_URL}/alerts/preferences/me`, {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch notification preferences");
  return res.json();
}

export async function updatePreferences(
  payload: Partial<NotificationPreference>,
  token: string
): Promise<NotificationPreference> {
  const res = await fetch(`${API_BASE_URL}/alerts/preferences/me`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update notification preferences");
  return res.json();
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
  if (!res.ok) throw new Error("Failed to fetch reports");
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
  if (!res.ok) throw new Error("Failed to verify report");
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

