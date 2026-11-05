"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  ChevronLeft,
  ChevronRight,
  Compass,
  History,
  LayoutDashboard,
  MapPin,
  Radio,
  Settings,
  Shield,
  ShieldAlert,
  Sliders,
  Workflow,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Live Risk Map", href: "/dashboard/map", icon: Radio, badge: "LIVE" },
  { name: "Risk Prediction", href: "/dashboard/prediction", icon: Activity },
  { name: "Report a Hazard", href: "/dashboard/report", icon: AlertTriangle },
  { name: "Safe Navigation", href: "/dashboard/navigation", icon: Compass },
  { name: "AI Command Center", href: "/dashboard/ai-command", icon: Bot, badge: "GEMINI" },
  { name: "Automation Center", href: "/dashboard/automation", icon: Workflow, badge: "n8n" },
  { name: "Historical Analytics", href: "/dashboard/analytics", icon: History, badge: "3D TWIN" },
  { name: "Alerts", href: "/dashboard/alerts", icon: ShieldAlert },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  {
    name: "Admin Panel",
    href: "/dashboard/admin",
    icon: Sliders,
    roles: ["ADMIN", "COORDINATOR", "ANALYST"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const userRole = user?.role || "CITIZEN";

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800 bg-[#0B132B] text-slate-300 transition-all duration-300 z-30 select-none ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Shield className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white text-base leading-tight">
                TerraGuard <span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Command Center
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          // Check role visibility
          if (item.roles && !item.roles.includes(userRole)) {
            return null;
          }

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-400 font-semibold border-l-2 border-cyan-400"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-transform ${
                  isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between truncate">
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span
                      className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.badge === "LIVE"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                          : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Status Footer */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-slate-900/60 p-2 border border-slate-800">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-cyan-400 border border-slate-700">
            {user?.full_name ? user.full_name[0].toUpperCase() : "U"}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0B132B]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-white truncate">
                {user?.full_name || "Operator"}
              </span>
              <span className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5 text-cyan-400" />
                {userRole}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

