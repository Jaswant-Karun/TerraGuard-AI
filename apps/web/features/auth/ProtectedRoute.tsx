"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "./AuthContext";
import { UserRole } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin" />
        <p className="text-xs font-mono text-slate-500">Verifying Operator Credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white border border-slate-200 shadow-command-lg text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-navy-950">Authentication Required</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          This sector requires authenticated access. Please sign in with your municipal or citizen credentials.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button size="sm" onClick={() => router.push("/login")}>
            Sign In
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/register")}>
            Register
          </Button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white border border-rose-200 shadow-command-lg text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <Badge variant="critical">INSUFFICIENT PERMISSIONS</Badge>
        <h3 className="text-lg font-bold text-navy-950">Restricted Command Sector</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your current account role <span className="font-mono font-bold text-navy-900">[{user.role}]</span> does not have authorization for this action. Required: {allowedRoles.join(", ")}.
        </p>
        <div className="pt-2 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Return to Public Radar
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

