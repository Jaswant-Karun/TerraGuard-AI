"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { requestPasswordReset, resetPassword } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"REQUEST" | "RESET">("REQUEST");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const generatedToken = await requestPasswordReset(email);
      if (generatedToken) {
        setToken(generatedToken);
      }
      setMessage("Password recovery verified. Please set your new password below.");
      setStep("RESET");
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to request password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
      router.push("/login?reset=success");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 selection:bg-brand-cyan/20">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-navy-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#06B6D4] flex items-center justify-center mx-auto shadow-md shadow-[#06B6D4]/25">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">
            Password Recovery
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Cryptographic Token Authentication · TerraGuard AI
          </p>
        </div>

        <Card className="shadow-command-lg">
          <CardHeader>
            <CardTitle>
              {step === "REQUEST" ? "Request Verification Token" : "Enter New Password"}
            </CardTitle>
            <CardDescription>
              {step === "REQUEST"
                ? "Enter your account email to dispatch a secure recovery token."
                : "Provide your verification token and your new strong password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {step === "REQUEST" ? (
              <form onSubmit={handleRequestToken} className="space-y-4">
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="operator@city.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                >
                  Generate Recovery Token
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <Input
                  label="Verification Token"
                  placeholder="Paste JWT recovery token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                >
                  Update Account Password
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-center border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              Remember your password?{" "}
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

