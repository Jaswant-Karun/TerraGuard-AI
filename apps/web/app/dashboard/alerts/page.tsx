"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  Flame,
  Globe,
  Info,
  Layers,
  MapPin,
  Megaphone,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sliders,
  Volume2,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/AuthContext";
import {
  acknowledgeAlert,
  fetchAlerts,
  fetchNotificationFeed,
  fetchPreferences,
  markAllNotificationsRead,
  markNotificationRead,
  updatePreferences,
} from "@/services/alerts_admin";
import {
  AlertItem,
  AlertSeverity,
  InAppNotification,
  NotificationPreference,
} from "@/types/alerts_admin";

const AVAILABLE_SECTORS = [
  { id: "BLR-ZONE-BELLANDUR-01", name: "Bellandur Lake Feeder Basin (Lowland)" },
  { id: "BLR-ZONE-SILKBOARD-02", name: "Koramangala 80ft Road Corridor (Culverts)" },
  { id: "BLR-ZONE-PEENYA-03", name: "Peenya Industrial Heavy Air Basin" },
  { id: "BLR-ZONE-WHITEFIELD-04", name: "Whitefield Elevated Tech Ridge" },
];

export default function AlertsManagementPage() {
  const { user, token } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // In-App Notification Feed
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState<boolean>(false);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  // Notification Preferences & Subscriptions Modal
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState<boolean>(false);

  // Acknowledgement tracking
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
    if (token) {
      loadNotifications();
      loadUserPreferences();
    }
  }, [token]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!token) return;
    try {
      const data = await fetchNotificationFeed(token, unreadOnly);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const loadUserPreferences = async () => {
    if (!token) return;
    try {
      const data = await fetchPreferences(token);
      setPreferences(data);
    } catch (err) {
      console.error("Failed to load preferences:", err);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    if (!token) {
      alert("Please sign in to acknowledge official hazard alerts.");
      return;
    }
    try {
      setAcknowledgingId(alertId);
      await acknowledgeAlert(alertId, token);
      await loadAlerts();
    } catch (err: any) {
      alert("Failed to acknowledge: " + err.message);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleMarkRead = async (notifId: string) => {
    if (!token) return;
    try {
      await markNotificationRead(notifId, token);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleSavePreferences = async () => {
    if (!token || !preferences) return;
    try {
      setSavingPrefs(true);
      setPrefSaveSuccess(false);
      await updatePreferences(preferences, token);
      setPrefSaveSuccess(true);
      setTimeout(() => setPrefSaveSuccess(false), 2500);
    } catch (err: any) {
      alert("Failed to save preferences: " + err.message);
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleSectorSubscription = (sectorId: string) => {
    if (!preferences) return;
    const current = [...preferences.monitored_zones];
    const exists = current.includes(sectorId);
    const updated = exists ? current.filter((id) => id !== sectorId) : [...current, sectorId];
    setPreferences({ ...preferences, monitored_zones: updated });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredAlerts = alerts.filter((a) => {
    if (selectedSeverity !== "ALL" && a.severity !== selectedSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchMsg = a.message.toLowerCase().includes(q);
      const matchZone = a.target_zone.toLowerCase().includes(q);
      return matchTitle || matchMsg || matchZone;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-[#0B132B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="p-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
                  <Megaphone className="w-6 h-6 animate-pulse" />
                </span>
                <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">
                  Emergency Sirens &amp; Citizen Advisories
                </span>
                <Badge
                  variant="outline"
                  className="text-amber-400 border-amber-500/40 bg-amber-950/40 font-mono text-[11px]"
                >
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  Siren Dispatch Active
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Alerts &amp; Notification Operations Center
              </h1>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl">
                Broadcast public emergency sirens, manage subscribed geographic sectors,
                and track verified municipal advisories across metropolitan districts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreferencesModal(true)}
                className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                Area Subscriptions
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotifDrawer(true)}
                className="relative bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                <Bell className="w-4 h-4 mr-2" />
                In-App Feed
                {unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={loadAlerts}
                disabled={loading}
                className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Prominent Emergency Precedence Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 shadow-sm flex items-start space-x-3.5">
          <span className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <Volume2 className="w-5 h-5" />
          </span>
          <div className="text-xs text-amber-900 leading-relaxed">
            <div className="font-bold uppercase tracking-wider text-[11px] text-amber-800 mb-0.5">
              Official Instructions Precedence Notice
            </div>
            In an active severe disaster, official municipal emergency services (112, Police, Fire, BBMP Disaster Management Cell) and on-ground personnel instructions supersede all automated alerts. Acknowledge sirens promptly and follow designated high-ground evacuation paths.
          </div>
        </div>

        {/* ALERTS FEED CONTAINER */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <span>Active Public Hazard Alerts</span>
                <span className="ml-2.5 text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {filteredAlerts.length} Active Sirens
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified municipal advisories transmitted across SMS, Telegram, and In-App siren channels.
              </p>
            </div>

            {/* Severity and Search Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <Input
                  placeholder="Filter by zone or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8 w-44 bg-slate-50 border-slate-200"
                />
              </div>

              <div className="flex items-center space-x-1">
                {["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedSeverity === sev
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Alert Cards Feed */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading active hazard advisories...
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No active hazard advisories match the selected filter.
              </div>
            ) : (
              filteredAlerts.map((alt) => {
                const isCritical = alt.severity === "CRITICAL";
                const isHigh = alt.severity === "HIGH";
                const isAcknowledged =
                  user && alt.acknowledged_by?.includes(user.id);
                const isAcking = acknowledgingId === alt.id;

                let borderGlow = "border-slate-200";
                let badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";

                if (isCritical) {
                  borderGlow = "border-red-400 ring-2 ring-red-500/10 bg-red-50/20";
                  badgeStyle = "bg-red-100 text-red-800 border-red-300 font-bold";
                } else if (isHigh) {
                  borderGlow = "border-amber-400 bg-amber-50/10";
                  badgeStyle = "bg-amber-100 text-amber-800 border-amber-300 font-bold";
                }

                return (
                  <Card
                    key={alt.id}
                    className={`rounded-xl p-5 shadow-sm transition-all border ${borderGlow}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex items-center space-x-2.5">
                          <Badge variant="outline" className={`text-[10px] ${badgeStyle}`}>
                            {isCritical && <Megaphone className="w-3 h-3 mr-1 animate-pulse" />}
                            {alt.severity} ADVISORY
                          </Badge>
                          <span className="text-xs font-mono font-bold text-slate-600">
                            {alt.target_zone}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            • {new Date(alt.created_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {alt.is_verified && (
                            <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Command Verified
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {alt.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {alt.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 font-mono">
                          <span>Radius: {alt.radius_km} km</span>
                          <span>•</span>
                          <span>
                            Channels: {alt.channels?.join(", ") || "DASHBOARD"}
                          </span>
                          <span>•</span>
                          <span>
                            {alt.acknowledged_by?.length || 0} Citizens Acknowledged
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0 self-end md:self-center">
                        {isAcknowledged ? (
                          <div className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                            <Check className="w-4 h-4 mr-1.5" />
                            Acknowledged
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={isAcking}
                            onClick={() => handleAcknowledge(alt.id)}
                            className="text-xs bg-slate-900 hover:bg-slate-800 text-white"
                          >
                            {isAcking ? (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                Acknowledging...
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Acknowledge Receipt
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL: NOTIFICATION PREFERENCES & SUBSCRIBED AREAS */}
      <Modal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        title="Emergency Notification Preferences"
        description="Configure multi-channel delivery and select monitored urban sectors."
        className="max-w-xl"
      >
        <div className="space-y-5 pt-2">
          {/* Channel Toggles */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Alert Delivery Channels
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center space-x-2 p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.email_enabled ?? true}
                  onChange={(e) =>
                    setPreferences((prev) =>
                      prev ? { ...prev, email_enabled: e.target.checked } : null
                    )
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Email Alerts</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.sms_enabled ?? false}
                  onChange={(e) =>
                    setPreferences((prev) =>
                      prev ? { ...prev, sms_enabled: e.target.checked } : null
                    )
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>SMS Siren</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.telegram_enabled ?? true}
                  onChange={(e) =>
                    setPreferences((prev) =>
                      prev ? { ...prev, telegram_enabled: e.target.checked } : null
                    )
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Telegram Bot</span>
              </label>
            </div>
          </div>

          {/* Subscribed Sectors */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Subscribed Geographic Sectors
            </h4>
            <p className="text-xs text-slate-500">
              Receive prioritized notifications when high-water thresholds or extreme hazards affect these sectors:
            </p>

            <div className="space-y-2 pt-1">
              {AVAILABLE_SECTORS.map((sec) => {
                const isSubbed =
                  preferences?.monitored_zones?.includes(sec.id) ?? false;

                return (
                  <div
                    key={sec.id}
                    onClick={() => toggleSectorSubscription(sec.id)}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSubbed
                        ? "bg-blue-50 border-blue-400 text-blue-900"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <div className="font-bold">{sec.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Code: {sec.id}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        isSubbed
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600"
                      }`}
                    >
                      {isSubbed ? "Subscribed" : "Add"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {prefSaveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
              Notification preferences saved successfully.
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferencesModal(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={savingPrefs}
              onClick={handleSavePreferences}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              {savingPrefs ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: IN-APP NOTIFICATION FEED DRAWER */}
      <Modal
        isOpen={showNotifDrawer}
        onClose={() => setShowNotifDrawer(false)}
        title="In-App Notification Feed"
        description="Real-time alert notifications and sector activity logs."
        className="max-w-xl"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <label className="text-xs font-medium text-slate-600 flex items-center space-x-2">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => {
                  setUnreadOnly(e.target.checked);
                  loadNotifications();
                }}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Unread Only</span>
            </label>

            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Mark all as read
            </button>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications to display.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border text-xs transition-colors ${
                    notif.is_read
                      ? "bg-slate-50/80 border-slate-200 text-slate-600"
                      : "bg-white border-blue-300 shadow-xs text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px] text-slate-900">
                      {notif.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(notif.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600">{notif.message}</p>

                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                    <span className="font-mono text-slate-500">
                      Zone: {notif.target_zone}
                    </span>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

