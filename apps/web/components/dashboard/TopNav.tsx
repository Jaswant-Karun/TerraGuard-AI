"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock,
  Compass,
  LogOut,
  MapPin,
  Menu,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { DashboardNotification, LocationOption } from "@/types/dashboard";

interface TopNavProps {
  locations: LocationOption[];
  selectedLocationId: string;
  onLocationChange: (id: string) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  notifications: DashboardNotification[];
  onOpenMobileMenu?: () => void;
  isSampleData?: boolean;
}

export function TopNav({
  locations,
  selectedLocationId,
  onLocationChange,
  timeRange,
  onTimeRangeChange,
  notifications,
  onOpenMobileMenu,
  isSampleData = true,
}: TopNavProps) {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-sm">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex flex-col">
          <h1 className="text-sm md:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Urban Command Cockpit
            {isSampleData && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Benchmark Sample
              </span>
            )}
          </h1>
          <span className="text-xs text-slate-500">
            Real-time geospatial hazard intelligence & early disaster prevention
          </span>
        </div>
      </div>

      {/* Center / Right Controls: Location, Time Window, Notifications, Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Global Location Selector */}
        <div className="relative flex items-center">
          <MapPin className="pointer-events-none absolute left-2.5 h-4 w-4 text-cyan-600 z-10" />
          <select
            value={selectedLocationId}
            onChange={(e) => onLocationChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-7 text-xs font-semibold text-slate-800 shadow-sm focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer max-w-[160px] sm:max-w-[220px] md:max-w-[260px] truncate"
          >
            {locations.length > 0 ? (
              locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))
            ) : (
              <option value="ALL_METRO">Bengaluru Metropolitan Area</option>
            )}
          </select>
        </div>

        {/* Time Window Filter */}
        <div className="hidden md:flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
          {["24h", "7d", "30d"].map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`rounded-md px-2.5 py-1 transition-all ${
                timeRange === range
                  ? "bg-white text-cyan-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-cyan-600" />
                  Hazard Advisories ({notifications.length})
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No active emergency alerts
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-lg p-2.5 text-xs transition border ${
                        n.severity === "CRITICAL"
                          ? "bg-rose-50/70 border-rose-200 text-rose-950"
                          : n.severity === "HIGH"
                          ? "bg-amber-50/70 border-amber-200 text-amber-950"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-bold">{n.title}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            n.severity === "CRITICAL"
                              ? "bg-rose-200 text-rose-800"
                              : n.severity === "HIGH"
                              ? "bg-amber-200 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {n.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed mb-1">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(n.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-50 transition"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-800">
              {user?.full_name ? user.full_name[0].toUpperCase() : "U"}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-700 truncate max-w-[100px]">
              {user?.full_name?.split(" ")[0] || "Operator"}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="border-b border-slate-100 px-3 py-2 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.full_name || "Operator"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded">
                  {user?.role || "CITIZEN"}
                </span>
              </div>

              <Link
                href="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <User className="h-4 w-4 text-slate-400" />
                Profile Settings
              </Link>
              <Link
                href="/dashboard/map"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <Compass className="h-4 w-4 text-slate-400" />
                Live Map View
              </Link>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
