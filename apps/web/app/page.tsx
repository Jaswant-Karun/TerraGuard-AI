"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Activity,
  Layers,
  MapPin,
  Cpu,
  Workflow,
  Radio,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Globe2,
} from "lucide-react";

interface ServiceStatus {
  frontend: string;
  backend: string;
  latencyMs: number | null;
  lastChecked: string;
}

export default function HomePage() {
  const [status, setStatus] = useState<ServiceStatus>({
    frontend: "operational",
    backend: "checking...",
    latencyMs: null,
    lastChecked: "Just now",
  });

  useEffect(() => {
    async function checkHealth() {
      const startTime = performance.now();
      try {
        const res = await fetch("http://localhost:8000/api/v1/health");
        const elapsed = Math.round(performance.now() - startTime);
        if (res.ok) {
          const data = await res.json();
          setStatus({
            frontend: "operational",
            backend: data.status === "healthy" ? "operational" : "degraded",
            latencyMs: elapsed,
            lastChecked: new Date().toLocaleTimeString(),
          });
        } else {
          throw new Error("Backend degraded");
        }
      } catch {
        // Explicit fallback handling without faking live status
        setStatus({
          frontend: "operational",
          backend: "offline / starting",
          latencyMs: null,
          lastChecked: new Date().toLocaleTimeString(),
        });
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Dark Navy Command Sidebar */}
      <aside className="w-72 bg-[#0B132B] text-slate-300 flex flex-col justify-between shrink-0 shadow-xl border-r border-[#1C2541]">
        <div>
          {/* Logo & Tagline */}
          <div className="px-6 py-6 border-b border-[#1C2541] flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#0284C7] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#06B6D4]/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                TerraGuard <span className="text-[#06B6D4] text-xs px-1.5 py-0.5 rounded bg-[#06B6D4]/10 border border-[#06B6D4]/30">AI</span>
              </h1>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Predict. Prevent. Protect.</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Operations Center
            </div>
            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-[#1C2541] text-white font-medium text-sm transition-colors border-l-4 border-[#06B6D4]"
            >
              <Activity className="w-4 h-4 text-[#06B6D4]" />
              <span>Command Center</span>
            </a>
            <a
              href="#maps"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-[#141E3C] hover:text-white font-medium text-sm transition-colors"
            >
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>Geospatial Radar</span>
            </a>
            <a
              href="#risk"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-[#141E3C] hover:text-white font-medium text-sm transition-colors"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Predictive Risk Engine</span>
            </a>
            <a
              href="#reports"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-[#141E3C] hover:text-white font-medium text-sm transition-colors"
            >
              <FileCheck2 className="w-4 h-4 text-slate-400" />
              <span>Incident Triage & Reports</span>
            </a>

            <div className="pt-4 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Intelligence & Automation
            </div>
            <a
              href="#ai"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-[#141E3C] hover:text-white font-medium text-sm transition-colors"
            >
              <Cpu className="w-4 h-4 text-slate-400" />
              <span>Gemini Vision Sentinel</span>
            </a>
            <a
              href="#automation"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-[#141E3C] hover:text-white font-medium text-sm transition-colors"
            >
              <Workflow className="w-4 h-4 text-slate-400" />
              <span>n8n Orchestrator</span>
            </a>
          </nav>
        </div>

        {/* Live System Watchdog Status */}
        <div className="p-4 m-4 rounded-xl bg-[#141E3C] border border-[#1C2541]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#06B6D4] animate-pulse" />
              Telemetry Pulse
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                status.backend === "operational"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {status.backend}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Frontend:</span>
              <span className="text-slate-200">Next.js 14 App</span>
            </div>
            <div className="flex justify-between">
              <span>Backend API:</span>
              <span className="text-slate-200">
                {status.latencyMs !== null ? `${status.latencyMs} ms` : "Unreachable"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Audited:</span>
              <span className="text-slate-400">{status.lastChecked}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Command Dashboard Canvas */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Command Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-semibold text-slate-800">
              Urban Risk Intelligence Command Center
            </h2>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              Sector: Global Hub
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
              <Server className="w-4 h-4 text-[#0284C7]" />
              <span>FastAPI v1: /api/v1/health</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>System Live</span>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-8 space-y-8 max-w-7xl">
          {/* Welcome & Mission Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0284C7] p-8 text-white shadow-lg">
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#06B6D4] text-xs font-semibold tracking-wide border border-white/20">
                <Globe2 className="w-3.5 h-3.5" />
                INFINEX 2K26 — Hackathon Production Foundation
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                TerraGuard AI Command Platform
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                Autonomous urban risk intelligence connecting environmental telemetry,
                geospatial OpenStreetMap analysis, multimodal Gemini Vision hazard perception,
                and event-driven n8n response workflows.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-md bg-white/15 text-white">SDG 3 Health</span>
                <span className="px-2.5 py-1 rounded-md bg-white/15 text-white">SDG 6 Water</span>
                <span className="px-2.5 py-1 rounded-md bg-white/15 text-white">SDG 9 Infrastructure</span>
                <span className="px-2.5 py-1 rounded-md bg-white/15 text-white">SDG 11 Cities</span>
                <span className="px-2.5 py-1 rounded-md bg-white/15 text-white">SDG 13 Climate</span>
              </div>
            </div>
          </div>

          {/* Phase 1 Verification Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Frontend Foundation */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-sky-50 text-[#0284C7] flex items-center justify-center font-bold">
                  FE
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Next.js 14 Frontend</h3>
                <p className="text-xs text-slate-500 mt-1">
                  App Router, Tailwind CSS, Lucide icons, Framer Motion, and MapLibre GL JS ready.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-mono text-slate-600">
                <span>Port: 3000</span>
                <span>Route: /</span>
              </div>
            </div>

            {/* Card 2: Backend API Gateway */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-cyan-50 text-[#06B6D4] flex items-center justify-center font-bold">
                  BE
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">FastAPI Async Gateway</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pydantic v2 validation, CORS security, centralized error handlers, and structured logging.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-mono text-slate-600">
                <span>Port: 8000</span>
                <span>Docs: /api/v1/docs</span>
              </div>
            </div>

            {/* Card 3: Monorepo Toolchain */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  MR
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Clean Monorepo Layout</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Strict separation across apps/web, apps/backend, automation/n8n, docs, and scripts.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-mono text-slate-600">
                <span>Phase: 1 of 8</span>
                <span>Status: Validated</span>
              </div>
            </div>
          </div>

          {/* Quick API Verification Banner */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Phase 1 Foundation Setup Verified
              </h4>
              <p className="text-xs text-slate-500">
                Both services are configured with health-check endpoints, strict environment validation, and unified styling.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="http://localhost:8000/api/v1/docs"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-sm"
              >
                Inspect OpenAPI Docs
              </a>
              <a
                href="http://localhost:8000/api/v1/health"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-medium rounded-lg bg-[#0B132B] text-white hover:bg-[#1C2541] transition shadow-sm"
              >
                Test Backend Health
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

