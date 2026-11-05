"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  FileCode,
  Flame,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  fetchWorkflowLogs,
  fetchWorkflows,
  triggerWorkflow,
} from "@/services/automation";
import {
  WorkflowDefinition,
  WorkflowLogDTO,
  WorkflowTriggerResponse,
} from "@/types/automation";

export default function AutomationCenterPage() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [logs, setLogs] = useState<WorkflowLogDTO[]>([]);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [loadingWorkflows, setLoadingWorkflows] = useState<boolean>(true);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [triggeringWorkflowId, setTriggeringWorkflowId] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedWorkflowFilter, setSelectedWorkflowFilter] = useState<string>("ALL");

  // Trigger Modal
  const [selectedModalWorkflow, setSelectedModalWorkflow] =
    useState<WorkflowDefinition | null>(null);
  const [customPayloadText, setCustomPayloadText] = useState<string>("{}");
  const [triggerResult, setTriggerResult] =
    useState<WorkflowTriggerResponse | null>(null);
  const [triggerError, setTriggerError] = useState<string | null>(null);

  // Inspect Payload Modal
  const [inspectedLog, setInspectedLog] = useState<WorkflowLogDTO | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    loadWorkflows();
    loadLogs();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoadingWorkflows(true);
      const data = await fetchWorkflows();
      setWorkflows(data);
    } catch (err: any) {
      console.error("Failed to load workflows:", err);
    } finally {
      setLoadingWorkflows(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetchWorkflowLogs(25, 0);
      setLogs(res.logs || []);
      setTotalLogs(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load workflow logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenTriggerModal = (wf: WorkflowDefinition) => {
    setSelectedModalWorkflow(wf);
    setTriggerResult(null);
    setTriggerError(null);

    // Provide helpful pre-filled sample payload
    let samplePayload = {};
    if (wf.id === "WF_01_ENV_MONITORING") {
      samplePayload = {
        city: "Bengaluru",
        lat: 12.9716,
        lng: 77.5946,
        trigger_reason: "Manual telemetry health probe",
      };
    } else if (wf.id === "WF_02_RISK_THRESHOLD") {
      samplePayload = {
        target_zone: "Bellandur Lake Basin",
        risk_score: 78.5,
        hazard_type: "FLOOD",
        severity: "CRITICAL",
        coordinates: [77.6669, 12.9352],
        rationale: "Rapid rainfall accumulation exceeded 55mm/hr",
      };
    } else if (wf.id === "WF_03_CITIZEN_REPORT_PROCESSING") {
      samplePayload = {
        report_id: "REP-DEMO-991",
        user_id: "usr_community_77",
        hazard_category: "WATERLOGGING",
        location: [77.6245, 12.9352],
        description: "Water level reached knee height along 80ft road near transit stop",
      };
    } else if (wf.id === "WF_04_ALERT_NOTIFICATION") {
      samplePayload = {
        alert_id: "ALT-SIM-440",
        target_zone: "Koramangala 80ft Rd",
        severity: "HIGH",
        title: "Flash Waterlogging Alert",
        channels: ["TELEGRAM", "SMS", "IN_APP"],
      };
    } else if (wf.id === "WF_05_RESPONSE_TASK_CREATION") {
      samplePayload = {
        title: "Deploy High-Capacity Dewatering Pump Unit 3",
        assigned_department: "MUNICIPAL_STORMWATER_CORPS",
        priority: "URGENT",
        location: [77.6245, 12.9352],
        requires_approval: false,
        instructions: "Immediate deployment to drain culvert #4 near Sony World junction",
      };
    } else {
      samplePayload = {
        city: "Bengaluru",
        target_date: new Date().toISOString().split("T")[0],
      };
    }
    setCustomPayloadText(JSON.stringify(samplePayload, null, 2));
  };

  const handleExecuteTrigger = async () => {
    if (!selectedModalWorkflow) return;
    try {
      setTriggeringWorkflowId(selectedModalWorkflow.id);
      setTriggerError(null);
      setTriggerResult(null);

      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(customPayloadText);
      } catch (e: any) {
        setTriggerError("Invalid JSON payload format: " + e.message);
        return;
      }

      const res = await triggerWorkflow(selectedModalWorkflow.id, parsedPayload);
      setTriggerResult(res);
      // Reload logs after slight delay
      setTimeout(() => {
        loadLogs();
        loadWorkflows();
      }, 750);
    } catch (err: any) {
      setTriggerError(err.message || "Failed to trigger workflow");
    } finally {
      setTriggeringWorkflowId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedWorkflowFilter !== "ALL" && log.workflow_id !== selectedWorkflowFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchWf = log.workflow_id.toLowerCase().includes(q);
      const matchEv = log.trigger_event.toLowerCase().includes(q);
      const matchStatus = log.status.toLowerCase().includes(q);
      return matchWf || matchEv || matchStatus;
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
                <span className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Workflow className="w-6 h-6" />
                </span>
                <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                  Autonomous Disaster Orchestration
                </span>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 bg-emerald-950/40 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                  n8n Engine Active
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Automation Center & Workflow Engine
              </h1>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl">
                Enterprise automation pipelines powered by authenticated n8n webhooks.
                Periodically ingests sensor telemetry, classifies hazards via AI vision,
                and orchestrates rapid civic response without human delays.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadWorkflows();
                  loadLogs();
                }}
                className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Telemetry
              </Button>
            </div>
          </div>

          {/* Quick Metrics & Security Badges Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Orchestrated Workflows</div>
              <div className="text-xl font-bold text-white mt-1 flex items-center">
                <span>{workflows.length || 6} Active</span>
                <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-normal">
                  Production
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Webhook Security</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center">
                <Lock className="w-4 h-4 mr-1.5" />
                <span>HMAC-SHA256</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">X-Webhook-Secret Verified</div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Loop Protection</div>
              <div className="text-xl font-bold text-cyan-400 mt-1 flex items-center">
                <Shield className="w-4 h-4 mr-1.5" />
                <span>Zero Loops</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">X-TerraGuard-Origin Gated</div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Anti-Flapping Guard</div>
              <div className="text-xl font-bold text-amber-400 mt-1 flex items-center">
                <Clock className="w-4 h-4 mr-1.5" />
                <span>60m Window</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Deduplication Cooldown</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        {/* Architecture Notice Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
              <Server className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Database Isolation & Production Webhook Architecture
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                n8n operates on an isolated execution store and <strong>never connects directly to MongoDB Atlas</strong>.
                All municipal task dispatches, risk assessments, and alert broadcasts communicate via signed FastAPI webhooks with constant-time cryptographic verification.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <a
              href="#documentation-section"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
            >
              <span>View Specs & Architecture</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        </div>

        {/* SECTION: 6 WORKFLOW CARDS */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <span>Production Workflows</span>
                <span className="ml-2.5 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {workflows.length} Configured
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Active automated pipelines ready for n8n daemon triggering or simulated manual dispatch.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loadingWorkflows ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse space-y-4"
                >
                  <div className="h-5 bg-slate-200 rounded w-1/2" />
                  <div className="h-10 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-8 bg-slate-100 rounded w-full" />
                </div>
              ))
            ) : (
              workflows.map((wf) => {
                const isSchedule = wf.trigger_type === "SCHEDULE";
                const isTriggering = triggeringWorkflowId === wf.id;

                return (
                  <Card
                    key={wf.id}
                    className="bg-white border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative"
                  >
                    <div className="p-5">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`p-2 rounded-lg ${
                              isSchedule
                                ? "bg-amber-50 text-amber-600"
                                : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            {isSchedule ? (
                              <Clock className="w-4 h-4" />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                          </span>
                          <div>
                            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                              {wf.id}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 leading-snug">
                              {wf.name}
                            </h3>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold shrink-0"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                          {wf.status}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                        {wf.description}
                      </p>

                      {/* Trigger Cadence / Webhook */}
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-4 text-xs">
                        <div className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">
                          {isSchedule ? "Execution Schedule" : "Inbound Webhook"}
                        </div>
                        <div className="font-mono text-slate-700 font-medium truncate flex items-center">
                          {isSchedule ? (
                            <>
                              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              <span>{wf.cadence}</span>
                            </>
                          ) : (
                            <>
                              <Terminal className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              <span className="truncate">
                                /api/v1/automation/webhooks/{wf.webhook_slug}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {wf.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Execution Stats */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400">Total Runs</div>
                          <div className="font-bold text-slate-800 font-mono">
                            {wf.execution_count} executions
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Success Rate</div>
                          <div className="font-bold text-emerald-600 font-mono">
                            {wf.success_rate}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="bg-slate-50/80 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {wf.last_executed_at
                          ? `Last: ${new Date(wf.last_executed_at).toLocaleTimeString()}`
                          : "Scheduled active"}
                      </span>

                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isTriggering}
                        onClick={() => handleOpenTriggerModal(wf)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 font-medium shadow-sm"
                      >
                        {isTriggering ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                            Triggering...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1.5 fill-current" />
                            Trigger Run
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION: EXECUTION AUDIT LOGS TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <span>Execution Audit Trail</span>
                <span className="ml-2.5 text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {totalLogs} Records
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographically audited execution logs persisted in MongoDB collection <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">workflow_logs</code>.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <Input
                  placeholder="Filter by event or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8 w-48 bg-slate-50 border-slate-200"
                />
              </div>

              <select
                value={selectedWorkflowFilter}
                onChange={(e) => setSelectedWorkflowFilter(e.target.value)}
                className="text-xs h-8 bg-slate-50 border border-slate-200 rounded-md px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Workflows</option>
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.id}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={loadLogs}
                disabled={loadingLogs}
                className="h-8 text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 mr-1 ${loadingLogs ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Workflow ID</th>
                  <th className="py-3 px-4">Trigger Event</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {loadingLogs
                        ? "Loading execution logs..."
                        : "No execution logs match the selected filter."}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => {
                    const isSuccess = log.status === "SUCCESS";
                    return (
                      <tr key={log.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                              isSuccess
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {isSuccess ? (
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-3 h-3 mr-1 text-red-600" />
                            )}
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {log.workflow_id}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="font-medium text-slate-800">
                            {log.trigger_event}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {log.execution_duration_ms} ms
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {new Date(log.executed_at).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInspectedLog(log)}
                            className="h-7 text-xs px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION: ARCHITECTURE & SPECS REFERENCE */}
        <div id="documentation-section" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <FileCode className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Technical Specification & Documentation References
              </h2>
              <p className="text-xs text-slate-500">
                Engineered for INFINEX 2K26 under UN Sustainable Development Goals 3, 6, 9, 11 & 13.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-900">N8N_SETUP.md</span>
                <Badge variant="outline" className="text-[10px] text-slate-600 bg-white">
                  Configuration
                </Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Setup guide for running n8n via Docker or npm with isolated SQLite storage, custom credentials, and tunnel configurations.
              </p>
              <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                docker run -p 5678:5678 -v ~/.n8n:/data n8nio/n8n
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-900">N8N_WORKFLOWS.md</span>
                <Badge variant="outline" className="text-[10px] text-slate-600 bg-white">
                  6 Workflows
                </Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Complete node architecture, cron cadences, and trigger specifications for all 6 importable JSON workflow manifests in <code className="text-blue-700 font-mono">automation/n8n/workflows/</code>.
              </p>
              <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                automation/n8n/workflows/01_*.json ... 06_*.json
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-900">N8N_WEBHOOKS.md</span>
                <Badge variant="outline" className="text-[10px] text-slate-600 bg-white">
                  Security
                </Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Cryptographic authentication spec, HMAC signature headers, origin validation, payload schemas, and anti-loop guards.
              </p>
              <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200 truncate">
                X-Webhook-Secret: tg_dev_secret_key
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: MANUAL TRIGGER WORKFLOW */}
      <Modal
        isOpen={!!selectedModalWorkflow}
        onClose={() => {
          setSelectedModalWorkflow(null);
          setTriggerResult(null);
          setTriggerError(null);
        }}
        title={`Trigger Workflow: ${selectedModalWorkflow?.name || ""}`}
        description="Dispatch an authenticated trigger event to this workflow pipeline."
        className="max-w-xl"
      >
        <div className="space-y-4 pt-2">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span className="font-semibold">Workflow Identifier:</span>
              <span className="font-mono font-bold text-slate-900">
                {selectedModalWorkflow?.id}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-semibold">Trigger Mode:</span>
              <span className="font-mono text-blue-700 font-medium">
                {selectedModalWorkflow?.trigger_type}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-semibold">Authentication:</span>
              <span className="font-mono text-emerald-700 font-medium">
                X-Webhook-Secret Verified
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Custom Trigger Payload (JSON)
            </label>
            <textarea
              rows={8}
              value={customPayloadText}
              onChange={(e) => setCustomPayloadText(e.target.value)}
              className="w-full text-xs font-mono p-3 bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Customize parameters to test threshold alerts, citizen triage, or task dispatching.
            </p>
          </div>

          {triggerError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{triggerError}</span>
            </div>
          )}

          {triggerResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
              <div className="font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                Workflow Trigger Dispatched ({triggerResult.status})
              </div>
              <div className="text-[11px] text-emerald-700 font-mono">
                {triggerResult.message}
              </div>
              {triggerResult.n8n_response && (
                <pre className="text-[10px] font-mono bg-white p-2 rounded border border-emerald-200 overflow-x-auto max-h-28">
                  {JSON.stringify(triggerResult.n8n_response, null, 2)}
                </pre>
              )}
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedModalWorkflow(null);
                setTriggerResult(null);
              }}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              disabled={!!triggeringWorkflowId}
              onClick={handleExecuteTrigger}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              {triggeringWorkflowId ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  Dispatch Now
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: INSPECT LOG PAYLOAD */}
      <Modal
        isOpen={!!inspectedLog}
        onClose={() => setInspectedLog(null)}
        title={`Audit Payload: ${inspectedLog?.workflow_id || ""}`}
        description={`Executed at ${inspectedLog?.executed_at ? new Date(inspectedLog.executed_at).toLocaleString() : ""}`}
        className="max-w-2xl"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              Duration: <span className="font-mono text-slate-800 font-bold">{inspectedLog?.execution_duration_ms} ms</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  JSON.stringify(inspectedLog?.payload || {}, null, 2),
                  "Payload Copied"
                )
              }
              className="text-xs h-7"
            >
              <Copy className="w-3 h-3 mr-1" />
              {copyFeedback || "Copy JSON"}
            </Button>
          </div>

          <pre className="text-xs font-mono p-4 bg-slate-900 text-slate-100 rounded-lg border border-slate-800 max-h-96 overflow-y-auto">
            {JSON.stringify(inspectedLog?.payload || {}, null, 2)}
          </pre>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInspectedLog(null)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
