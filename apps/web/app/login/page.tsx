"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogIn, KeyRound, AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      await login({ email, password });
      const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const redirectUrl = searchParams.get("redirect") || "/dashboard";
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 selection:bg-brand-cyan/20">
      <div className="w-full max-w-md space-y-6">
        {/* Top Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-navy-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Command Radar</span>
        </Link>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#06B6D4] flex items-center justify-center mx-auto shadow-md shadow-[#06B6D4]/25">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">
            Sign In to TerraGuard <span className="text-[#06B6D4]">AI</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Secure Command Gateway · JWT Authentication
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-command-lg">
          <CardHeader>
            <CardTitle>Operator Credentials</CardTitle>
            <CardDescription>
              Enter your registered municipal or citizen credentials to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="operator@city.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-brand-blue hover:underline font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none transition p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-500 hover:text-slate-800" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      )}
                    </button>
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isLoading}
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                Sign In to Terminal
              </Button>
            </form>

            {/* Quick Demo Fill Buttons for Hackathon Evaluation */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>QUICK DEMO PRESETS:</span>
                <Badge variant="cyan">Instant Test</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDemoCredentials("analyst@city.gov", "AnalystPassword2026!")}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-cyan-50/50 hover:border-cyan-300 text-left transition group"
                >
                  <span className="font-bold block text-[11px] text-navy-950 group-hover:text-cyan-700">Analyst</span>
                  <span className="text-[10px] text-slate-500">Environmental Team</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials("commander@city.gov", "CommanderPassword2026!")}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-cyan-50/50 hover:border-cyan-300 text-left transition group"
                >
                  <span className="font-bold block text-[11px] text-navy-950 group-hover:text-cyan-700">Coordinator</span>
                  <span className="text-[10px] text-slate-500">Emergency Dispatch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials("admin@city.gov", "AdminPassword2026!")}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-cyan-50/50 hover:border-cyan-300 text-left transition group"
                >
                  <span className="font-bold block text-[11px] text-navy-950 group-hover:text-cyan-700">Administrator</span>
                  <span className="text-[10px] text-slate-500">Full City Management</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials("citizen@city.gov", "CitizenPassword2026!")}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-cyan-50/50 hover:border-cyan-300 text-left transition group"
                >
                  <span className="font-bold block text-[11px] text-navy-950 group-hover:text-cyan-700">Citizen</span>
                  <span className="text-[10px] text-slate-500">Hazard Sentinel</span>
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-brand-blue font-bold hover:underline">
                Register as Citizen / Operator
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

