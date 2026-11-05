"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Cpu,
  Database,
  Flame,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  chatWithAgent,
  fetchAvailableAgents,
  fetchSuggestedQuestions,
} from "@/services/agent";
import {
  ActionPlanItem,
  AgentChatResponse,
  AgentInfo,
  ChatMessage,
  SuggestedQuestion,
} from "@/types/agent";

const METRO_ZONES = [
  { name: "Bengaluru Central (MG Rd)", lat: 12.9716, lng: 77.5946 },
  { name: "Koramangala 80ft Rd", lat: 12.9352, lng: 77.6245 },
  { name: "Bellandur Lake Basin", lat: 12.9352, lng: 77.6669 },
  { name: "Whitefield Corridor", lat: 12.9698, lng: 77.7499 },
];

export default function AiCommandCenterPage() {
  const [selectedZone, setSelectedZone] = useState(METRO_ZONES[0]);
  const [selectedAgentOverride, setSelectedAgentOverride] = useState<string>("AUTO");

  const [availableAgents, setAvailableAgents] = useState<AgentInfo[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);

  // Messages & Input
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentActivities, setCurrentActivities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentActivities]);

  // Initial load: Fetch agents and questions
  useEffect(() => {
    async function loadMeta() {
      try {
        const [agentsRes, questionsRes] = await Promise.all([
          fetchAvailableAgents(),
          fetchSuggestedQuestions(),
        ]);
        setAvailableAgents(agentsRes);
        setSuggestedQuestions(questionsRes);

        // Seed welcome greeting from orchestrator
        setMessages([
          {
            id: "welcome-msg",
            role: "assistant",
            content:
              "Welcome to the **TerraGuard AI Multi-Agent Command Center**. " +
              "I am your central autonomous orchestrator, coordinating 9 domain-specialized agents " +
              "grounded in verified environmental telemetry, trained Scikit-Learn models, and emergency protocols. " +
              "Select a metropolitan zone or submit an operational inquiry to begin.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            identified_domain: "ORCHESTRATOR",
            agent_name: "TerraGuard AI Orchestrator",
            factual_data_sources: ["Open-Meteo Weather", "OpenAQ Telemetry", "Scikit-Learn ML"],
          },
        ]);
      } catch (err) {
        console.error("Failed to load command center metadata:", err);
      }
    }
    loadMeta();
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || loading) return;

    setError(null);
    setInputPrompt("");

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setCurrentActivities([
      "Analyzing user inquiry domain...",
      "Gathering verified Open-Meteo & OpenAQ telemetry...",
      "Evaluating Scikit-Learn predictive hydrological models...",
    ]);

    try {
      const response: AgentChatResponse = await chatWithAgent({
        message: text,
        lat: selectedZone.lat,
        lng: selectedZone.lng,
        location_name: selectedZone.name,
        agent_override: selectedAgentOverride === "AUTO" ? null : selectedAgentOverride,
        history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        identified_domain: response.identified_domain,
        agent_name: response.agent_name,
        agent_activity: response.agent_activity,
        factual_data_sources: response.factual_data_sources,
        structured_action_plan: response.structured_action_plan,
        risk_summary: response.risk_summary,
        advisory_notice: response.advisory_notice,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Agent communication failed.");
    } finally {
      setLoading(false);
      setCurrentActivities([]);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
            title="Return to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                AI Multi-Agent Command Center
                <Badge
                  variant="outline"
                  className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px]"
                >
                  9 Specialized Agents • Gemini 2.0
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Autonomous multi-agent orchestration for urban risk intelligence and municipal disaster prevention
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Contextual Location Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 border border-slate-200">
            <MapPin className="h-3.5 w-3.5 text-slate-500 ml-2" />
            <select
              value={selectedZone.name}
              onChange={(e) => {
                const z = METRO_ZONES.find((x) => x.name === e.target.value);
                if (z) setSelectedZone(z);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 border-none outline-none pr-3 py-1 cursor-pointer"
            >
              {METRO_ZONES.map((z) => (
                <option key={z.name} value={z.name}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Clear conversation history"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Grid: Chat Canvas (Left/Center) + Context & Suggested (Right) */}
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Chat & Execution Canvas */}
        <div className="lg:col-span-2 flex flex-col h-[750px] bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Chat Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-700">Orchestration Network Online</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">Target Sector: <strong>{selectedZone.name}</strong></span>
            </div>

            {/* Direct Agent Override Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <Cpu className="h-3.5 w-3.5 text-cyan-600" />
              <select
                value={selectedAgentOverride}
                onChange={(e) => setSelectedAgentOverride(e.target.value)}
                className="bg-white border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 px-2 py-0.5 cursor-pointer outline-none"
              >
                <option value="AUTO">Auto-Orchestrator (Recommended)</option>
                {availableAgents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversation History Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`space-y-3 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                    {/* Header line for Assistant */}
                    {!isUser && msg.agent_name && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-bold text-slate-800">{msg.agent_name}</span>
                        <span>•</span>
                        <Badge
                          variant="outline"
                          className="bg-slate-50 text-slate-600 border-slate-200 text-[9px] px-1.5 py-0"
                        >
                          {msg.identified_domain}
                        </Badge>
                        <span className="text-slate-400">{msg.timestamp}</span>
                      </div>
                    )}

                    {/* Speech Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? "bg-blue-600 text-white rounded-br-xs"
                          : "bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-xs"
                      }`}
                    >
                      <div className="prose prose-xs max-w-none whitespace-pre-line">
                        {msg.content}
                      </div>

                      {/* Structured Action Plan Card */}
                      {msg.structured_action_plan && msg.structured_action_plan.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2">
                          <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />
                            Municipal Tactical Directives & Dispatch Sequence
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {msg.structured_action_plan.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] shadow-2xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] font-bold px-1.5 py-0.2 ${
                                      item.priority === "CRITICAL"
                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                        : item.priority === "HIGH"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    }`}
                                  >
                                    {item.priority}
                                  </Badge>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {item.estimated_timeframe}
                                  </span>
                                </div>
                                <div className="font-semibold text-slate-900">{item.action}</div>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                  <span>Dept: <strong>{item.department}</strong></span>
                                  <span>Loc: {item.target_location}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Source References */}
                      {msg.factual_data_sources && msg.factual_data_sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400 font-semibold flex items-center gap-1">
                            <Database className="h-3 w-3" /> Factual Data Sources:
                          </span>
                          {msg.factual_data_sources.map((src, i) => (
                            <span
                              key={i}
                              className="bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-medium"
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Mandatory Advisory Notice */}
                      {msg.advisory_notice && (
                        <div className="mt-3 p-2 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[10px] text-amber-900 leading-tight">
                          {msg.advisory_notice}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Agent Activity Progress Indicator */}
            {loading && (
              <div className="flex gap-3 items-start animate-fade-in">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 max-w-[80%]">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                    Multi-Agent Orchestrator Reasoning...
                  </div>
                  <div className="space-y-1">
                    {currentActivities.map((act, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-slate-500">
                        <CheckCircle2 className="h-3 w-3 text-cyan-600" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask about live risk, flood prediction, factor attribution, or emergency actions..."
                disabled={loading}
                className="text-xs h-10 border-slate-200 focus:border-blue-500 shadow-2xs"
              />
              <Button
                type="submit"
                disabled={loading || !inputPrompt.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 text-xs font-semibold shadow-xs shrink-0"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Dispatch
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column: Suggested Inquiries & Sector Status Snapshot */}
        <div className="space-y-6">
          {/* Location Snapshot Card */}
          <Card className="border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Active Contextual Zone
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Ground truth telemetry anchor
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
              >
                LIVE TELEMETRY
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sector Name:</span>
                <span className="font-bold text-slate-900">{selectedZone.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Coordinates:</span>
                <span className="font-mono text-slate-800">
                  {selectedZone.lat.toFixed(4)}, {selectedZone.lng.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Data Freshness:</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Synced (Open-Meteo)
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Link href="/dashboard/prediction" className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Activity className="h-3.5 w-3.5 mr-1 text-blue-600" />
                  ML Simulator
                </Button>
              </Link>
              <Link href="/dashboard/map" className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Compass className="h-3.5 w-3.5 mr-1 text-cyan-600" />
                  GIS Map
                </Button>
              </Link>
            </div>
          </Card>

          {/* Suggested Operational Questions */}
          <Card className="border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Suggested Command Inquiries
              </h3>
            </div>

            <div className="space-y-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q.question)}
                  disabled={loading}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 transition group flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="text-[10px] font-semibold text-blue-600 mb-0.5">
                      {q.category}
                    </div>
                    <div className="text-xs text-slate-700 font-medium group-hover:text-slate-900">
                      {q.question}
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 mt-1" />
                </button>
              ))}
            </div>
          </Card>

          {/* Specialized Agents Directory */}
          <Card className="border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="h-4 w-4 text-cyan-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Specialized Agents in Network ({availableAgents.length})
              </h3>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {availableAgents.map((ag) => (
                <div
                  key={ag.id}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]"
                >
                  <div className="font-semibold text-slate-800">{ag.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">
                    {ag.description}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
