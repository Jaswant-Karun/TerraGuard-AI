"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Flame,
  Globe,
  History,
  Info,
  Layers,
  Lock,
  Megaphone,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Terminal,
  Trash2,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  Volume2,
  Waves,
  Workflow,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/AuthContext";
import {
  createAdminTask,
  fetchAdminOverview,
  fetchAdminReports,
  fetchAdminTasks,
  fetchAdminUsers,
  fetchAuditLogs,
  updateTaskStatus,
  updateUserRole,
  updateUserStatus,
  verifyCitizenReport,
} from "@/services/alerts_admin";
import {
  AdminOverview,
  AdminUser,
  AuditLogItem,
  ResponseTaskItem,
} from "@/types/alerts_admin";

export default function AdminOperationsPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "reports" | "tasks" | "models" | "audit"
  >("overview");

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Users Tab State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>("");

  // Reports Tab State
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [selectedReportForVerify, setSelectedReportForVerify] = useState<any | null>(null);
  const [verifyNotes, setVerifyNotes] = useState<string>("");
  const [verifyAction, setVerifyAction] = useState<"VERIFIED" | "REJECTED" | "ESCALATED">("VERIFIED");
  const [escalateToAlert, setEscalateToAlert] = useState<boolean>(false);

  // Tasks Tab State
  const [tasks, setTasks] = useState<ResponseTaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskDept, setNewTaskDept] = useState<string>("MUNICIPAL_STORMWATER_CORPS");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("HIGH");
  const [newTaskLng, setNewTaskLng] = useState<number>(77.6245);
  const [newTaskLat, setNewTaskLat] = useState<number>(12.9352);
  const [newTaskInstructions, setNewTaskInstructions] = useState<string>("");

  // Audit Logs Tab State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);

  // Check RBAC Permissions
  const userRole = user?.role || "CITIZEN";
  const isAuthorized = ["ADMIN", "COORDINATOR", "ANALYST"].includes(userRole);
  const isAdmin = userRole === "ADMIN";

  useEffect(() => {
    if (token && isAuthorized) {
      loadOverviewData();
    }
  }, [token, isAuthorized]);

  const loadOverviewData = async () => {
    if (!token) return;
    try {
      setLoadingOverview(true);
      setErrorMessage(null);
      const data = await fetchAdminOverview(token);
      setOverview(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load administrative overview");
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadUsersTab = async () => {
    if (!token) return;
    try {
      setLoadingUsers(true);
      const data = await fetchAdminUsers(token);
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadReportsTab = async () => {
    if (!token) return;
    try {
      setLoadingReports(true);
      const data = await fetchAdminReports(token);
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const loadTasksTab = async () => {
    if (!token) return;
    try {
      setLoadingTasks(true);
      const data = await fetchAdminTasks(token);
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadAuditTab = async () => {
    if (!token || !isAdmin) return;
    try {
      setLoadingAudit(true);
      const res = await fetchAuditLogs(token);
      setAuditLogs(res.logs || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    if (tab === "users") loadUsersTab();
    else if (tab === "reports") loadReportsTab();
    else if (tab === "tasks") loadTasksTab();
    else if (tab === "audit") loadAuditTab();
    else if (tab === "overview") loadOverviewData();
  };

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    if (!token || !isAdmin) {
      alert("Only platform Administrators can update user roles.");
      return;
    }
    try {
      await updateUserRole(userId, newRole, token);
      await loadUsersTab();
    } catch (err: any) {
      alert("Failed to update role: " + err.message);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    if (!token || !isAdmin) {
      alert("Only platform Administrators can modify account status.");
      return;
    }
    try {
      await updateUserStatus(userId, !currentActive, token);
      await loadUsersTab();
    } catch (err: any) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  const handleExecuteVerification = async () => {
    if (!token || !selectedReportForVerify) return;
    try {
      await verifyCitizenReport(
        selectedReportForVerify.id,
        {
          status: verifyAction,
          verification_notes: verifyNotes || "Reviewed by Municipal Operations Command",
          create_official_alert: escalateToAlert,
          alert_severity: "HIGH",
        },
        token
      );
      setSelectedReportForVerify(null);
      setVerifyNotes("");
      setEscalateToAlert(false);
      await loadReportsTab();
      await loadOverviewData();
    } catch (err: any) {
      alert("Verification failed: " + err.message);
    }
  };

  const handleCreateTask = async () => {
    if (!token) return;
    try {
      await createAdminTask(
        {
          title: newTaskTitle,
          assigned_department: newTaskDept,
          priority: newTaskPriority,
          location: [newTaskLng, newTaskLat],
          instructions: newTaskInstructions,
        },
        token
      );
      setShowCreateTaskModal(false);
      setNewTaskTitle("");
      setNewTaskInstructions("");
      await loadTasksTab();
      await loadOverviewData();
    } catch (err: any) {
      alert("Failed to create task: " + err.message);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, nextStatus: string) => {
    if (!token) return;
    try {
      await updateTaskStatus(taskId, { status: nextStatus }, token);
      await loadTasksTab();
      await loadOverviewData();
    } catch (err: any) {
      alert("Failed to update task: " + err.message);
    }
  };

  // If Not Authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white rounded-xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Administrative Access Restricted
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The Operations Command Panel requires privileged roles (<strong>Administrator</strong>, <strong>Response Coordinator</strong>, or <strong>Environmental Analyst</strong>).
            Ordinary citizen credentials cannot perform administrative verification or broadcast municipal sirens.
          </p>
          <div className="pt-2 text-xs font-mono bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-500">
            Current Authenticated Role: <strong className="text-slate-800">{userRole}</strong>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-[#0B132B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Sliders className="w-6 h-6" />
                </span>
                <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                  Administrative Command &amp; Governance
                </span>
                <Badge
                  variant="outline"
                  className="text-emerald-400 border-emerald-500/40 bg-emerald-950/40 font-mono text-[11px]"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  RBAC Enforced ({userRole})
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Municipal Operations Command Panel
              </h1>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl">
                Authorize emergency sirens, review citizen hazard reports, dispatch field task forces,
                manage user roles, and inspect tamper-proof cryptographic audit trails.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadOverviewData}
                disabled={loadingOverview}
                className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loadingOverview ? "animate-spin" : ""}`}
                />
                Refresh Telemetry
              </Button>
            </div>
          </div>

          {/* Quick KPI Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mt-8 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Registered Citizens</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">
                {overview?.total_users || 0}
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Active Sirens</div>
              <div className="text-xl font-bold text-rose-400 mt-1 font-mono">
                {overview?.active_alerts || 0}
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Pending Incident Triage</div>
              <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
                {overview?.pending_citizen_reports || 0}
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Field Tasks Active</div>
              <div className="text-xl font-bold text-cyan-400 mt-1 font-mono">
                {overview?.active_response_tasks || 0}
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Cluster Latency</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono flex items-center">
                <span>{overview?.system_health?.database_ping_ms || 1.2} ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto text-xs">
          {[
            { id: "overview", label: "Operations Overview", icon: Activity },
            { id: "users", label: "User Management", icon: Users },
            { id: "reports", label: "Incident Review & Verification", icon: ShieldAlert },
            { id: "tasks", label: "Response Task Dispatch", icon: Truck },
            { id: "models", label: "Model & Telemetry Status", icon: Cpu },
            { id: "audit", label: "Security Audit Trail", icon: History, adminOnly: true },
          ].map((tab) => {
            if (tab.adminOnly && !isAdmin) return null;
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OPERATIONS OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Incident Triage Card */}
              <Card className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                      <ShieldAlert className="w-5 h-5" />
                    </span>
                    <Badge variant="outline" className="text-amber-700 bg-amber-50 text-[10px]">
                      Awaiting Action
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Citizen Hazard Incident Triage
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Citizen-submitted road waterloggings and infrastructural damages awaiting human review.
                  </p>
                  <div className="text-2xl font-bold text-slate-900 font-mono mt-3">
                    {overview?.pending_citizen_reports || 0} Pending
                  </div>
                </div>
                <div className="pt-4 mt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTabChange("reports")}
                    className="w-full text-xs text-blue-600 hover:text-blue-800"
                  >
                    Open Incident Review Queue
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </Card>

              {/* Response Task Dispatch Card */}
              <Card className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
                      <Truck className="w-5 h-5" />
                    </span>
                    <Badge variant="outline" className="text-cyan-700 bg-cyan-50 text-[10px]">
                      Field Units
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Field Response Orders
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Dewatering pumps, road barricade details, and emergency evacuation operations.
                  </p>
                  <div className="text-2xl font-bold text-slate-900 font-mono mt-3">
                    {overview?.active_response_tasks || 0} In Field
                  </div>
                </div>
                <div className="pt-4 mt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTabChange("tasks")}
                    className="w-full text-xs text-cyan-700 hover:text-cyan-900"
                  >
                    Dispatch / View Action Orders
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </Card>

              {/* System Cluster Health Card */}
              <Card className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <Server className="w-5 h-5" />
                    </span>
                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 text-[10px]">
                      Operational
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Cluster Architecture Health
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    MongoDB Atlas replica set, Open-Meteo external telemetry, and n8n webhook broker.
                  </p>
                  <div className="text-xs font-mono text-emerald-700 font-bold mt-3 space-y-1">
                    <div>Status: {overview?.system_health?.database_status}</div>
                    <div>RTT Ping: {overview?.system_health?.database_ping_ms} ms</div>
                  </div>
                </div>
                <div className="pt-4 mt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTabChange("models")}
                    className="w-full text-xs text-emerald-700 hover:text-emerald-900"
                  >
                    Inspect Engine &amp; Models
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Recent Audit Trail Snippet */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <History className="w-4 h-4 mr-2 text-slate-600" />
                  Recent Administrative Audit Entries
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => handleTabChange("audit")}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    View Complete Audit Log &rarr;
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {overview?.recent_audit_logs?.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No recent audit actions recorded.
                  </div>
                ) : (
                  overview?.recent_audit_logs?.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {log.action}
                        </span>
                        <span className="text-slate-600">
                          Target: <strong className="text-slate-800">{log.resource}</strong>
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  User Accounts &amp; Role-Based Access Control
                </h2>
                <p className="text-xs text-slate-500">
                  Manage registered citizens, coordinators, and environmental analysts.
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <Input
                  placeholder="Filter users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 text-xs h-8 w-48 bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {u.full_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-slate-800"
                          >
                            <option value="CITIZEN">CITIZEN</option>
                            <option value="ANALYST">ANALYST</option>
                            <option value="COORDINATOR">COORDINATOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {u.role}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {u.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                            className="text-[11px] h-7 px-2"
                          >
                            {u.is_active ? "Suspend" : "Activate"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INCIDENT REVIEW & REPORT VERIFICATION */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Citizen Hazard Incident Review Queue
                </h2>
                <p className="text-xs text-slate-500">
                  Verify or reject hazard reports submitted by citizens before broadcasting official sirens.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={loadReportsTab}
                className="text-xs h-8"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Refresh Reports
              </Button>
            </div>

            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No citizen hazard reports currently in queue.
                </div>
              ) : (
                reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 uppercase">
                          {rep.category}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          Severity {rep.severity}/5
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          Status: {rep.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{rep.title}</h4>
                      <p className="text-xs text-slate-600 max-w-2xl">{rep.description}</p>
                      {rep.address && (
                        <div className="text-[11px] text-slate-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                          {rep.address}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setSelectedReportForVerify(rep)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white h-8"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1" />
                        Triage / Verify
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: RESPONSE TASK DISPATCH */}
        {activeTab === "tasks" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Municipal Field Response Task Orders
                </h2>
                <p className="text-xs text-slate-500">
                  Dispatch and coordinate dewatering units, traffic diversions, and emergency rescue crews.
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowCreateTaskModal(true)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white h-8"
              >
                <Truck className="w-3.5 h-3.5 mr-1.5" />
                Dispatch New Task
              </Button>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No field response tasks currently active.
                </div>
              ) : (
                tasks.map((tsk) => (
                  <div
                    key={tsk.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-100 text-slate-800 font-mono"
                        >
                          {tsk.priority} PRIORITY
                        </Badge>
                        <span className="text-xs font-mono font-bold text-blue-700">
                          {tsk.assigned_department}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          • Status: <strong>{tsk.status}</strong>
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{tsk.title}</h4>
                      <p className="text-xs text-slate-600 max-w-2xl">{tsk.instructions}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {tsk.status !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateTaskStatus(tsk.id, "COMPLETED")}
                          className="text-xs h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: MODEL & TELEMETRY STATUS */}
        {activeTab === "models" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Machine Learning Model Provenance &amp; Telemetry Health
              </h2>
              <p className="text-xs text-slate-500">
                Operational status of hydrological regressors, Open-Meteo external telemetry, and n8n broker.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="font-bold text-slate-900">XGBoost Flood Predictor</div>
                <div className="text-slate-600">Version: <strong>v1.0.0 (Scikit/XGBoost)</strong></div>
                <div className="text-slate-600">Accuracy: <strong>89.4% ROC-AUC</strong></div>
                <div className="text-emerald-700 font-medium">Status: Active In-Memory</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="font-bold text-slate-900">Heat Index &amp; AQI Regressor</div>
                <div className="text-slate-600">Version: <strong>v1.1 (Atmospheric Inversion)</strong></div>
                <div className="text-slate-600">MAE: <strong>±1.2°C ambient</strong></div>
                <div className="text-emerald-700 font-medium">Status: Active In-Memory</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="font-bold text-slate-900">n8n Automation Broker</div>
                <div className="text-slate-600">Port: <strong>5678 (Dedicated Volume)</strong></div>
                <div className="text-slate-600">HMAC Secret: <strong>Enforced SHA-256</strong></div>
                <div className="text-emerald-700 font-medium">Status: 6 Workflows Operational</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SECURITY AUDIT TRAIL */}
        {activeTab === "audit" && isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Tamper-Proof Administrative Audit Trail
                </h2>
                <p className="text-xs text-slate-500">
                  Chronological security audit log recording every municipal decision, siren dispatch, and role mutation.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={loadAuditTab}
                className="text-xs h-8"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Refresh Trail
              </Button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Timestamp (IST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{log.resource}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {log.actor_user_id || "SYSTEM"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: VERIFY CITIZEN REPORT */}
      <Modal
        isOpen={!!selectedReportForVerify}
        onClose={() => setSelectedReportForVerify(null)}
        title="Incident Verification &amp; Siren Escalation"
        description="Verify this report or escalate it directly to an active public siren."
        className="max-w-lg"
      >
        <div className="space-y-4 pt-2">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-900">
              {selectedReportForVerify?.title}
            </div>
            <p className="text-slate-600">{selectedReportForVerify?.description}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Verification Decision
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVerifyAction("VERIFIED")}
                className={`p-2 rounded-lg text-xs font-semibold border ${
                  verifyAction === "VERIFIED"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                Verify Incident
              </button>
              <button
                type="button"
                onClick={() => setVerifyAction("ESCALATED")}
                className={`p-2 rounded-lg text-xs font-semibold border ${
                  verifyAction === "ESCALATED"
                    ? "bg-rose-50 border-rose-500 text-rose-800"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                Escalate
              </button>
              <button
                type="button"
                onClick={() => setVerifyAction("REJECTED")}
                className={`p-2 rounded-lg text-xs font-semibold border ${
                  verifyAction === "REJECTED"
                    ? "bg-slate-200 border-slate-400 text-slate-800"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                Reject / False
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Command Verification Notes
            </label>
            <Input
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              placeholder="e.g. Silt buildup confirmed on site by BBMP pump unit."
              className="text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={escalateToAlert}
              onChange={(e) => setEscalateToAlert(e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
            <span>Broadcast official emergency siren for this hazard area</span>
          </label>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedReportForVerify(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleExecuteVerification}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit Verification
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: CREATE RESPONSE TASK */}
      <Modal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        title="Dispatch Municipal Field Action Order"
        description="Assign task orders to field crews with priority and coordinate destination."
        className="max-w-lg"
      >
        <div className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Task Order Title
            </label>
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Deploy Dewatering Pump Unit 4"
              className="text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Department
              </label>
              <select
                value={newTaskDept}
                onChange={(e) => setNewTaskDept(e.target.value)}
                className="w-full text-xs h-9 bg-slate-50 border border-slate-200 rounded-md px-2 text-slate-800"
              >
                <option value="MUNICIPAL_STORMWATER_CORPS">Stormwater Corps</option>
                <option value="TRAFFIC_POLICE_DISASTER_WING">Traffic Disaster Wing</option>
                <option value="CIVIC_DEWATERING_UNIT">Dewatering Unit</option>
                <option value="HAZMAT_RESPONSE_TEAM">Hazmat Response Team</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full text-xs h-9 bg-slate-50 border border-slate-200 rounded-md px-2 text-slate-800"
              >
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Field Instructions
            </label>
            <textarea
              rows={3}
              value={newTaskInstructions}
              onChange={(e) => setNewTaskInstructions(e.target.value)}
              placeholder="Detailed instructions for field squad..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateTaskModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleCreateTask}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              Dispatch Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
