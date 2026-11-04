"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  LogOut,
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

function ProfileContent() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) return null;

  const roleBadges = {
    CITIZEN: { variant: "neutral" as const, label: "Citizen Observer" },
    ANALYST: { variant: "operational" as const, label: "Environmental Analyst" },
    COORDINATOR: { variant: "high" as const, label: "Response Coordinator" },
    ADMIN: { variant: "critical" as const, label: "City Administrator" },
  };

  const roleInfo = roleBadges[user.role] || { variant: "neutral" as const, label: user.role };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 selection:bg-brand-cyan/20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-navy-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Command Radar</span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-600" />}
          >
            Sign Out
          </Button>
        </div>

        {/* Profile Card Header */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-[#1C2541] text-white shadow-command-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#06B6D4] flex items-center justify-center shadow-glow">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">{user.full_name}</h1>
                <Badge variant={roleInfo.variant} pulse>
                  {roleInfo.label}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-slate-300 space-y-1">
            <div className="text-slate-400 text-[10px]">OPERATOR ID</div>
            <div className="text-[#06B6D4] font-bold">{user.id}</div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Verified cryptographic session profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
                </span>
                <span className="font-semibold text-slate-800">{user.email}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-slate-400" /> Platform Role
                </span>
                <span className="font-mono font-bold text-navy-900">{user.role}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Status
                </span>
                <Badge variant="low">Active & Verified</Badge>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member Since
                </span>
                <span className="font-mono text-slate-700">{formatDateTime(user.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Last Active
                </span>
                <span className="font-mono text-slate-700">
                  {user.last_login_at ? formatDateTime(user.last_login_at) : "Active session"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Role Permissions Scope */}
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions Scope</CardTitle>
              <CardDescription>Role-Based Access Control matrix for this session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-navy-900">
                  <span>Citizen Hazard Reporting</span>
                  <Badge variant="low">Enabled</Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  Submit field photographs and geocoded hazard notifications to Gemini Sentinel.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-navy-900">
                  <span>Geospatial Radar & Telemetry</span>
                  <Badge
                    variant={
                      ["ANALYST", "COORDINATOR", "ADMIN"].includes(user.role)
                        ? "low"
                        : "neutral"
                    }
                  >
                    {["ANALYST", "COORDINATOR", "ADMIN"].includes(user.role)
                      ? "Full Access"
                      : "Public View"}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  Inspect raw hydrological sensor metrics and air inversion timeseries models.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-navy-900">
                  <span>Emergency Dispatch & n8n Escalation</span>
                  <Badge
                    variant={
                      ["COORDINATOR", "ADMIN"].includes(user.role)
                        ? "low"
                        : "critical"
                    }
                  >
                    {["COORDINATOR", "ADMIN"].includes(user.role)
                      ? "Authorized"
                      : "Restricted"}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  Trigger multi-channel citywide siren broadcasts and mobile pump unit deployment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

