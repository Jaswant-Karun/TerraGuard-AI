import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Telemetry Stream Degraded",
  message = "Unable to establish live connection with environmental sensors. Showing last verified cache.",
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-rose-200 bg-rose-50/40 text-slate-800 max-w-md mx-auto space-y-3",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-1">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-rose-900 tracking-tight">{title}</h4>
      <p className="text-xs text-rose-700/80 leading-relaxed max-w-xs">{message}</p>
      {onRetry && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            isLoading={isRetrying}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="border-rose-200 text-rose-800 hover:bg-rose-100"
          >
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
}

