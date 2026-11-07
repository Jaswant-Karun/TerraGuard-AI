"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Database,
  Globe,
  Info,
  Lock,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  Save,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  Sliders,
  User,
  Volume2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/features/auth/AuthContext";
import {
  fetchPreferences,
  updatePreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@/services/alerts_admin";
import { fetchBackendHealth, SystemHealthStatus } from "@/services/api";
import { NotificationPreference } from "@/types/alerts_admin";

const MONITORED_ZONES = [
  { code: "BLR-BLD-01", name: "Bellandur Basin" },
  { code: "BLR-KRM-02", name: "Koramangala Valley" },
  { code: "BLR-PNY-03", name: "Peenya Industrial" },
  { code: "BLR-WFD-04", name: "Whitefield Tech" },
  { code: "BLR-CBD-05", name: "Central Bengaluru" },
];

export default function SettingsPage() {
  const { user, token, logout } = useAuth();

  // Notification Preferences State
  const [preferences, setPreferences] = useState<NotificationPreference>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loadingPrefs, setLoadingPrefs] = useState<boolean>(true);
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState<boolean>(false);
  const [prefError, setPrefError] = useState<string | null>(null);

  // Backend Health Diagnostic State
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false);

  const loadPreferences = useCallback(async () => {
    try {
      setLoadingPrefs(true);
      setPrefError(null);
      const data = await fetchPreferences(token);
      setPreferences(data || DEFAULT_NOTIFICATION_PREFERENCES);
    } catch (err: any) {
      console.warn("Failed to load user preferences, falling back to default:", err);
      setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    } finally {
      setLoadingPrefs(false);
    }
  }, [token]);

  const loadHealth = useCallback(async () => {
    try {
      setCheckingHealth(true);
      const status = await fetchBackendHealth();
      setHealth(status);
    } catch {
      setHealth({
        status: "unhealthy",
        version: "unknown",
        environment: "unknown",
        timestamp: new Date().toISOString(),
        services: { api: "UNREACHABLE", database: "UNREACHABLE" },
      });
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
    loadHealth();
  }, [loadPreferences, loadHealth]);

  const handleSavePreferences = async () => {
    if (!preferences) return;
    try {
      setSavingPrefs(true);
      setPrefSaveSuccess(false);
      setPrefError(null);
      const updated = await updatePreferences(preferences, token);
      setPreferences(updated);
      setPrefSaveSuccess(true);
      setTimeout(() => setPrefSaveSuccess(false), 3500);
    } catch (err: any) {
      console.warn("Error updating notification settings:", err);
      setPrefError(err.message || "Failed to update notification settings");
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleZone = (zoneName: string) => {
    if (!preferences) return;
    const currentZones = preferences.monitored_zones || [];
    const exists = currentZones.includes(zoneName);
    const updated = exists
      ? currentZones.filter((z) => z !== zoneName)
      : [...currentZones, zoneName];
    setPreferences({ ...preferences, monitored_zones: updated });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Header */}
      <div className="bg-[#0B132B] text-white px-6 py-8 border-b border-slate-800 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30">
                <Settings className="w-5 h-5" />
              </span>
              <Badge variant="outline" className="text-blue-300 border-blue-400/40 text-xs">
                PLATFORM CONFIGURATION
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">System & Account Settings</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Manage your personal emergency dispatch subscriptions, multi-channel alerting preferences,
              and inspect backend telemetry health.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadHealth}
              disabled={checkingHealth}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${checkingHealth ? "animate-spin text-blue-400" : ""}`} />
              Ping Health
            </Button>
            {user && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => logout()}
                className="bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-800/60 text-xs h-9"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-6 space-y-6">
        {/* User Identity Card */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-lg">
                {user?.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{user?.full_name || "Guest Observer"}</h2>
                <p className="text-xs text-slate-500">{user?.email || "No authenticated account"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Assigned Role:</span>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {user?.role || "CITIZEN"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">User ID:</span>
              <span className="font-mono text-slate-800 text-[11px]">{user?.id || "N/A"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Account Status:</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active & Verified
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Privilege Clearance:</span>
              <span className="text-slate-800 font-medium">
                {user?.role === "ADMIN"
                  ? "Full City Command & Verification"
                  : user?.role === "COORDINATOR"
                  ? "Field Dispatch & Alert Broadcast"
                  : user?.role === "ANALYST"
                  ? "Telemetry & ML Model Inspection"
                  : "Citizen Reporting & Siren Alerts"}
              </span>
            </div>
          </div>
        </Card>

        {/* Emergency Alert & Zone Subscription Settings */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                Emergency Notification Channels & Subscriptions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure delivery channels and select urban micro-zones to receive hazard sirens.
              </p>
            </div>

            <Button
              size="sm"
              variant="primary"
              disabled={savingPrefs || !preferences}
              onClick={handleSavePreferences}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
            >
              {savingPrefs ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              Save Preferences
            </Button>
          </div>

          {prefSaveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Notification preferences and zone subscriptions saved successfully!</span>
            </div>
          )}

          {prefError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{prefError}</span>
            </div>
          )}

          {loadingPrefs && !preferences && (
            <div className="p-8 flex items-center justify-center text-xs text-slate-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              Loading your preferences from database...
            </div>
          )}

          {preferences && (
            <div className="space-y-6">
              {/* Channel Toggles */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Broadcast Delivery Channels & Thresholds
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-2.5 cursor-pointer hover:bg-slate-100 transition">
                    <input
                      type="checkbox"
                      checked={preferences.email_enabled}
                      onChange={(e) =>
                        setPreferences({ ...preferences, email_enabled: e.target.checked })
                      }
                      className="mt-0.5 rounded text-blue-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Email Alerts</div>
                      <div className="text-[11px] text-slate-500">Official bulletins</div>
                    </div>
                  </label>

                  <label className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-2.5 cursor-pointer hover:bg-slate-100 transition">
                    <input
                      type="checkbox"
                      checked={preferences.sms_enabled}
                      onChange={(e) =>
                        setPreferences({ ...preferences, sms_enabled: e.target.checked })
                      }
                      className="mt-0.5 rounded text-blue-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">SMS Gateway</div>
                      <div className="text-[11px] text-slate-500">Emergency dispatch</div>
                    </div>
                  </label>

                  <label className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-2.5 cursor-pointer hover:bg-slate-100 transition">
                    <input
                      type="checkbox"
                      checked={preferences.telegram_enabled}
                      onChange={(e) =>
                        setPreferences({ ...preferences, telegram_enabled: e.target.checked })
                      }
                      className="mt-0.5 rounded text-blue-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Telegram Bot</div>
                      <div className="text-[11px] text-slate-500">Instant push channel</div>
                    </div>
                  </label>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="text-xs font-bold text-slate-800 mb-1">Min Severity Level</div>
                    <select
                      value={preferences.min_severity_alert}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          min_severity_alert: Number(e.target.value),
                        })
                      }
                      className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1"
                    >
                      <option value={1}>Level 1+ (All Alerts)</option>
                      <option value={2}>Level 2+ (Elevated)</option>
                      <option value={3}>Level 3+ (Moderate)</option>
                      <option value={4}>Level 4+ (High & Critical)</option>
                      <option value={5}>Level 5 (Critical Only)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Subscribed Risk Zones */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Monitored Risk Zone Subscriptions
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  You will receive priority push notifications when flood or heat risk spikes in these zones.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {MONITORED_ZONES.map((zone) => {
                    const isSubscribed = preferences.monitored_zones?.includes(zone.name) ?? false;
                    return (
                      <div
                        key={zone.code}
                        onClick={() => toggleZone(zone.name)}
                        className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                          isSubscribed
                            ? "border-blue-500 bg-blue-50/70 text-blue-900 font-semibold"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div>
                          <div className="text-xs">{zone.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{zone.code}</div>
                        </div>
                        {isSubscribed ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Backend Telemetry Health Status Card */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                Live Telemetry Link & Cluster Health
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time health probe verifying live connectivity to the core disaster intelligence engine.
              </p>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1.5 ${
                health?.status === "healthy"
                  ? "bg-emerald-100 text-emerald-800"
                  : health?.status === "degraded"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.status === "healthy" ? "bg-emerald-600 animate-pulse" : "bg-red-600"
                }`}
              />
              {health?.status ? health.status.toUpperCase() : "CHECKING..."}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-400 block">Intelligence Core:</span>
              <span className="font-bold text-slate-800 font-mono">
                {health?.services.api || "ONLINE"}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-400 block">Spatial Store:</span>
              <span className="font-bold text-slate-800 font-mono">
                {health?.services.database || "ONLINE"}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-400 block">Platform Version:</span>
              <span className="font-bold text-slate-800 font-mono">
                v{health?.version || "1.0.0"}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-400 block">Environment:</span>
              <span className="font-bold text-slate-800 font-mono uppercase">
                {health?.environment || "DEVELOPMENT"}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

