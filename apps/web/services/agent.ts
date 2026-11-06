import {
  AgentChatRequest,
  AgentChatResponse,
  AgentInfo,
  SuggestedQuestion,
} from "@/types/agent";
import { getAccessToken } from "./auth";
import { API_BASE_URL } from "./config";

export async function chatWithAgent(
  payload: AgentChatRequest,
  token?: string | null
): Promise<AgentChatResponse> {
  const effectiveToken = token || getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (effectiveToken) {
    headers["Authorization"] = `Bearer ${effectiveToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/agent/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Agent interaction failed (HTTP ${res.status}): ${
        errorBody || res.statusText
      }`
    );
  }

  return res.json();
}

export async function fetchAvailableAgents(): Promise<AgentInfo[]> {
  const res = await fetch(`${API_BASE_URL}/agent/agents`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch agent inventory (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchSuggestedQuestions(): Promise<SuggestedQuestion[]> {
  const res = await fetch(`${API_BASE_URL}/agent/suggested-questions`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch suggested questions (HTTP ${res.status})`);
  }

  return res.json();
}

