import {
  WorkflowDefinition,
  WorkflowLogListResponse,
  WorkflowTriggerResponse,
} from "@/types/automation";
import { getAccessToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

/**
 * Fetch catalog of all 6 n8n workflows
 */
export async function fetchWorkflows(): Promise<WorkflowDefinition[]> {
  const res = await fetch(`${API_BASE_URL}/automation/workflows`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Failed to load workflow catalog (${res.status}): ${
        errorBody || res.statusText
      }`
    );
  }

  return res.json();
}

/**
 * Fetch execution logs from MongoDB collection `workflow_logs`
 */
export async function fetchWorkflowLogs(
  limit: number = 20,
  offset: number = 0,
  workflowId?: string
): Promise<WorkflowLogListResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (workflowId) {
    params.set("workflow_id", workflowId);
  }

  const res = await fetch(`${API_BASE_URL}/automation/logs?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Failed to load workflow audit logs (${res.status}): ${
        errorBody || res.statusText
      }`
    );
  }

  return res.json();
}

/**
 * Trigger an automation workflow manual run
 */
export async function triggerWorkflow(
  workflowId: string,
  payload?: Record<string, any>,
  token?: string | null
): Promise<WorkflowTriggerResponse> {
  const effectiveToken = token || getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (effectiveToken) {
    headers["Authorization"] = `Bearer ${effectiveToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/automation/workflows/${workflowId}/trigger`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload || {}),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Failed to trigger workflow execution (${res.status}): ${
        errorBody || res.statusText
      }`
    );
  }

  return res.json();
}

