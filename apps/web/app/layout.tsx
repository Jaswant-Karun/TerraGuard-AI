import type { Metadata } from "next";
import "@/styles/globals.css";
import { AuthProvider } from "@/features/auth/AuthContext";

export const metadata: Metadata = {
  title: "TerraGuard AI — Urban Risk Intelligence & Disaster Prevention",
  description:
    "AI-powered urban hazard monitoring, predictive environmental risk scoring, and automated emergency prevention. Predict. Prevent. Protect.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-screen bg-background text-foreground antialiased selection:bg-brand-cyan/20 selection:text-brand-cyan">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

