"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, UserPlus, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { UserRole } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("CITIZEN");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role,
        phone: phone || undefined,
      });
      router.push("/profile");
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 35;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    return Math.min(score, 100);
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 selection:bg-brand-cyan/20">
      <div className="w-full max-w-lg space-y-6">
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
            Create TerraGuard <span className="text-[#06B6D4]">AI</span> Account
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Role-Based Access Control · Secure Municipal Ingestion
          </p>
        </div>

        {/* Registration Card */}
        <Card className="shadow-command-lg">
          <CardHeader>
            <CardTitle>Account Details & Role</CardTitle>
            <CardDescription>
              Select your operational responsibility level within the TerraGuard AI ecosystem.
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
                label="Full Name"
                placeholder="Dr. Sarah Chen"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="sarah.chen@city.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* Role Selection Grid */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Platform Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("CITIZEN")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === "CITIZEN"
                        ? "border-[#06B6D4] bg-[#06B6D4]/5 ring-1 ring-[#06B6D4]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="block font-bold text-xs text-navy-950">Citizen</span>
                    <span className="text-[10px] text-slate-500">Report & track hazards</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("ANALYST")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === "ANALYST"
                        ? "border-[#06B6D4] bg-[#06B6D4]/5 ring-1 ring-[#06B6D4]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="block font-bold text-xs text-navy-950">Analyst</span>
                    <span className="text-[10px] text-slate-500">Air & flood telemetry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("COORDINATOR")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === "COORDINATOR"
                        ? "border-[#06B6D4] bg-[#06B6D4]/5 ring-1 ring-[#06B6D4]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="block font-bold text-xs text-navy-950">Coordinator</span>
                    <span className="text-[10px] text-slate-500">Emergency dispatch unit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("ADMIN")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === "ADMIN"
                        ? "border-[#06B6D4] bg-[#06B6D4]/5 ring-1 ring-[#06B6D4]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="block font-bold text-xs text-navy-950">Administrator</span>
                    <span className="text-[10px] text-slate-500">Full city management</span>
                  </button>
                </div>
              </div>

              {/* Password with Strength Meter */}
              <div className="space-y-1.5">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {password && (
                  <div className="space-y-1 pt-1">
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength < 40
                            ? "bg-rose-500"
                            : strength < 75
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${strength}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Strength</span>
                      <span
                        className={
                          strength < 40
                            ? "text-rose-600 font-bold"
                            : strength < 75
                            ? "text-amber-600 font-bold"
                            : "text-emerald-600 font-bold"
                        }
                      >
                        {strength < 40 ? "Weak" : strength < 75 ? "Moderate" : "Strong"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Input
                label="Phone Number (Optional)"
                type="tel"
                placeholder="+1 (555) 019-2834"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                helperText="Used exclusively for critical automated SMS disaster evacuations."
              />

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isLoading}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Create Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-brand-blue font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

