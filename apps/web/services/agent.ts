import {
  AgentChatRequest,
  AgentChatResponse,
  AgentInfo,
  SuggestedQuestion,
} from "@/types/agent";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export async function chatWithAgent(
  payload: AgentChatRequest
): Promise<AgentChatResponse> {
  const res = await fetch(`${API_BASE_URL}/agent/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
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

