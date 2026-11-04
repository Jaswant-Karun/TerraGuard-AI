import React from "react";
import { FolderSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-300 bg-white/50 max-w-md mx-auto space-y-3",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-1">
        {icon || <FolderSearch className="w-6 h-6" />}
      </div>
      <h4 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
