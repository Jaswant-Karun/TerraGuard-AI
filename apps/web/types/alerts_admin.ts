export type AlertSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  target_zone: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  radius_km: number;
  channels: string[];
  is_active: boolean;
  is_verified: boolean;
  verified_by_user_id?: string | null;
  acknowledged_by: string[];
  created_at: string;
  expires_at?: string | null;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  target_zone: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreference {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  telegram_enabled: boolean;
  min_severity_alert: number;
  monitored_zones: string[];
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: "CITIZEN" | "ANALYST" | "COORDINATOR" | "ADMIN";
  phone?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SystemHealth {
  database_status: string;
  database_ping_ms: number;
  fallback_mode: boolean;
  open_meteo_healthy: boolean;
  open_aq_healthy: boolean;
  n8n_broker_active: boolean;
  models_loaded: string[];
  active_corridors_count: number;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actor_user_id?: string | null;
  resource: string;
  resource_id?: string | null;
  details: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
}

export interface ResponseTaskItem {
  id: string;
  title: string;
  incident_id?: string | null;
  assigned_department: string;
  assigned_to_user_id?: string | null;
  status: "PENDING" | "DISPATCHED" | "EN_ROUTE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  location: {
    type: string;
    coordinates: [number, number];
  };
  instructions: string;
  created_at: string;
  completed_at?: string | null;
}

export interface AdminOverview {
  total_users: number;
  active_alerts: number;
  pending_citizen_reports: number;
  active_response_tasks: number;
  completed_tasks: number;
  system_health: SystemHealth;
  recent_audit_logs: AuditLogItem[];
}
