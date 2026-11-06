"use client";

import React, { useEffect } from "react";
import { Clock, FastForward, Pause, Play, RotateCcw } from "lucide-react";

interface TimeForecastScrubberProps {
  timeOffsetHours: number;
  onTimeOffsetChange: React.Dispatch<React.SetStateAction<number>> | ((offset: any) => void);
  isPlaying: boolean;
  onTogglePlay: () => void;
  isDarkGIS?: boolean;
}

export function TimeForecastScrubber({
  timeOffsetHours,
  onTimeOffsetChange,
  isPlaying,
  onTogglePlay,
  isDarkGIS = true,
}: TimeForecastScrubberProps) {
  // Playback timer effect
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onTimeOffsetChange((prev) => {
        if (prev >= 6) return -24;
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying, onTimeOffsetChange]);

  const QUICK_STEPS = [-24, -12, -6, -1, 0, 1, 3, 6];

  const formatOffsetLabel = (hours: number) => {
    if (hours === 0) return "LIVE (NOW)";
    if (hours > 0) return `+${hours}h FORECAST`;
    return `${hours}h PAST`;
  };

  return (
    <div
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-2xl px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md select-none transition-all duration-200 ${
        isDarkGIS
          ? "bg-slate-950/90 border-slate-800 text-slate-100"
          : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Hydrological Timeline Scrubber
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              timeOffsetHours === 0
                ? "bg-rose-950 text-rose-300 border border-rose-800 animate-pulse"
                : timeOffsetHours > 0
                ? "bg-purple-950 text-purple-300 border border-purple-800"
                : "bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            {formatOffsetLabel(timeOffsetHours)}
          </span>
        </div>

        {/* Play / Pause / Reset Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onTimeOffsetChange(0)}
            className={`p-1 rounded-md border text-[10px] font-semibold flex items-center gap-1 transition ${
              isDarkGIS
                ? "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                : "bg-slate-100 border-slate-300 text-slate-700 hover:text-black"
            }`}
            title="Jump to Real-Time Live Feed"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Live</span>
          </button>

          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition shadow ${
              isPlaying
                ? "bg-amber-600 text-white hover:bg-amber-500"
                : "bg-cyan-600 text-white hover:bg-cyan-500"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Play ML Forecast</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Range Slider */}
      <div className="relative flex items-center">
        <input
          type="range"
          min="-24"
          max="6"
          step="1"
          value={timeOffsetHours}
          onChange={(e) => onTimeOffsetChange(parseInt(e.target.value, 10))}
          aria-label="Hydrological Timeline Slider"
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>

      {/* Discrete Tick Step Markers */}
      <div className="flex justify-between items-center mt-1.5 text-[9px] font-mono text-slate-400">
        {QUICK_STEPS.map((step) => {
          const isSelected = timeOffsetHours === step;
          return (
            <button
              key={step}
              onClick={() => onTimeOffsetChange(step)}
              className={`hover:text-cyan-400 transition ${
                isSelected
                  ? "text-cyan-300 font-bold underline underline-offset-2"
                  : step === 0
                  ? "text-rose-400 font-bold"
                  : ""
              }`}
            >
              {step === 0 ? "LIVE" : step > 0 ? `+${step}h` : `${step}h`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
