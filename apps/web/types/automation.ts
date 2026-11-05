export type WorkflowStatus = "ACTIVE" | "PAUSED" | "ERROR";

export interface WorkflowDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  cadence: string;
  trigger_type: "SCHEDULE" | "WEBHOOK";
  webhook_slug: string | null;
  status: WorkflowStatus;
  last_executed_at: string | null;
  execution_count: number;
  success_rate: number;
  tags: string[];
}

export interface WorkflowLogDTO {
  id?: string;
  workflow_id: string;
  trigger_event: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "RETRYING";
  payload: Record<string, any>;
  executed_at: string;
  execution_duration_ms: number;
}

export interface WorkflowLogListResponse {
  logs: WorkflowLogDTO[];
  total: number;
  limit: number;
  offset: number;
}

export interface WorkflowTriggerResponse {
  status: string;
  workflow_id: string;
  mode: string;
  dispatched_at: string;
  message: string;
  n8n_response?: any;
}

