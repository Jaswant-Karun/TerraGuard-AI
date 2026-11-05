export interface AgentActivityStep {
  agent: string;
  action: string;
  description: string;
  timestamp: string;
}

export interface ActionPlanItem {
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  department: string;
  action: string;
  target_location: string;
  estimated_timeframe: string;
}

export interface AgentRiskSummary {
  composite_risk_score: number;
  risk_level: string;
  primary_hazard: string;
  temperature_c?: number;
  rainfall_mm?: number;
  aqi?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  identified_domain?: string;
  agent_name?: string;
  agent_activity?: AgentActivityStep[];
  factual_data_sources?: string[];
  structured_action_plan?: ActionPlanItem[] | null;
  risk_summary?: AgentRiskSummary | null;
  advisory_notice?: string;
}

export interface AgentChatRequest {
  message: string;
  lat?: number;
  lng?: number;
  location_name?: string;
  history?: { role: string; content: string }[];
  agent_override?: string | null;
}

export interface AgentChatResponse {
  conversation_id: string;
  reply: string;
  identified_domain: string;
  agent_name: string;
  agent_activity: AgentActivityStep[];
  factual_data_sources: string[];
  structured_action_plan?: ActionPlanItem[] | null;
  risk_summary?: AgentRiskSummary | null;
  advisory_notice: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  domain: string;
  description: string;
  capabilities: string[];
}

export interface SuggestedQuestion {
  category: string;
  question: string;
  agent: string;
}
