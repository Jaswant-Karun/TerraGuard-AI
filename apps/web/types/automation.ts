export type WorkflowStatus = "ACTIVE" | "PAUSED" | "ERROR";

export interface WorkflowDefinition {
  id: string;
  name: string;
  category?: string;
  slug?: string;
  description: string;
  cadence?: string;
  trigger_type: "SCHEDULE" | "SCHEDULED" | "WEBHOOK" | "HYBRID";
  webhook_slug?: string | null;
  status: WorkflowStatus | string;
  last_executed_at?: string | null;
  execution_count?: number;
  success_rate?: number;
  success_rate_pct?: number;
  tags?: string[];
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

