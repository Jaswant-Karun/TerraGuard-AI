# TerraGuard AI — n8n Workflow Architecture & Technical Specifications

This document defines the 6 core automated incident response workflows powering TerraGuard AI.

---

## Workflow Inventory Matrix

| ID | Name | Trigger Type | Primary Backend Endpoint | Target MongoDB Collection |
| :--- | :--- | :--- | :--- | :--- |
| `WF-01` | **Environmental Monitoring** | Cron (Every 15m) / Webhook | `GET /environment/current`, `POST /risk/assess` | `environmental_data`, `risk_assessments` |
| `WF-02` | **Risk Threshold Detection** | Webhook (`risk-threshold-check`) | `POST /automation/webhooks/create-alert` | `alerts`, `workflow_logs` |
| `WF-03` | **Citizen Report Processing** | Webhook (`citizen-report-event`) | `POST /reports/analyze-image`, `PATCH /reports/{id}/status` | `citizen_reports`, `workflow_logs` |
| `WF-04` | **Alert Notification** | Webhook (`alert-notification-event`) | `POST /automation/webhooks/alert-delivery-callback` | `workflow_logs` |
| `WF-05` | **Response Task Creation** | Webhook (`response-task-creation`) | `POST /automation/webhooks/task-dispatch-callback` | `response_tasks`, `workflow_logs` |
| `WF-06` | **Daily Intelligence Report** | Cron (06:00 AM UTC) | `GET /reports?status=VERIFIED`, `GET /dashboard/summary` | `workflow_logs` |

---

## Detailed Specifications

### 1. Workflow 1: Environmental Monitoring (`01_environmental_monitoring.json`)
- **Trigger:** Schedule node executing every 15 minutes across metropolitan coordinate grid.
- **Node Pipeline:**
  1. `HTTP Request`: Calls `GET /api/v1/environment/current?lat=12.9716&lng=77.5946`.
  2. `IF Node`: Validates physical sensor bounds (Temperature $\le 60^\circ\text{C}$, `data_freshness != 'FAILED'`).
  3. `HTTP Request`: Triggers ML risk assessment via `POST /api/v1/risk/assess`.
  4. `HTTP Request`: Emits completion receipt to `POST /api/v1/automation/webhooks/risk-assessment-callback`.
- **Failure Mode:** If telemetry fails or falls outside physical thresholds, routes to error logging node and flags sensor diagnostic warning.

### 2. Workflow 2: Risk Threshold Detection (`02_risk_threshold_detection.json`)
- **Trigger:** Ingests risk assessment completion event (`POST /webhook/risk-threshold-check`).
- **Node Pipeline:**
  1. `IF Node`: Evaluates `composite_risk_score >= 65` OR `risk_level in ['HIGH', 'CRITICAL']`.
  2. `IF Node (Anti-Flapping / Deduplication)`: Enforces 60-minute alert cooldown per zone. Suppresses duplicate siren broadcasts.
  3. `HTTP Request`: Calls `POST /api/v1/automation/webhooks/create-alert` to persist official alert in MongoDB `alerts` collection.
  4. `HTTP Request`: Emits execution log receipt.

### 3. Workflow 3: Citizen Report Processing (`03_citizen_report_processing.json`)
- **Trigger:** Ingests new citizen report event (`POST /webhook/citizen-report-event`).
- **Node Pipeline:**
  1. `IF Node`: Validates mandatory attributes (`title`, `description`, non-zero `location`).
  2. `IF Node`: Checks presence of uploaded media. If image exists, requests Gemini Multimodal analysis.
  3. `HTTP Request`: Updates report status in MongoDB to `AI_ANALYZED`.
  4. `HTTP Request`: Dispatches notification bulletin to on-duty response coordinators and municipal analysts.

### 4. Workflow 4: Alert Notification (`04_alert_notification.json`)
- **Trigger:** Ingests approved alert event (`POST /webhook/alert-notification-event`).
- **Node Pipeline:**
  1. `HTTP Request`: Queries citizen notification subscriptions matching target zone.
  2. `Code Node`: Generates formatted multi-channel payloads (Telegram markdown, SMS concise text, Dashboard webhooks).
  3. `HTTP Request`: Simulates/delivers messages to multi-channel providers.
  4. `HTTP Request`: Records delivery receipt in MongoDB.

### 5. Workflow 5: Response Task Creation (`05_response_task_creation.json`)
- **Trigger:** Ingests high-severity risk event or verified citizen incident.
- **Node Pipeline:**
  1. `Code Node`: Formulates tactical dispatch instructions (e.g. dewatering pumps, tree clearance, sandbag staging).
  2. `IF Node (Human-in-the-Loop Governance)`: If action involves evacuation or score $\ge 80$, flags `requires_human_approval: true` and queues task in `PENDING` state for coordinator authorization.
  3. `HTTP Request`: Saves task in MongoDB `response_tasks` collection.

### 6. Workflow 6: Daily Intelligence Report (`06_daily_intelligence_report.json`)
- **Trigger:** Schedule node executing daily at 06:00 AM UTC (11:30 AM IST).
- **Node Pipeline:**
  1. `HTTP Request`: Queries 24-hour verified reports from `GET /api/v1/reports?status=VERIFIED`.
  2. `HTTP Request`: Queries 24-hour risk metrics from `GET /api/v1/dashboard/summary`.
  3. `Code Node`: Synthesizes executive situation report with hazard breakdown, threat trends, and preventive directives.
  4. `HTTP Request`: Persists briefing in MongoDB and emits delivery receipt.

