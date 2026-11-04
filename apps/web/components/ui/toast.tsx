"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = "info", duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl p-4 shadow-lg border text-sm backdrop-blur-md",
                toast.type === "success" && "bg-white/95 border-emerald-200 text-slate-800",
                toast.type === "error" && "bg-white/95 border-rose-200 text-slate-800",
                toast.type === "warning" && "bg-white/95 border-amber-200 text-slate-800",
                toast.type === "info" && "bg-white/95 border-sky-200 text-slate-800"
              )}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                {toast.type === "error" && (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                )}
                {toast.type === "warning" && (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                )}
                {toast.type === "info" && (
                  <Info className="w-5 h-5 text-brand-blue" />
                )}
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="font-semibold text-xs tracking-wide">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-slate-500">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
