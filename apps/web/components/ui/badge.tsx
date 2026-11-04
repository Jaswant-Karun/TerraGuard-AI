import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "low"
    | "moderate"
    | "high"
    | "critical"
    | "operational"
    | "neutral"
    | "cyan"
    | "outline";
  pulse?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    moderate: "bg-amber-50 text-amber-700 border-amber-200/80",
    high: "bg-orange-50 text-orange-700 border-orange-200/80",
    critical: "bg-rose-50 text-rose-700 border-rose-200/80",
    operational: "bg-sky-50 text-brand-blue border-sky-200/80",
    cyan: "bg-cyan-50 text-cyan-800 border-cyan-200/80",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    outline: "bg-transparent text-slate-700 border-slate-300",
  };

  const pulseColors = {
    low: "bg-emerald-500",
    moderate: "bg-amber-500",
    high: "bg-orange-500",
    critical: "bg-rose-500",
    operational: "bg-brand-blue",
    cyan: "bg-brand-cyan",
    neutral: "bg-slate-400",
    outline: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              pulseColors[variant]
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              pulseColors[variant]
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}

