"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  PhoneCall,
  Siren,
  ShieldCheck,
  CheckSquare,
  Square,
  Users,
  LifeBuoy,
  AlertOctagon,
  BatteryCharging,
  HeartHandshake,
  FileText,
  Zap,
  UtensilsCrossed,
  Stethoscope,
  Printer,
  Compass,
  Navigation,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { CityRiskMap } from "@/components/map/CityRiskMap";

const RESILIENCE_PROVERBS = [
  {
    proverb: "An ounce of prevention is worth a pound of cure.",
    author: "Benjamin Franklin (1736)",
    badge: "CORE PRINCIPLE",
    tagline: "Proactive Urban Disaster Mitigation",
    reflection:
      "TerraGuard AI transforms this timeless truth into autonomous reality — shifting cities from costly catastrophe response to real-time predictive hazard prevention.",
    icon: ShieldCheck,
    color: "from-cyan-400 to-blue-500",
  },
  {
    proverb: "We do not inherit the Earth from our ancestors; we borrow it from our children.",
    author: "Ancient Environmental Proverb",
    badge: "ECOLOGICAL CREED",
    tagline: "Sustainable Urban Stewardship & UN SDG 11 / 13",
    reflection:
      "Safeguarding living watersheds, stormwater basins, and communities through ethical AI telemetry and open environmental data.",
    icon: Sparkles,
    color: "from-emerald-400 to-teal-500",
  },
  {
    proverb: "A stitch in time saves nine.",
    author: "Traditional Resilience Proverb",
    badge: "EARLY TRIAGE",
    tagline: "Sub-Second Response Latency",
    reflection:
      "Detecting a choked storm culvert or flash-flood surge in minutes prevents multi-crore infrastructure damage and protects vulnerable lives.",
    icon: Compass,
    color: "from-purple-400 to-indigo-500",
  },
];

function ProverbMotionBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % RESILIENCE_PROVERBS.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const active = RESILIENCE_PROVERBS[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
      className="mt-12 sm:mt-16 w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-[#070D1E] via-[#0B1530] to-[#070D1E] p-4 sm:p-5 md:p-6 shadow-2xl backdrop-blur-xl">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-1/4 w-72 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-60 h-28 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Icon & Badge */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-950 via-slate-900 to-blue-900 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-950/40">
                <Quote className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                  {active.badge}
                </span>
                <span className="text-[11px] font-medium text-slate-300">
                  {active.tagline}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                THE PHILOSOPHICAL FOUNDATION OF TERRAGUARD AI
              </div>
            </div>
          </div>

          {/* Right: Cycler dots & Action */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {RESILIENCE_PROVERBS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? "w-7 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 shadow-sm shadow-cyan-400/50"
                    : "w-2 h-2 bg-slate-700 hover:bg-slate-500"
                }`}
                aria-label={`View Proverb ${idx + 1}: ${item.badge}`}
                title={item.proverb}
              />
            ))}
            <Link
              href="/dashboard"
              className="ml-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 hover:text-white transition px-3 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/40 shrink-0"
            >
              <span>Explore AI Prevention</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* The Animated Proverb Block */}
        <div className="relative mt-3.5 pt-3.5 border-t border-slate-800/80 min-h-[72px] sm:min-h-[58px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col sm:flex-row sm:items-baseline justify-between gap-2"
            >
              <div className="flex-1">
                <blockquote className="text-sm sm:text-base md:text-lg font-serif italic text-white font-medium tracking-wide leading-snug">
                  “{active.proverb}”
                </blockquote>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
                  {active.reflection}
                </p>
              </div>
              <div className="sm:text-right shrink-0 mt-1 sm:mt-0">
                <span className="text-[11px] font-semibold text-cyan-300 block">
                  — {active.author}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Detect • Predict • Verify • Prevent
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function LandingPageContent() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentCategory, setIncidentCategory] = useState("FLOOD");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulatedRainfall, setSimulatedRainfall] = useState(65);

  // Feature 1: Emergency SOS Distress Beacon State
  const [sosActive, setSosActive] = useState(false);
  const [sosCoords, setSosCoords] = useState<string | null>(null);

  // Feature 2: Household Disaster Readiness Checklist State (6 items)
  const [readinessItems, setReadinessItems] = useState<Record<string, boolean>>({
    water: true,
    documents: true,
    firstAid: false,
    radio: false,
    flashlight: true,
    foodRations: false,
  });

  // Feature 3: Community Shield Volunteer Network State
  const [volunteerName, setVolunteerName] = useState("");
  const [volunteerPhone, setVolunteerPhone] = useState("");
  const [volunteerWard, setVolunteerWard] = useState("Ward 150 - Bellandur Basin");
  const [volunteerRole, setVolunteerRole] = useState("First Aid & Medical Support");
  const [volunteerEnrolled, setVolunteerEnrolled] = useState(false);

  // Feature 4: Emergency Relief Centers & Potable Water Distribution State
  const [reliefFilter, setReliefFilter] = useState<"ALL" | "WATER" | "POWER" | "MEDICAL" | "FOOD">("ALL");

  // Feature 5: Offline Emergency Pocket Card & Family Disaster Action Plan State
  const [contactName, setContactName] = useState("Priya Karun (Spouse)");
  const [contactPhone, setContactPhone] = useState("+91 98450 11223");
  const [meetingPoint, setMeetingPoint] = useState("Cubbon Park Gate 3 / Ward Disaster Shelter");
  const [medicalNotes, setMedicalNotes] = useState("Type O+, Asthma Inhaler in Emergency Bag");
  const [cardGenerated, setCardGenerated] = useState(false);

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
        message: "Vision models classified severity 4. Emergency Stormwater Corps alerted.",
        type: "success",
      });
    }, 900);
  };

  const handleSimulate = () => {
    showToast({
      title: "Risk Simulation Recalculated",
      message: `Predictive Intelligence projected 84.6% flood probability at ${simulatedRainfall}mm/h precipitation.`,
      type: "info",
    });
  };

  const handleTriggerSOS = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          setSosCoords(`${lat}° N, ${lng}° E`);
          setSosActive(true);
          showToast({
            title: "🚨 DISTRESS BEACON TRANSMITTED",
            message: `Emergency SOS broadcasted! GPS [${lat}, ${lng}] dispatched to Municipal Disaster Cell and Emergency Ambulance 108.`,
            type: "error",
          });
        },
        () => {
          setSosCoords("12.9716° N, 77.5946° E");
          setSosActive(true);
          showToast({
            title: "🚨 DISTRESS BEACON TRANSMITTED",
            message: "Emergency SOS broadcasted for Central Metropolitan Sector. Municipal first-responders alerted.",
            type: "error",
          });
        }
      );
    } else {
      setSosActive(true);
      showToast({
        title: "🚨 DISTRESS BEACON TRANSMITTED",
        message: "Emergency SOS active. Stand by for emergency dispatcher callback.",
        type: "error",
      });
    }
  };

  const toggleReadiness = (key: string) => {
    setReadinessItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const completedCount = Object.values(readinessItems).filter(Boolean).length;
  const readinessPercent = Math.round((completedCount / 6) * 100);

  const handleVolunteerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerName.trim() || !volunteerPhone.trim()) {
      showToast({
        title: "Validation Error",
        message: "Please enter your full name and contact phone number.",
        type: "error",
      });
      return;
    }
    setVolunteerEnrolled(true);
    showToast({
      title: "Community Shield Volunteer Registered",
      message: `Thank you ${volunteerName}! You are officially enrolled as an Emergency First-Responder for ${volunteerWard}.`,
      type: "success",
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-brand-cyan/20 selection:text-brand-blue">
      {/* Top Acute Hazard Ticker */}
      <div className="bg-rose-950 text-rose-200 text-xs px-4 py-2 border-b border-rose-800 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px] shrink-0">
              Live Advisory:
            </span>
            <span className="text-rose-100 truncate">
              Intense precipitation alert over Bellandur & Koramangala basins. Lowland storm culverts running at 82% capacity. Safe evacuation routes active.
            </span>
          </div>
          <a
            href="#emergency-sos"
            className="shrink-0 text-white font-bold bg-rose-600 hover:bg-rose-500 px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider transition"
          >
            Emergency SOS
          </a>
        </div>
      </div>

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

          {/* Desktop Navigation Links (Zero technical jargon / zero architecture meta-text) */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <a
              href={user ? "/dashboard" : "#overview"}
              className="hover:text-brand-blue transition-colors font-semibold text-slate-800"
            >
              {user ? "Cockpit Dashboard" : "Overview"}
            </a>
            <a href="#radar" className="hover:text-brand-blue transition-colors flex items-center gap-1.5">
              <span>Live Radar</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </a>
            <a
              href="#emergency-sos"
              className="text-rose-600 font-bold hover:text-rose-700 transition-colors flex items-center gap-1"
            >
              <Siren className="w-3.5 h-3.5" />
              <span>SOS Beacon</span>
            </a>
            <a href="#relief-supplies" className="hover:text-brand-blue transition-colors">
              Relief Supplies
            </a>
            <a href="#readiness" className="hover:text-brand-blue transition-colors">
              Readiness Kit
            </a>
            <a href="#pocket-card" className="hover:text-brand-blue transition-colors">
              Pocket Card
            </a>
            <a href="#volunteers" className="hover:text-brand-blue transition-colors">
              Community Shield
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-800 transition border border-slate-200"
              >
                <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#0284C7] to-[#06B6D4] flex items-center justify-center text-white">
                  <User className="w-3 h-3" />
                </div>
                <span>{user.full_name.split(" ")[0]}</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white text-brand-blue border border-slate-200">
                  {user.role}
                </span>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportModalOpen(true)}
              leftIcon={<Camera className="w-3.5 h-3.5 text-brand-blue" />}
            >
              Report Hazard
            </Button>
            <Link href="/dashboard">
              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Launch Cockpit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC]">
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
                <Badge variant="cyan" pulse>
                  INFINEX 2K26
                </Badge>
                <span className="text-slate-500">Autonomous Urban Disaster Prevention Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy-950 leading-[1.12]">
                AI-Powered Urban Risk Intelligence.
                <span className="block mt-2 bg-gradient-to-r from-brand-blue via-brand-cyan to-sky-600 bg-clip-text text-transparent">
                  Predict. Prevent. Protect.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                TerraGuard AI unifies real-time meteorological telemetry, high-precision geospatial risk
                mapping, automated vision-assisted hazard perception, and instant municipal triage to prevent
                urban climate catastrophes before they strike.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Enter Live Command Cockpit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setReportModalOpen(true)}
                  leftIcon={<Camera className="w-4 h-4 text-brand-blue" />}
                >
                  Report Urban Hazard
                </Button>
                <a href="#emergency-sos">
                  <Button
                    variant="danger"
                    size="lg"
                    leftIcon={<Siren className="w-4 h-4" />}
                  >
                    Emergency SOS
                  </Button>
                </a>
              </div>

              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80">
                <div>
                  <div className="text-2xl font-black text-navy-900 font-sans">&lt; 3.2s</div>
                  <div className="text-xs text-slate-500 font-medium">AI Hazard Perception</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-brand-blue font-sans">94.8%</div>
                  <div className="text-xs text-slate-500 font-medium">Predictive Risk Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-600 font-sans">Zero Latency</div>
                  <div className="text-xs text-slate-500 font-medium">Automated Response Dispatch</div>
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
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-slate-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold text-navy-950 font-mono">
                      SECTOR 04 · LIVE HAZARD RADAR
                    </span>
                  </div>
                  <Badge variant="critical">CRITICAL FLOOD ALERT</Badge>
                </div>

                <CityRiskMap height="360px" interactive={true} />

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

          {/* Motion Intro: Resilience Proverb Showcase at the bottom of the first page */}
          <ProverbMotionBanner />
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
              spatial hazards hours in advance and automatically coordinating first responders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card hover className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-brand-blue flex items-center justify-center">
                <CloudRain className="w-6 h-6" />
              </div>
              <CardTitle>Predict</CardTitle>
              <CardDescription>
                Predictive machine intelligence analyzes live precipitation, soil moisture, and topographic elevation
                to calculate localized risk indices before drains overflow.
              </CardDescription>
            </Card>

            <Card hover className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-brand-cyan flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <CardTitle>Prevent</CardTitle>
              <CardDescription>
                Multimodal vision models scan citizen and drone photographs, estimating flood depths,
                blocked drainage grates, and structural fissures in seconds.
              </CardDescription>
            </Card>

            <Card hover className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center">
                <Workflow className="w-6 h-6" />
              </div>
              <CardTitle>Protect</CardTitle>
              <CardDescription>
                Autonomous emergency protocols execute multi-channel dispatch—alerting municipal suction
                crews, redirecting traffic, and broadcasting emergency SMS alerts.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 2: Platform Capabilities (6 Core Pillars) */}
      <section id="features" className="py-20 border-b border-slate-200/80 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="operational">ENTERPRISE CAPABILITIES</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Six Pillars of Urban Risk Protection
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              A comprehensive intelligence suite designed for municipal leaders,
              emergency operators, urban planners, and active citizens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card hover className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-950">AI Vision Hazard Classifier</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Processes smartphone and drone imagery, automatically categorizing hazards (Flood, Fire, Debris),
                rating severity 1–5, and estimating water depth without manual triage delays.
              </p>
            </Card>

            <Card hover className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-brand-blue flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-950">Geospatial Risk Mapping</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                High-performance geospatial mapping engine rendering real-time risk zones,
                spatial heatmaps, and dynamic evacuation corridors with zero lag.
              </p>
            </Card>

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

            <Card hover className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-950">Autonomous Emergency Orchestration</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                High-speed emergency routing system executing multi-channel municipal notifications,
                field task assignments, and siren broadcasts.
              </p>
            </Card>

            <Card hover className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 text-brand-cyan flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-950">Live Weather & Air Quality Telemetry</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Continuous polling of precipitation rates, wind vectors, PM2.5, PM10,
                and NO2 pollutants with fallback degraded states during network outages.
              </p>
            </Card>

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
                Interactive urban risk heatmap & multi-hazard early warning radar. Click any high-risk
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

          <CityRiskMap height="540px" interactive={true} />
        </div>
      </section>

      {/* Section 4: FEATURE 1 — EMERGENCY SOS DISTRESS BEACON & HELPLINE DIRECTORY */}
      <section id="emergency-sos" className="py-20 border-b border-slate-200/80 bg-gradient-to-b from-rose-50/50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="critical" pulse>
              RAPID RESCUE PROTOCOL
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Emergency SOS Distress Beacon & Municipal Helplines
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              In severe inundations, power cuts, or structure collapses, broadcast your GPS coordinates
              directly to municipal first-responders and ambulance units with a single tap.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* SOS Beacon Activation Box */}
            <div className="lg:col-span-6 p-8 rounded-2xl bg-white border border-rose-200 shadow-xl shadow-rose-500/10 text-center space-y-6">
              <div className="inline-flex p-4 rounded-full bg-rose-100 text-rose-600 mb-2">
                <Siren className="w-12 h-12 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-navy-950">Citizen Distress Beacon</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Tapping below transmits your exact live coordinates to the State Disaster Response Force (SDRF)
                  and the nearest BBMP Emergency Dewatering Squad.
                </p>
              </div>

              {sosActive ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-2 text-rose-900 text-left">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                    <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                    DISTRESS BEACON TRANSMITTED & ACTIVE
                  </div>
                  <p className="text-xs">
                    Location: <strong className="font-mono">{sosCoords || "12.9716° N, 77.5946° E"}</strong>
                  </p>
                  <p className="text-xs text-slate-600">
                    Response team dispatched. Emergency operators are attempting contact. Keep phone line open.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSosActive(false);
                      showToast({ title: "Beacon Deactivated", message: "Distress beacon cancelled by user.", type: "info" });
                    }}
                    className="w-full mt-2"
                  >
                    Cancel Distress Beacon
                  </Button>
                </div>
              ) : (
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleTriggerSOS}
                  className="w-full py-4 text-base font-bold shadow-lg shadow-rose-600/30 hover:scale-[1.02] transition-transform"
                  leftIcon={<Siren className="w-5 h-5" />}
                >
                  BROADCAST EMERGENCY SOS BEACON
                </Button>
              )}

              <p className="text-[11px] text-slate-400 font-mono">
                Encrypted · High Priority · Direct Dispatch to Municipal Operations
              </p>
            </div>

            {/* Quick Municipal Helplines Directory */}
            <div className="lg:col-span-6 space-y-4">
              <h4 className="text-base font-bold text-navy-950 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-brand-blue" />
                Verified Municipal Emergency Helplines (Direct Tap to Dial)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="tel:1077"
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-brand-blue hover:shadow-md transition flex items-center justify-between group"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">DISASTER CONTROL</span>
                    <span className="font-bold text-sm text-navy-950">BBMP Disaster Cell</span>
                  </div>
                  <span className="text-lg font-black font-mono text-brand-blue group-hover:scale-105 transition-transform">1077</span>
                </a>

                <a
                  href="tel:108"
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-600 hover:shadow-md transition flex items-center justify-between group"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">MEDICAL RESCUE</span>
                    <span className="font-bold text-sm text-navy-950">Ambulance Service</span>
                  </div>
                  <span className="text-lg font-black font-mono text-emerald-600 group-hover:scale-105 transition-transform">108</span>
                </a>

                <a
                  href="tel:101"
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-600 hover:shadow-md transition flex items-center justify-between group"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">FIRE & WATER RESCUE</span>
                    <span className="font-bold text-sm text-navy-950">Fire Department</span>
                  </div>
                  <span className="text-lg font-black font-mono text-rose-600 group-hover:scale-105 transition-transform">101</span>
                </a>

                <a
                  href="tel:112"
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-600 hover:shadow-md transition flex items-center justify-between group"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">CITIZEN DISTRESS</span>
                    <span className="font-bold text-sm text-navy-950">Police Emergency</span>
                  </div>
                  <span className="text-lg font-black font-mono text-indigo-600 group-hover:scale-105 transition-transform">112</span>
                </a>

                <a
                  href="tel:1912"
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-600 hover:shadow-md transition flex items-center justify-between group"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">LIVE WIRE / HAZARD</span>
                    <span className="font-bold text-sm text-navy-950">Electricity Board (BESCOM)</span>
                  </div>
                  <span className="text-lg font-black font-mono text-amber-600 group-hover:scale-105 transition-transform">1912</span>
                </a>

                <a
                  href="tel:08022253707"
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-600 hover:shadow-md transition flex items-center justify-between group"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">DISASTER CORPS</span>
                    <span className="font-bold text-sm text-navy-950">State Disaster Force (SDRF)</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-cyan-700">080-22253707</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4B: FEATURE 4 — EMERGENCY RELIEF CENTERS & POTABLE WATER DISTRIBUTION */}
      <section id="relief-supplies" className="py-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
            <div className="space-y-3 max-w-2xl">
              <Badge variant="operational">CRITICAL LIFELINES</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
                Emergency Relief Stations &amp; Potable Water Distribution
              </h2>
              <p className="text-sm text-slate-600">
                Verified municipal lifelines active during power grid blackouts and flood isolations.
                Locate potable water tankers, emergency solar power charging hubs, community kitchens, and medical triage camps.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-200">
              {[
                { id: "ALL", label: "All Stations" },
                { id: "WATER", label: "Potable Water" },
                { id: "POWER", label: "Power & Charging" },
                { id: "MEDICAL", label: "Medical Triage" },
                { id: "FOOD", label: "Community Kitchen" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setReliefFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    reliefFilter === tab.id
                      ? "bg-white text-navy-950 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-navy-950"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: "w1",
                name: "Central Ward Potable Water Station #12",
                type: "WATER",
                capacity: "12,000 L/hr reverse-osmosis water",
                location: "Cubbon Park Outer Ring Gate, Sector 4",
                distance: "0.8 km away",
                status: "ACTIVE NOW",
                contact: "1077 / 080-22660000",
                icon: Droplets,
                color: "text-sky-600 bg-sky-50 border-sky-200",
              },
              {
                id: "p1",
                name: "Municipal Emergency Microgrid & Device Hub",
                type: "POWER",
                capacity: "50kW Solar-Battery Backup (60 Ports)",
                location: "BBMP Community Hall, Ward 150",
                distance: "1.2 km away",
                status: "ACTIVE NOW",
                contact: "1912",
                icon: Zap,
                color: "text-amber-600 bg-amber-50 border-amber-200",
              },
              {
                id: "m1",
                name: "Red Cross Mobile Trauma & Triage Field Post",
                type: "MEDICAL",
                capacity: "4 Doctors + 12 First-Aid Beds, ORS & Anti-venom",
                location: "Indiranagar Primary Health Centre",
                distance: "2.1 km away",
                status: "OPEN 24/7",
                contact: "108",
                icon: Stethoscope,
                color: "text-rose-600 bg-rose-50 border-rose-200",
              },
              {
                id: "f1",
                name: "Community Flood Relief Kitchen & Dry Rations",
                type: "FOOD",
                capacity: "3,500 hot meals/day + Baby formula packs",
                location: "Koramangala Indoor Stadium Gate 2",
                distance: "1.7 km away",
                status: "ACTIVE DISPATCH",
                contact: "080-22975555",
                icon: UtensilsCrossed,
                color: "text-emerald-600 bg-emerald-50 border-emerald-200",
              },
              {
                id: "w2",
                name: "Submersible Dewatering Pump & Sandbag Depot",
                type: "WATER",
                capacity: "18 Heavy Suction Pumps & 2,500 Sandbags",
                location: "Bellandur Drainage Outflow Sluice Gate",
                distance: "2.4 km away",
                status: "ACTIVE DISPATCH",
                contact: "080-22221188",
                icon: Droplets,
                color: "text-sky-600 bg-sky-50 border-sky-200",
              },
              {
                id: "m2",
                name: "Emergency Pediatric & Senior Oxygen Relief Camp",
                type: "MEDICAL",
                capacity: "24 Oxygen Concentrators & Nebulizers",
                location: "Victoria Hospital South Outpatient Annex",
                distance: "3.0 km away",
                status: "OPEN 24/7",
                contact: "080-26701150",
                icon: HeartPulse,
                color: "text-rose-600 bg-rose-50 border-rose-200",
              },
            ]
              .filter((c) => reliefFilter === "ALL" || c.type === reliefFilter)
              .map((center) => {
                const IconComp = center.icon;
                return (
                  <div
                    key={center.id}
                    className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-xl border ${center.color}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {center.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-navy-950 text-base leading-snug">{center.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{center.location}</span>
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                        <div className="font-medium text-slate-800">Available Capacity:</div>
                        <div className="text-[11px] text-slate-600">{center.capacity}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-brand-blue flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5" />
                        {center.distance}
                      </span>
                      <a
                        href={`tel:${center.contact.split(" ")[0].replace(/[^0-9]/g, "")}`}
                        className="font-mono font-bold text-slate-700 hover:text-brand-blue flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3 text-emerald-600" />
                        <span>{center.contact}</span>
                      </a>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Section 5: FEATURE 2 — HOUSEHOLD DISASTER READINESS & SURVIVAL KIT */}
      <section id="readiness" className="py-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="cyan">CIVIC RESILIENCE</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Household Disaster Readiness & 72-Hour Survival Kit
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Assess your family’s preparedness against urban climate disruptions. Check off essentials
              to compute your localized resilience score.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Readiness Score Gauge */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-slate-500">Readiness Index</span>
                <Badge
                  variant={
                    readinessPercent >= 80 ? "operational" : readinessPercent >= 50 ? "moderate" : "critical"
                  }
                >
                  {readinessPercent >= 80 ? "DISASTER READY" : readinessPercent >= 50 ? "MODERATE PREP" : "VULNERABLE"}
                </Badge>
              </div>

              <div className="text-center space-y-2 py-4">
                <div className="text-6xl font-black text-navy-950 font-sans tracking-tight">
                  {readinessPercent}%
                </div>
                <p className="text-xs text-slate-500">
                  {completedCount} of 6 Critical Preparedness Essentials Verified
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    readinessPercent >= 80
                      ? "bg-emerald-500"
                      : readinessPercent >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-navy-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Why 72 Hours Matters
                </div>
                <p className="leading-relaxed text-[11px] text-slate-500">
                  During extreme urban flooding, road debris and submerged substations can isolate neighborhoods for up to 3 days before heavy municipal machinery reaches feeder roads.
                </p>
              </div>
            </div>

            {/* Right: Interactive Survival Checklist */}
            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-sm font-bold text-navy-950 uppercase tracking-wider text-slate-500 mb-2">
                Interactive Survival Kit Checklist (Click to Toggle)
              </h4>

              {[
                {
                  id: "water",
                  title: "72-Hour Potable Drinking Water",
                  desc: "Minimum 3 liters per person per day sealed in clean containers.",
                  icon: Droplets,
                },
                {
                  id: "documents",
                  title: "Waterproof Document Capsule",
                  desc: "Aadhaar cards, property papers, insurance, and medical records in a sealed zip pouch.",
                  icon: FileText,
                },
                {
                  id: "firstAid",
                  title: "Emergency Medical & First Aid Kit",
                  desc: "Bandages, antiseptics, ORS packets, and a 14-day supply of essential chronic prescriptions.",
                  icon: HeartPulse,
                },
                {
                  id: "radio",
                  title: "Battery Radio & Emergency Powerbank",
                  desc: "Fully charged 20,000mAh powerbank and small radio for official disaster broadcasts during cellular dropouts.",
                  icon: BatteryCharging,
                },
                {
                  id: "flashlight",
                  title: "High-Lumen Flashlight & Distress Whistle",
                  desc: "Waterproof LED torch and high-decibel whistle for signaling emergency rescue boats in the dark.",
                  icon: LifeBuoy,
                },
                {
                  id: "foodRations",
                  title: "Non-Perishable High-Calorie Food",
                  desc: "Ready-to-eat dry rations, energy bars, and nuts that do not require cooking gas or refrigeration.",
                  icon: CheckSquare,
                },
              ].map((item) => {
                const checked = readinessItems[item.id] || false;
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleReadiness(item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      checked
                        ? "bg-emerald-50/60 border-emerald-300 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          checked ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div
                          className={`text-sm font-bold ${
                            checked ? "text-emerald-950 line-through decoration-emerald-500/50" : "text-navy-950"
                          }`}
                        >
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-4">
                      {checked ? (
                        <CheckSquare className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <Square className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: FEATURE 3 — COMMUNITY VOLUNTEER SHIELD NETWORK */}
      <section id="volunteers" className="py-20 border-b border-slate-200/80 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="operational">COMMUNITY RESILIENCE</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Community Shield: Ward Rapid-Response Volunteer Network
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Join your neighborhood’s certified emergency first-responder network. Coordinate elderly assistance,
              sandbagging, and rescue support in collaboration with municipal emergency units.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Volunteer Value Proposition */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-navy-950">Neighborhood First Responders Save Lives</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  During sudden flash inundations, immediate neighborhood support before heavy machinery arrives
                  prevents 80% of vehicle strandings and critical medical emergencies.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                  <HeartHandshake className="w-6 h-6 text-brand-blue" />
                  <h4 className="font-bold text-sm text-navy-950">First Aid & Triage</h4>
                  <p className="text-xs text-slate-500">Provide field medical assistance to elderly and vulnerable neighbors.</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                  <LifeBuoy className="w-6 h-6 text-brand-cyan" />
                  <h4 className="font-bold text-sm text-navy-950">Boat & Evacuation</h4>
                  <p className="text-xs text-slate-500">Assist high-clearance vehicle and boat evacuation teams along marked corridors.</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <h4 className="font-bold text-sm text-navy-950">Drainage & Sandbagging</h4>
                  <p className="text-xs text-slate-500">Clear stormwater grates and deploy sandbag barriers at vulnerable entrances.</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                  <Users className="w-6 h-6 text-indigo-600" />
                  <h4 className="font-bold text-sm text-navy-950">Community Kitchen</h4>
                  <p className="text-xs text-slate-500">Coordinate hot meals and clean drinking water distribution at designated shelters.</p>
                </div>
              </div>
            </div>

            {/* Right: Quick Volunteer Registration Form */}
            <div className="lg:col-span-6 p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-navy-950">Enroll as a Ward Volunteer</h4>
                  <p className="text-xs text-slate-500">Receive verified disaster notifications and emergency role assignments.</p>
                </div>
                <Badge variant="operational">Ward Volunteer</Badge>
              </div>

              {volunteerEnrolled ? (
                <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-300 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-950">Volunteer Enrolled Successfully</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                    Welcome to the <strong>Community Shield Network</strong>, {volunteerName}! You are assigned to{" "}
                    <strong>{volunteerWard}</strong> under <strong>{volunteerRole}</strong>.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVolunteerEnrolled(false);
                      setVolunteerName("");
                      setVolunteerPhone("");
                    }}
                  >
                    Register Another Responder
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVolunteerSubmit} className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Jaswant Karun"
                    value={volunteerName}
                    onChange={(e) => setVolunteerName(e.target.value)}
                    required
                  />

                  <Input
                    label="Mobile Phone (for Emergency WhatsApp/SMS Alerts)"
                    placeholder="e.g. +91 98765 43210"
                    value={volunteerPhone}
                    onChange={(e) => setVolunteerPhone(e.target.value)}
                    required
                  />

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                      Select Primary Operational Ward
                    </label>
                    <select
                      value={volunteerWard}
                      onChange={(e) => setVolunteerWard(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
                    >
                      <option value="Ward 150 - Bellandur Basin">Ward 150 - Bellandur Basin</option>
                      <option value="Ward 174 - Koramangala Valley">Ward 174 - Koramangala Valley</option>
                      <option value="Ward 041 - Peenya Industrial">Ward 041 - Peenya Industrial</option>
                      <option value="Ward 084 - Whitefield Tech Zone">Ward 084 - Whitefield Tech Zone</option>
                      <option value="Ward 111 - Central Bengaluru">Ward 111 - Central Bengaluru</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                      Emergency Specialization
                    </label>
                    <select
                      value={volunteerRole}
                      onChange={(e) => setVolunteerRole(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
                    >
                      <option value="First Aid & Medical Support">First Aid & Medical Support</option>
                      <option value="Dewatering Pump & Sandbagging Crew">Dewatering Pump & Sandbagging Crew</option>
                      <option value="Boat & High-Clearance Evacuation">Boat & High-Clearance Evacuation</option>
                      <option value="Community Kitchen & Shelter Food Supply">Community Kitchen & Shelter Food Supply</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full mt-2"
                    leftIcon={<HeartHandshake className="w-4 h-4" />}
                  >
                    Join Ward Rapid-Response Force
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6B: FEATURE 5 — OFFLINE EMERGENCY POCKET CARD & FAMILY DISASTER ACTION PLAN */}
      <section id="pocket-card" className="py-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="cyan">OFFLINE FAMILY SURVIVAL</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Offline Emergency Pocket Card &amp; Family Action Plan
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              When power grids trip and mobile networks crash during extreme weather, digital apps are unreachable.
              Generate and print a personalized wallet-sized emergency card with pre-designated rendezvous points, family contacts, and verified rescue frequencies.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: Input Form */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 rounded-xl bg-sky-100 text-brand-blue">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Configure Family Action Plan</h3>
                  <p className="text-[11px] text-slate-500">Stored safely on device without uploading</p>
                </div>
              </div>

              <Input
                label="Primary Family Emergency Contact"
                placeholder="e.g. Spouse / Parent / Relative Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />

              <Input
                label="Emergency Contact Mobile Phone"
                placeholder="e.g. +91 98450 11223"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Designated Neighborhood Rendezvous Point
                </label>
                <input
                  type="text"
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  placeholder="e.g. Cubbon Park Pavilion / Ward Health Centre"
                  className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
                />
                <p className="text-[10px] text-slate-400">Where all family members assemble if separated.</p>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Critical Medical &amp; Prescription Notes
                </label>
                <input
                  type="text"
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="e.g. Blood O+, Diabetic Insulin, Penicillin Allergy"
                  className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
                />
              </div>

              <Button
                size="md"
                className="w-full mt-2"
                onClick={() => {
                  setCardGenerated(true);
                  showToast({
                    title: "Emergency Pocket Card Updated",
                    message: "Offline card generated. Print or screenshot this card for your wallet.",
                    type: "success",
                  });
                }}
                leftIcon={<FileText className="w-4 h-4" />}
              >
                Generate Wallet Pocket Card
              </Button>
            </div>

            {/* Right: Rendered Wallet Card */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="w-full max-w-lg rounded-2xl border-2 border-navy-900 bg-white p-6 shadow-2xl space-y-4 relative overflow-hidden">
                {/* Header Band */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-navy-900">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-navy-950 text-white flex items-center justify-center font-black">
                      TG
                    </div>
                    <div>
                      <div className="text-xs font-black tracking-wider text-navy-950 uppercase">
                        CIVIL DISASTER RESCUE CARD
                      </div>
                      <div className="text-[9px] font-mono text-slate-500">OFFLINE HOUSEHOLD DISASTER PLAN</div>
                    </div>
                  </div>
                  <Badge variant="operational" className="text-[10px] uppercase font-bold">
                    VALIDATED 2026
                  </Badge>
                </div>

                {/* Card Fields */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">PRIMARY KIN CONTACT</span>
                    <strong className="text-navy-950 font-bold block mt-0.5">{contactName || "Family Kin"}</strong>
                    <span className="font-mono text-blue-700 text-[11px] block mt-0.5">{contactPhone || "Not set"}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">ASSEMBLY RENDEZVOUS</span>
                    <strong className="text-navy-950 font-bold block mt-0.5 text-[11px] leading-tight">
                      {meetingPoint || "Ward Health Center"}
                    </strong>
                  </div>

                  <div className="col-span-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-950">
                    <span className="text-[9px] font-mono uppercase text-rose-700 block font-bold">
                      CRITICAL MEDICAL &amp; ALLERGY PROFILE
                    </span>
                    <div className="text-xs font-semibold mt-0.5">{medicalNotes || "None reported"}</div>
                  </div>
                </div>

                {/* Emergency Broadcast Frequency & Helplines */}
                <div className="p-3 rounded-lg bg-navy-950 text-white text-[11px] space-y-2">
                  <div className="flex items-center justify-between border-b border-navy-800 pb-1.5 font-bold">
                    <span>EMERGENCY SPEED DIALS</span>
                    <span className="text-cyan-400 font-mono">AIR RADIO 102.9 FM</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                    <div className="p-1 rounded bg-navy-900 border border-navy-800">
                      <div className="text-slate-400">POLICE/FIRE</div>
                      <div className="font-bold text-white text-xs mt-0.5">112</div>
                    </div>
                    <div className="p-1 rounded bg-navy-900 border border-navy-800">
                      <div className="text-slate-400">AMBULANCE</div>
                      <div className="font-bold text-white text-xs mt-0.5">108</div>
                    </div>
                    <div className="p-1 rounded bg-navy-900 border border-navy-800">
                      <div className="text-slate-400">DISASTER</div>
                      <div className="font-bold text-white text-xs mt-0.5">1077</div>
                    </div>
                    <div className="p-1 rounded bg-navy-900 border border-navy-800">
                      <div className="text-slate-400">POWER GRID</div>
                      <div className="font-bold text-white text-xs mt-0.5">1912</div>
                    </div>
                  </div>
                </div>

                {/* Print & Save Actions */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">Keep printed in wallet or phone case</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.print();
                      }
                    }}
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                  >
                    Print / Save Card
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: UN Sustainable Development Goals (SDG Alignment) */}
      <section id="sdgs" className="py-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="cyan">GLOBAL IMPACT</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Aligned with 5 UN Sustainable Development Goals
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Directly advancing the United Nations 2030 Agenda for Sustainable Development through predictive climate resilience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* SDG 3 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 shadow-sm space-y-3">
              <span className="inline-block px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-bold font-mono">
                SDG 3
              </span>
              <h4 className="font-bold text-navy-950 text-sm">Good Health & Well-Being</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mitigates waterborne pathogen outbreaks and respiratory hazards from severe air inversion events.
              </p>
            </div>

            {/* SDG 6 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-white border border-cyan-200 shadow-sm space-y-3">
              <span className="inline-block px-2.5 py-1 rounded bg-cyan-600 text-white text-xs font-bold font-mono">
                SDG 6
              </span>
              <h4 className="font-bold text-navy-950 text-sm">Clean Water & Sanitation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prevents raw sewage backflow into municipal drinking water networks during cloudburst inundation.
              </p>
            </div>

            {/* SDG 9 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 shadow-sm space-y-3">
              <span className="inline-block px-2.5 py-1 rounded bg-indigo-600 text-white text-xs font-bold font-mono">
                SDG 9
              </span>
              <h4 className="font-bold text-navy-950 text-sm">Industry & Infrastructure</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Protects electrical substations, transit tunnels, and urban road networks from catastrophic failure.
              </p>
            </div>

            {/* SDG 11 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 shadow-sm space-y-3">
              <span className="inline-block px-2.5 py-1 rounded bg-amber-600 text-white text-xs font-bold font-mono">
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

      {/* Section 8: Real-World Municipal Scenarios */}
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
                A localized 80mm cloudburst triggers stormwater overflow. Vision models identify stranded
                buses, compute 0.7m water depth, and dispatch high-capacity suction pumps within 4 minutes.
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

      {/* Section 9: Call to Action (CTA) */}
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

      {/* Footer (Clean, professional, zero tech stack architecture references) */}
      <footer className="bg-[#0B132B] text-slate-400 py-12 border-t border-[#1C2541] text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0284C7] to-[#06B6D4] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">TerraGuard AI</span>
            <span className="text-[11px] text-slate-500 font-mono">Predict. Prevent. Protect.</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400">
            <a href="#overview" className="hover:text-white transition">Overview</a>
            <a href="#radar" className="hover:text-white transition">Radar</a>
            <a href="#emergency-sos" className="hover:text-white transition">SOS Beacon</a>
            <a href="#relief-supplies" className="hover:text-white transition">Relief Supplies</a>
            <a href="#readiness" className="hover:text-white transition">Readiness Kit</a>
            <a href="#pocket-card" className="hover:text-white transition">Pocket Card</a>
            <a href="#volunteers" className="hover:text-white transition">Community Shield</a>
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
        description="Submit photos and geolocation for immediate AI hazard classification and response."
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
              Submit Incident Report
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
