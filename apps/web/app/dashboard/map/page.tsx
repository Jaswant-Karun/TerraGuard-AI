"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Info, Radio, RefreshCw, ShieldAlert } from "lucide-react";
import { LiveRiskMap } from "@/features/maps/LiveRiskMap";
import { Button } from "@/components/ui/button";

export default function MapPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Top Header Bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
            title="Return to Dashboard Overview"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Live GIS Risk Intelligence Map
                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full">
                  <Radio className="h-2.5 w-2.5 animate-pulse" />
                  Live GIS Feed
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              6 Safe Facilities
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              3 Threat Zones
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              5 Reports
            </span>
          </div>

          <Button
            onClick={() => setRefreshKey((k) => k + 1)}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold bg-white border-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden sm:inline">Refresh Layers</span>
          </Button>
        </div>
      </div>

      {/* Main Full-Scale Interactive GIS Map */}
      <div className="relative flex-1 w-full overflow-hidden">
        <LiveRiskMap key={refreshKey} height="calc(100vh - 7rem)" />
      </div>
    </div>
  );
}

