import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      service: "terraguard-web",
      framework: "Next.js 14 App Router",
      timestamp: new Date().toISOString(),
      uptime_seconds: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    },
    { status: 200 }
  );
}
