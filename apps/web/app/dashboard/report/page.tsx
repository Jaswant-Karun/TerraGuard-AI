"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Flame,
  HelpCircle,
  Image as ImageIcon,
  Info,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Trees,
  UploadCloud,
  Waves,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/AuthContext";
import {
  analyzeImagePreview,
  submitHazardReport,
} from "@/services/reports";
import {
  HazardCategory,
  ReportItem,
  VisionAnalysisDTO,
} from "@/types/report";

interface CategoryOption {
  key: HazardCategory;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    key: "WATERLOGGING",
    label: "Waterlogging",
    sublabel: "Standing water, curb submergence, drain backup",
    icon: Waves,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    key: "ROAD_FLOODING",
    label: "Possible Road Flooding",
    sublabel: "Deep or flowing water submerging roadway",
    icon: Compass,
    color: "text-cyan-600 bg-cyan-50 border-cyan-200",
  },
  {
    key: "DAMAGED_ROAD",
    label: "Damaged Roads",
    sublabel: "Potholes, asphalt collapse, fissures, sinkholes",
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    key: "FALLEN_TREE",
    label: "Fallen Trees",
    sublabel: "Downed trunks, broken branches, utility line hazards",
    icon: Trees,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    key: "WASTE_ACCUMULATION",
    label: "Waste Accumulation",
    sublabel: "Garbage choking storm culvert or sidewalk",
    icon: Trash2,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  {
    key: "OTHER",
    label: "Other Hazard",
    sublabel: "Other acute environmental or infrastructure threats",
    icon: HelpCircle,
    color: "text-slate-600 bg-slate-50 border-slate-200",
  },
];

const QUICK_ZONES = [
  { name: "Koramangala 80ft Rd", lat: 12.9352, lng: 77.6245 },
  { name: "Bellandur Lake Basin", lat: 12.9352, lng: 77.6669 },
  { name: "Bengaluru Central (MG Rd)", lat: 12.9716, lng: 77.5946 },
  { name: "Whitefield Corridor", lat: 12.9698, lng: 77.7499 },
];

export default function ReportHazardPage() {
  const { user, token } = useAuth();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<HazardCategory | "AUTO">("AUTO");
  const [severity, setSeverity] = useState<number>(3);
  const [lat, setLat] = useState<string>("12.9352");
  const [lng, setLng] = useState<string>("77.6245");
  const [address, setAddress] = useState<string>(
    "80 Feet Rd, 4th Block, Koramangala, Bengaluru"
  );

  // Media State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // AI & Submission State
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [visionPreview, setVisionPreview] = useState<VisionAnalysisDTO | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<ReportItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Handle Image File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setVisionPreview(null);
    }
  };

  // AI Assistance: Inspect Image Preview with Gemini
  const handleRequestAiAssistance = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select or capture a hazard photo first.");
      return;
    }
    setAnalyzingImage(true);
    setErrorMessage(null);
    try {
      const result = await analyzeImagePreview(
        selectedFile,
        selectedCategory === "AUTO" ? undefined : selectedCategory,
        description || undefined
      );
      setVisionPreview(result);
      if (
        selectedCategory === "AUTO" &&
        result.predicted_category in
          {
            WATERLOGGING: 1,
            ROAD_FLOODING: 1,
            DAMAGED_ROAD: 1,
            FALLEN_TREE: 1,
            WASTE_ACCUMULATION: 1,
            OTHER: 1,
          }
      ) {
        setSelectedCategory(result.predicted_category as HazardCategory);
      }
      if (!title && result.short_description) {
        setTitle(result.short_description.slice(0, 80));
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "AI Vision inspection failed."
      );
    } finally {
      setAnalyzingImage(false);
    }
  };

  // GPS Geolocation with Multi-Tier Fallback
  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your current browser.");
      return;
    }
    setGpsLoading(true);

    const tryAcquire = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(6));
          setLng(pos.coords.longitude.toFixed(6));
          setGpsLoading(false);
          setErrorMessage(null);
        },
        (err) => {
          if (highAccuracy) {
            tryAcquire(false);
          } else {
            setLat("12.9716");
            setLng("77.5946");
            setGpsLoading(false);
            setErrorMessage(
              `GPS timed out (${err.message}). Defaulted to urban sector coordinates [12.9716, 77.5946].`
            );
          }
        },
        {
          timeout: highAccuracy ? 5000 : 8000,
          enableHighAccuracy: highAccuracy,
          maximumAge: 120000,
        }
      );
    };

    tryAcquire(true);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 3) {
      setErrorMessage("Please provide a concise title (at least 3 characters).");
      return;
    }
    if (!description.trim() || description.length < 5) {
      setErrorMessage(
        "Please provide a description of the hazard (at least 5 characters)."
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("lat", lat);
      formData.append("lng", lng);
      formData.append("severity", severity.toString());
      if (address.trim()) formData.append("address", address.trim());
      if (selectedCategory !== "AUTO") {
        formData.append("category", selectedCategory);
      }
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const result = await submitHazardReport(formData, token);
      setSubmittedReport(result);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to submit hazard report. Please check your inputs."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
            title="Return to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Citizen Hazard Reporting Center
                <Badge
                  variant="outline"
                  className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px]"
                >
                  Gemini 2.0 Vision Multimodal
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Report road inundation, potholes, fallen timber, or culvert
                blockages with real-time AI visual inspection
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/map">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Compass className="h-3.5 w-3.5 mr-1 text-cyan-600" />
              View Live Map
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Error Notice:</span> {errorMessage}
            </div>
          </div>
        )}

        {/* Success Confirmation Modal / Card */}
        {submittedReport ? (
          <Card className="border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] mb-1"
                >
                  Report Filed Successfully
                </Badge>
                <h2 className="text-lg font-bold text-slate-900">
                  {submittedReport.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Assigned ID: #{submittedReport.id.slice(0, 12)} • Status:{" "}
                  <span className="font-semibold text-amber-600">
                    {submittedReport.status} (Unverified on Map)
                  </span>
                </p>
              </div>
            </div>

            {/* Potential Duplicate Banner */}
            {submittedReport.is_potential_duplicate && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <Info className="h-4 w-4 text-amber-600" />
                  Duplicate Triage Notice
                </div>
                <p className="text-amber-800 leading-relaxed">
                  {submittedReport.duplicate_metadata?.reason ||
                    "A matching hazard was recently documented nearby. Your submission has been cross-referenced and queued for coordinator review without deleting."}
                </p>
              </div>
            )}

            {/* AI Vision Findings */}
            {submittedReport.ai_analysis && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  AI Vision Multimodal Findings
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-medium">Category:</span>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {submittedReport.category}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-medium">
                      Heuristic Confidence:
                    </span>
                    <div className="font-bold text-cyan-600 mt-0.5">
                      {Math.round(
                        Number(
                          (submittedReport.ai_analysis as VisionAnalysisDTO)
                            ?.confidence_estimate ?? 0.85
                        ) * 100
                      )}
                      % (Uncalibrated)
                    </div>
                  </div>
                </div>

                {Array.isArray(
                  (submittedReport.ai_analysis as VisionAnalysisDTO)
                    ?.safety_precautions
                ) && (
                  <div>
                    <span className="font-semibold text-slate-700">
                      Safety Precautions:
                    </span>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600">
                      {(
                        (submittedReport.ai_analysis as VisionAnalysisDTO)
                          .safety_precautions as string[]
                      ).map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/dashboard/map" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  <Compass className="h-4 w-4 mr-1.5" />
                  View Incident on Live GIS Map
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmittedReport(null);
                  setTitle("");
                  setDescription("");
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setVisionPreview(null);
                }}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                File Another Hazard
              </Button>
            </div>
          </Card>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Photo Upload & AI Vision Assist */}
            <Card className="border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      1. Upload Photographic Evidence
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      JPEG, PNG, or WEBP under 10MB. Magic byte validation &
                      non-executable storage enforced.
                    </p>
                  </div>
                </div>

                {selectedFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRequestAiAssistance}
                    disabled={analyzingImage}
                    className="text-xs bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100 font-semibold"
                  >
                    <Sparkles
                      className={`h-3.5 w-3.5 mr-1 ${
                        analyzingImage ? "animate-spin" : ""
                      }`}
                    />
                    {analyzingImage ? "Analyzing..." : "AI Auto-Inspect"}
                  </Button>
                )}
              </div>

              {/* Upload Drop Zone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[180px]">
                  <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">
                    Click to select photo or drag & drop
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Direct smartphone camera photo or saved image
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {/* Preview Box */}
                <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 flex flex-col items-center justify-center min-h-[180px] overflow-hidden relative">
                  {previewUrl ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Hazard upload preview"
                        className="max-h-40 rounded-lg object-contain shadow-xs"
                      />
                      <span className="text-[11px] text-slate-500 font-medium mt-2">
                        {selectedFile?.name} (
                        {((selectedFile?.size || 0) / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 text-xs">
                      <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                      No image selected yet
                    </div>
                  )}
                </div>
              </div>

              {/* AI Vision Preview Banner */}
              {visionPreview && (
                <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-cyan-900 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-cyan-600" />
                      AI Vision Inspection Preview
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-white text-cyan-800 border-cyan-200 text-[10px]"
                    >
                      {visionPreview.model_name}
                    </Badge>
                  </div>
                  <p className="text-cyan-800 text-xs">
                    {visionPreview.short_description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {visionPreview.visible_evidence.map((ev, i) => (
                      <span
                        key={i}
                        className="bg-white/80 text-cyan-700 text-[10px] font-medium px-2 py-0.5 rounded-md border border-cyan-200"
                      >
                        ✓ {ev}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-cyan-700/80 italic pt-1">
                    * {visionPreview.confidence_calibration_notice}
                  </div>
                </div>
              )}
            </Card>

            {/* Step 2: Category Selection */}
            <Card className="border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    2. Select Hazard Classification
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Choose the observed category or allow AI vision to classify
                    automatically
                  </p>
                </div>
                {selectedCategory === "AUTO" && (
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    AI Auto-Classify Active
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border ${cat.color}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {cat.label}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {cat.sublabel}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory("AUTO")}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Reset to AI Auto-Classification
                </Button>
              </div>
            </Card>

            {/* Step 3: Location Confirmation */}
            <Card className="border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    3. Supply or Confirm Location
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Geospatial coordinates power map placement and duplicate
                    clustering
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseCurrentGps}
                  disabled={gpsLoading}
                  className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  <Navigation
                    className={`h-3.5 w-3.5 mr-1 text-blue-600 ${
                      gpsLoading ? "animate-spin" : ""
                    }`}
                  />
                  {gpsLoading ? "Acquiring GPS..." : "Use Current GPS"}
                </Button>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  Quick Metro Presets:
                </span>
                {QUICK_ZONES.map((z) => (
                  <button
                    key={z.name}
                    type="button"
                    onClick={() => {
                      setLat(z.lat.toString());
                      setLng(z.lng.toString());
                      setAddress(z.name);
                    }}
                    className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition"
                  >
                    {z.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Latitude
                  </label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    required
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Longitude
                  </label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    required
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Street Address / Landmark
                  </label>
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Near Silk Board Flyover"
                    className="text-xs"
                  />
                </div>
              </div>
            </Card>

            {/* Step 4: Description & Details */}
            <Card className="border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  4. Incident Summary & Notes
                </h3>
                <p className="text-[11px] text-slate-400">
                  Provide descriptive information to help first responders and
                  fellow citizens
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Incident Title
                  </label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Water stagnation blocking left vehicular lane"
                    required
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Detailed Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe water depth, vehicle passability, fallen wires, or immediate risks..."
                    required
                    className="w-full rounded-md border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Severity Estimate (1 = Minor, 5 = Critical Danger)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={severity}
                      onChange={(e) => setSeverity(Number(e.target.value))}
                      className="flex-1 accent-blue-600 cursor-pointer"
                    />
                    <Badge
                      variant="outline"
                      className={`text-xs px-2.5 font-bold ${
                        severity >= 4
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : severity === 3
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      Severity Level {severity}/5
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Citizen reports appear immediately on the Live Risk Map as
                unverified.
              </span>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 shadow-xs"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Submitting & Analyzing...
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Submit Hazard Report
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
