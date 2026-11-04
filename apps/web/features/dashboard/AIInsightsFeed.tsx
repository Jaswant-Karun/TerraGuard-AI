"use client";

import React from "react";
import { Bot, CheckCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIInsight } from "@/types/dashboard";

interface Props {
  insights: AIInsight[];
}

export function AIInsightsFeed({ insights }: Props) {
  return (
    <Card className="p-5 bg-white border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bot className="h-4 w-4 text-cyan-600" />
            AI Prevention & Early Response Directives
            <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" /> Gemini 2.0 Vision + XGBoost
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Explainable root-cause models evaluating runoff saturation, particulate trapping, and automated municipal interventions
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No active AI alerts. Environmental conditions are within safe operational parameters.
          </div>
        ) : (
          insights.map((ins) => (
            <div
              key={ins.id}
              className={`p-3.5 rounded-xl border transition ${
                ins.severity === "CRITICAL"
                  ? "bg-rose-50/50 border-rose-200"
                  : ins.severity === "HIGH"
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-cyan-50/40 border-cyan-200"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      ins.severity === "CRITICAL"
                        ? "critical"
                        : ins.severity === "HIGH"
                        ? "high"
                        : "cyan"
                    }
                    className="font-black uppercase"
                  >
                    {ins.severity}
                  </Badge>
                  <span className="font-bold text-xs text-slate-900">{ins.title}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600">
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                    Target: {ins.target_zone}
                  </span>
                  <span className="text-cyan-700 font-bold bg-cyan-100/70 px-2 py-0.5 rounded">
                    {ins.confidence_score}% Confidence
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed pl-1 border-l-2 border-slate-300 ml-1 mb-2">
                {ins.recommendation}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                  Pre-emptive Mitigation Recommended
                </span>
                <span>{new Date(ins.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
