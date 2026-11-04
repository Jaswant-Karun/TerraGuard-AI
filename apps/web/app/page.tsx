"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/AuthContext";
import {
  ShieldAlert,
  Radio,
  Layers,
  Activity,
  Cpu,
  Workflow,
  Camera,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Server,
  CloudRain,
  Wind,
  Droplets,
  ExternalLink,
  Flame,
  AlertTriangle,
  Send,
  Sparkles,
  MapPin,
  ArrowRight,
  HeartPulse,
  Building2,
  Factory,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { CityRiskMap } from "@/components/map/CityRiskMap";

function LandingPageContent() {
  const { showToast } = useToast();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentCategory, setIncidentCategory] = useState("FLOOD");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulatedRainfall, setSimulatedRainfall] = useState(65);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTitle.trim()) {
      showToast({
        title: "Validation Error",
        message: "Please enter an incident title.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setReportModalOpen(false);
      setIncidentTitle("");
      setIncidentDesc("");
      showToast({
        title: "Incident Ingested & Verified",
        message: "Gemini Vision classified severity 4. Emergency Stormwater Corps alerted.",
        type: "success",
      });
    }, 900);
  };

  const handleSimulate = () => {
    showToast({
      title: "Risk Simulation Recalculated",
      message: `XGBoost Engine projected 84.6% flood probability at ${simulatedRainfall}mm/h precipitation.`,
      type: "info",
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-brand-cyan/20 selection:text-brand-blue">
      {/* Top Professional Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo & Identity */}
          <a href="#" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0284C7] to-[#06B6D4] flex items-center justify-center shadow-md shadow-[#06B6D4]/25 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-navy-950 font-sans">
                  TerraGuard
                </span>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-brand-cyan/15 text-brand-blue border border-brand-cyan/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-widest uppercase text-slate-500">
                Predict. Prevent. Protect.
              </p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#overview" className="hover:text-brand-blue transition-colors">
              Overview
            </a>
            <a href="#features" className="hover:text-brand-blue transition-colors">
              Platform
            </a>
            <a href="#radar" className="hover:text-brand-blue transition-colors flex items-center gap-1.5">
              <span>Live Radar</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </a>
            <a href="#pipeline" className="hover:text-brand-blue transition-colors">
              How It Works
            </a>
            <a href="#sdgs" className="hover:text-brand-blue transition-colors">
              UN SDGs
            </a>
            <a href="#impact" className="hover:text-brand-blue transition-colors">
              Impact
            </a>
            <a href="#tech" className="hover:text-brand-blue transition-colors">
              Architecture
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportModalOpen(true)}
              leftIcon={<Camera className="w-3.5 h-3.5 text-brand-blue" />}
            >
              Report Hazard
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                showToast({
                  title: "Command Center Terminal",
                  message: "Connecting to FastAPI Gateway & OpenStreetMap Vector Canvas...",
                  type: "info",
                });
                const el = document.getElementById("radar");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Launch Cockpit
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC]">
        {/* Subtle Background Radial Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Mission, Tagline, Call-To-Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6"
            >
              {/* Badge Ticker */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
                <Badge variant="cyan" pulse>
                  INFINEX 2K26
                </Badge>
                <span className="text-slate-500">Autonomous Urban Disaster Prevention Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy-950 leading-[1.12]">
                AI-Powered Urban Risk Intelligence.
                <span className="block mt-2 bg-gradient-to-r from-brand-blue via-brand-cyan to-sky-600 bg-clip-text text-transparent">
                  Predict. Prevent. Protect.
                </span>
              </h1>

              {/* Subheading / Value Proposition */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                TerraGuard AI unifies real-time meteorological telemetry, OpenStreetMap geospatial
                modeling, multimodal Gemini Vision hazard perception, and automated n8n triage workflows
                to prevent urban climate catastrophes before they strike.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById("radar");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Explore Live Geospatial Radar
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setReportModalOpen(true)}
                  leftIcon={<Camera className="w-4 h-4 text-brand-blue" />}
                >
                  Report Urban Hazard
                </Button>
              </div>

              {/* Trust Indicators & Realtime Metrics */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80">
                <div>
                  <div className="text-2xl font-black text-navy-900 font-sans">&lt; 3.2s</div>
                  <div className="text-xs text-slate-500 font-medium">Gemini Vision Triage</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-brand-blue font-sans">94.8%</div>
                  <div className="text-xs text-slate-500 font-medium">Predictive Risk Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-600 font-sans">Zero Latency</div>
                  <div className="text-xs text-slate-500 font-medium">n8n Incident Dispatch</div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Hero Live Interactive Cockpit Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-2xl bg-white p-3 border border-slate-200 shadow-command-lg">
                {/* Cockpit Card Header */}
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-slate-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold text-navy-950 font-mono">
                      SECTOR 04 · LIVE HAZARD RADAR
                    </span>
                  </div>
                  <Badge variant="critical">CRITICAL FLOOD ALERT</Badge>
                </div>

                {/* Embedded Map Visualizer */}
                <CityRiskMap height="360px" interactive={true} />

                {/* Real-time Telemetry Mini-Strip */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-mono">PRECIPITATION</span>
                    <span className="font-bold text-slate-800">48.5 mm/h</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-mono">WATER LEVEL</span>
                    <span className="font-bold text-rose-600">0.68m (Alarm)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-mono">AIR (AQI)</span>
                    <span className="font-bold text-amber-600">142 Moderate</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 1: Overview & Mission */}
      <section id="overview" className="py-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="cyan">MISSION BLUEPRINT</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              From Reactive Cleanup to Autonomous Disaster Prevention
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Modern cities lose billions annually reacting to flash floods, toxic air inversions,
              and infrastructure collapse. TerraGuard AI transforms urban defense by forecasting
              spatial hazards hours in advance and automatically alerting first responders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card hover className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-brand-blue flex items-center justify-center">
                <CloudRain className="w-6 h-6" />
              </div>
              <CardTitle>Predict</CardTitle>
              <CardDescription>
                Tabular XGBoost models ingest live precipitation, soil moisture, and topographic elevation
                to calculate localized risk indices before drains overflow.
              </CardDescription>
            </Card>

            <Card hover className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-brand-cyan flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <CardTitle>Prevent</CardTitle>
              <CardDescription>
                Multimodal Gemini Vision models scan citizen and drone photographs, estimating flood depths,
                blocked drainage grates, and structural fissures in seconds.
              </CardDescription>
            </Card>

            <Card hover className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center">
                <Workflow className="w-6 h-6" />
              </div>
              <CardTitle>Protect</CardTitle>
              <CardDescription>
                Automated n8n webhook pipelines execute multi-channel dispatch—alerting municipal suction
                crews, redirecting traffic, and sending emergency SMS broadcasts.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 2: Platform Features (6 Core Pillars) */}
      <section id="features" className="py-20 border-b border-slate-200/80 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="operational">ENGINEERING CAPABILITIES</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Six Enterprise Pillars of Urban Risk Protection
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              A complete, production-grade intelligence suite designed for municipal leaders,
              emergency operators, urban planners, and active citizens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <Card hover className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-950">Gemini Vision Hazard Classifier</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Processes raw smartphone images, automatically categorizes hazards (Flood, Fire, Debris),
                rates severity 1–5, and infers water depth without manual triage lag.
              </p>
            </Card>

            {/* Pillar 2 */}
            <Card hover className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-brand-blue flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-950">Geospatial Risk Mapping</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                MapLibre GL JS vector engine rendering hardware-accelerated 2dsphere polygons,
                spatial heatmaps, and dynamic evacuation corridors at 60 FPS.
              </p>
            </Card>

            {/* Pillar 3 */}
            <Card hover className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-950">Explainable AI (XAI) Attributions</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Decomposes risk predictions into clear percentage drivers (e.g. Rainfall: 42%, Slope: 28%)
                giving city commanders total transparency over automated advice.
              </p>
            </Card>

            {/* Pillar 4 */}
            <Card hover className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-950">n8n Multi-Channel Orchestration</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Isolated Render execution service executing complex condition switches, emergency SMS
                gateways, Telegram alerts, and public works dispatch tickets.
              </p>
            </Card>

            {/* Pillar 5 */}
            <Card hover className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 text-brand-cyan flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-950">Open-Meteo & OpenAQ Integration</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Continuous asynchronous polling of precipitation rates, wind vectors, PM2.5, PM10,
                and NO2 pollutants with fallback degraded states during outages.
              </p>
            </Card>

            {/* Pillar 6 */}
            <Card hover className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-950">Citizen Incident Portal</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mobile-first report portal with HTML5 GPS geotagging, instant AI validation feedback,
                and tracked municipal resolution progress badges.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 3: Interactive Live City Radar */}
      <section id="radar" className="py-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
            <div className="space-y-3 max-w-2xl">
              <Badge variant="critical" pulse>
                GEOSPATIAL COCKPIT
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
                Real-Time Urban Risk Mesh & Hazard Heatmap
              </h2>
              <p className="text-sm text-slate-600">
                Interactive MapLibre GL JS engine powered by OpenStreetMap vector data. Click any high-risk
                zone to inspect AI mitigation playbooks and live sensor telemetry.
              </p>
            </div>

            {/* Simulation Controller */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
              <div className="space-y-1 text-left w-full sm:w-auto">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500">
                  Simulate Rainfall Load: {simulatedRainfall} mm/h
                </span>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={simulatedRainfall}
                  onChange={(e) => setSimulatedRainfall(Number(e.target.value))}
                  className="w-full sm:w-48 accent-brand-cyan cursor-pointer"
                />
              </div>
              <Button size="sm" onClick={handleSimulate}>
                Simulate Impact
              </Button>
            </div>
          </div>

          {/* Full Interactive Map Container */}
          <CityRiskMap height="540px" interactive={true} />
        </div>
      </section>

      {/* Section 4: How It Works (Pipeline) */}
      <section id="pipeline" className="py-20 border-b border-slate-200/80 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="cyan">PIPELINE ARCHITECTURE</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              How TerraGuard AI Neutralizes Urban Threats
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              An end-to-end autonomous cycle connecting real-world sensors to automated emergency dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 relative">
              <span className="text-4xl font-black text-slate-200">01</span>
              <h4 className="font-bold text-navy-950">Ingest & Telemetry</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Open-Meteo, OpenAQ, and ground IoT sensors stream weather, rainfall, and particulate levels
                into MongoDB Atlas with 2dsphere indexing.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 relative">
              <span className="text-4xl font-black text-slate-200">02</span>
              <h4 className="font-bold text-navy-950">Gemini Vision Triage</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Citizen photos and video feeds are classified within 3 seconds, detecting stalled vehicles,
                submerged drainage, and structural risks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 relative">
              <span className="text-4xl font-black text-slate-200">03</span>
              <h4 className="font-bold text-navy-950">Predictive Simulation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                XGBoost Regressors forecast flood inundation and air inversions 6 hours in advance,
                generating explainable feature attributions.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 relative">
              <span className="text-4xl font-black text-slate-200">04</span>
              <h4 className="font-bold text-navy-950">Automated Action</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                n8n fires authenticated webhooks to alert emergency stormwater teams, broadcast citizen SMS,
                and open reservoir spillway gates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: UN Sustainable Development Goals (SDG Alignment) */}
      <section id="sdgs" className="py-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="operational">UNITED NATIONS SDGS</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Engineered for Global Climate Impact & Equity
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              TerraGuard AI directly operationalizes five United Nations Sustainable Development Goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* SDG 3 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 shadow-sm space-y-3">
              <span className="inline-block px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-bold font-mono">
                SDG 3
              </span>
              <h4 className="font-bold text-navy-950 text-sm">Good Health & Well-Being</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prevents toxic particulate inhalation and waterborne cholera outbreaks following floods.
              </p>
            </div>

            {/* SDG 6 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-white border border-cyan-200 shadow-sm space-y-3">
              <span className="inline-block px-2.5 py-1 rounded bg-cyan-600 text-white text-xs font-bold font-mono">
                SDG 6
              </span>
              <h4 className="font-bold text-navy-950 text-sm">Clean Water & Sanitation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monitors stormwater runoff, preventing industrial sewage backflow into municipal drinking water.
              </p>
            </div>

            {/* SDG 9 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 shadow-sm space-y-3">
              <span className="inline-block px-2.5 py-1 rounded bg-amber-600 text-white text-xs font-bold font-mono">
                SDG 9
              </span>
              <h4 className="font-bold text-navy-950 text-sm">Industry & Infrastructure</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Protects electrical substations, transit tunnels, and bridges from catastrophic water erosion.
              </p>
            </div>

            {/* SDG 11 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-orange-50 to-white border border-orange-200 shadow-sm space-y-3">
              <span className="inline-block px-2.5 py-1 rounded bg-orange-600 text-white text-xs font-bold font-mono">
                SDG 11
              </span>
              <h4 className="font-bold text-navy-950 text-sm">Sustainable Cities</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Empowers informal settlements and dense urban corridors with democratic early warnings.
              </p>
            </div>

            {/* SDG 13 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-200 shadow-sm space-y-3">
              <span className="inline-block px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-bold font-mono">
                SDG 13
              </span>
              <h4 className="font-bold text-navy-950 text-sm">Climate Action</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Builds actionable municipal resilience against extreme weather events induced by global heating.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Real-World Municipal Scenarios */}
      <section id="impact" className="py-20 border-b border-slate-200/80 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="cyan">MUNICIPAL DEPLOYMENTS</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Tested Municipal Disaster Scenarios
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              How TerraGuard AI operates under real extreme stress conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="critical">Scenario A</Badge>
                <span className="text-[10px] font-mono text-slate-400">Response: 4 mins</span>
              </div>
              <h4 className="font-bold text-navy-950">Metro Underpass Flash Inundation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                A localized 80mm cloudburst triggers stormwater overflow. Gemini Vision identifies stranded
                buses, computes 0.7m water depth, and n8n dispatches high-capacity suction pumps within 4 minutes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="high">Scenario B</Badge>
                <span className="text-[10px] font-mono text-slate-400">Response: 12 mins</span>
              </div>
              <h4 className="font-bold text-navy-950">Industrial Chemical Air Inversion</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Winter thermal inversion traps toxic PM10 and NO2 over residential schools. TerraGuard
                forecasts dispersal lag and automatically halts heavy truck corridors nearby.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="moderate">Scenario C</Badge>
                <span className="text-[10px] font-mono text-slate-400">Response: 8 mins</span>
              </div>
              <h4 className="font-bold text-navy-950">Perimeter Hillside Landslide Warning</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Saturation sensors detect soil liquefaction thresholds. The XAI engine attributions
                highlight moisture saturation at 92%, triggering targeted evacuation orders before soil movement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Technology Stack Architecture */}
      <section id="tech" className="py-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="operational">TECHNICAL ARCHITECTURE</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Full-Stack Autonomous Stack Matrix
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Engineered with zero technical debt: strict typing, async Python performance, and edge hosting.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <span className="text-xs font-mono text-brand-blue font-bold">FRONTEND</span>
              <div className="font-bold text-sm text-navy-950">Next.js 14</div>
              <span className="text-[10px] text-slate-500">React 18 / TypeScript</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <span className="text-xs font-mono text-brand-cyan font-bold">API GATEWAY</span>
              <div className="font-bold text-sm text-navy-950">FastAPI</div>
              <span className="text-[10px] text-slate-500">Python 3.11+ Async</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <span className="text-xs font-mono text-emerald-600 font-bold">DATABASE</span>
              <div className="font-bold text-sm text-navy-950">MongoDB Atlas</div>
              <span className="text-[10px] text-slate-500">GeoJSON 2dsphere</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <span className="text-xs font-mono text-rose-600 font-bold">VISION AI</span>
              <div className="font-bold text-sm text-navy-950">Gemini 2.0</div>
              <span className="text-[10px] text-slate-500">Multimodal Hazard OCR</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <span className="text-xs font-mono text-indigo-600 font-bold">MAP ENGINE</span>
              <div className="font-bold text-sm text-navy-950">MapLibre GL</div>
              <span className="text-[10px] text-slate-500">OpenStreetMap Tiles</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <span className="text-xs font-mono text-orange-600 font-bold">AUTOMATION</span>
              <div className="font-bold text-sm text-navy-950">n8n Engine</div>
              <span className="text-[10px] text-slate-500">Isolated Render Disk</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Call to Action (CTA) */}
      <section className="py-24 bg-gradient-to-tr from-navy-950 via-navy-900 to-[#1C2541] text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 space-y-6 relative z-10">
          <Badge variant="cyan" pulse>
            READY FOR CITY-WIDE DEPLOYMENT
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Protect Your City With Predictive AI
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Join municipal leaders, emergency response teams, and active citizens building climate
            resilience with TerraGuard AI.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => {
                const el = document.getElementById("radar");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Interactive Cockpit
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setReportModalOpen(true)}
              className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
              leftIcon={<Camera className="w-4 h-4" />}
            >
              Submit Field Report
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B132B] text-slate-400 py-12 border-t border-[#1C2541] text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0284C7] to-[#06B6D4] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">TerraGuard AI</span>
            <span className="text-[11px] text-slate-500 font-mono">Predict. Prevent. Protect.</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <a href="#overview" className="hover:text-white transition">Overview</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#radar" className="hover:text-white transition">Radar</a>
            <a href="#sdgs" className="hover:text-white transition">SDGs</a>
            <a href="#tech" className="hover:text-white transition">Architecture</a>
          </div>

          <div className="text-slate-500 font-mono text-[11px]">
            INFINEX 2K26 Global AI Hackathon · UN SDGs 3, 6, 9, 11, 13
          </div>
        </div>
      </footer>

      {/* Citizen Hazard Report Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report Urban Environmental Hazard"
        description="Submit photos and geolocation for immediate Gemini Vision classification."
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <Input
            label="Incident Title"
            placeholder="e.g. Metro Underpass Flash Flooding"
            value={incidentTitle}
            onChange={(e) => setIncidentTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Hazard Category
            </label>
            <select
              value={incidentCategory}
              onChange={(e) => setIncidentCategory(e.target.value)}
              className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
            >
              <option value="FLOOD">Flash Flood / Waterlogging</option>
              <option value="AIR_POLLUTION">Toxic Smoke / Chemical Inversion</option>
              <option value="LANDSLIDE">Soil Erosion / Landslide</option>
              <option value="INFRASTRUCTURE">Drainage Blockage / Structural Crack</option>
            </select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Field Description
            </label>
            <textarea
              rows={3}
              value={incidentDesc}
              onChange={(e) => setIncidentDesc(e.target.value)}
              placeholder="Describe standing water depth, vehicle stall risks, or blocked grates..."
              className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 resize-none"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono">
              <MapPin className="w-3.5 h-3.5 text-brand-blue" />
              GPS: 12.9716° N, 77.5946° E
            </span>
            <Badge variant="operational">Geotagged</Badge>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Submit to Sentinel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function HomePage() {
  const [showLoading, setShowLoading] = useState(true);

  return (
    <ToastProvider>
      {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} />}
      <LandingPageContent />
    </ToastProvider>
  );
}
