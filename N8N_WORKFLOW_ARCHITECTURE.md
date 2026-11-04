# TerraGuard AI — n8n Automation & Webhook Workflow Architecture

**INFINEX 2K26 — Global AI Hackathon**

---

## 1. Architectural Principles & Isolation Rule
>
> [!IMPORTANT]
> **Strict Isolation Decision:** MongoDB Atlas stores all TerraGuard domain data (telemetry, incidents, risk zones, users). The **n8n automation engine** runs in an isolated container with its own internal database (persistent SQLite storage on Render or independent PostgreSQL). n8n and MongoDB Atlas will never share collections, credentials, or execution tables.

All communication between TerraGuard's FastAPI backend and the n8n automation engine occurs exclusively via **cryptographically secured, asynchronous HTTP webhooks**.

```text
+------------------------------------+               +-------------------------------------+
|        FastAPI Backend             |               |             n8n Engine              |
|  (Disaster Triage & Event Router)  |               |    (Automated Response Pipelines)   |
+-----------------+------------------+               +------------------+------------------+
                  |                                                     |
                  | 1. POST /webhook/hazard-alert                       |
                  |    (Signed with X-TerraGuard-Webhook-Secret)        |
                  +---------------------------------------------------->|
                  |                                                     |-- [Switch: Severity >= 4?]
                  |                                                     |-- [Format Emergency Dispatch]
                  |                                                     |-- [Send Telegram Channel Alert]
                  |                                                     |-- [Send SMS via Twilio Gateway]
                  |                                                     |-- [Notify Incident Response Room]
                  | 2. POST /api/v1/webhooks/n8n/action-callback        |
                  |<----------------------------------------------------+
                  |    (Logs action into MongoDB 'action_logs')         |
                  v                                                     v
```

---

## 2. Core Automation Workflows

### 2.1 Workflow 1: `WF-CRITICAL-HAZARD-ESCALATION`

- **Objective:** Immediate, zero-latency multi-channel notification and alert routing when a catastrophic hazard (Flood, Fire, Landslide) is detected or predicted.
- **Trigger:** Webhook Node (`POST /webhook/critical-hazard`)
- **Node Pipeline:**
  1. **Webhook Ingestion:** Receives incident JSON from FastAPI with headers containing `X-TerraGuard-Webhook-Secret`.
  2. **Security Verification Node (Code/Crypto):** Validates the incoming bearer secret against n8n environment variables.
  3. **Conditional Switch:**
     - *Branch A (Severity 5 — Catastrophic):* Broadcasts to Public Telegram Alert Channel, triggers SMS to municipal emergency roster, and alerts Discord command room.
     - *Branch B (Severity 4 — Severe):* Dispatches email/Slack alert to Municipal Ward Supervisors and places incident on high-priority triage queue.
  4. **HTTP Request Callback:** Sends delivery confirmation back to FastAPI endpoint `POST /api/v1/webhooks/n8n/action-callback` for tamper-proof audit logging.

### 2.2 Workflow 2: `WF-CITIZEN-REPORT-TRIAGE`

- **Objective:** Automated verification, routing, and citizen receipt acknowledgment.
- **Trigger:** Webhook Node (`POST /webhook/citizen-report`)
- **Node Pipeline:**
  1. **Confidence Filter:** Checks `ai_analysis.confidence >= 0.80`.
  2. **Department Router (Switch):**
     - `FLOOD` -> Routes ticket to Stormwater & Drainage Directorate.
     - `AIR_POLLUTION` -> Routes ticket to Environmental Pollution Control Board.
     - `INFRASTRUCTURE_FAILURE` -> Routes ticket to Municipal Public Works.
  3. **Citizen SMS/Email Confirmation:** Sends instant notification to the citizen with tracking ID: *"TerraGuard AI has verified your report #TG-9412. Municipal teams have been alerted."*

### 2.3 Workflow 3: `WF-SCHEDULED-TELEMETRY-HEALTH-SYNC`

- **Objective:** Periodic environmental ingest trigger and infrastructure watchdog.
- **Trigger:** Cron Schedule Node (Every 15 minutes: `*/15 * * * *`)
- **Node Pipeline:**
  1. **Trigger Backend Ingestion:** Calls FastAPI `POST /api/v1/telemetry/sync`.
  2. **Check Response Status:** Validates HTTP 200 and checks latency.
  3. **Watchdog Failure Alert:** If Open-Meteo or OpenAQ fails or MongoDB returns connection latency > 500ms, immediately notifies engineering via webhook.

---

## 3. Webhook Security & Payload Specifications

### 3.1 Outgoing Webhook from FastAPI to n8n

```http
POST https://n8n-terraguard.onrender.com/webhook/critical-hazard
Content-Type: application/json
X-TerraGuard-Webhook-Secret: tg_sec_live_99a8b7c6d5e4f3a2b1

{
  "event": "HAZARD_CRITICAL_DETECTED",
  "incident_id": "66a9b1c2e4b0a1d2e3f4a5b1",
  "category": "FLOOD",
  "severity": 5,
  "location": {
    "lat": 12.9716,
    "lng": 77.5946,
    "address": "MG Road Underpass, Sector 4"
  },
  "metrics": {
    "water_depth_estimate_m": 0.85,
    "confidence_score": 0.96
  },
  "recommended_action": "Issue immediate evacuation order and deploy high-capacity pump units."
}
```

### 3.2 Incoming Callback from n8n to FastAPI

```http
POST https://terraguard-api.onrender.com/api/v1/webhooks/n8n/action-callback
Content-Type: application/json
X-TerraGuard-Webhook-Secret: tg_sec_live_99a8b7c6d5e4f3a2b1

{
  "workflow_id": "WF-CRITICAL-HAZARD-01",
  "incident_id": "66a9b1c2e4b0a1d2e3f4a5b1",
  "action_dispatched": "MULTI_CHANNEL_BROADCAST",
  "channels_notified": ["TELEGRAM_EMERGENCY", "MUNICIPAL_SLACK", "SMS_DISPATCH"],
  "status": "DELIVERED",
  "execution_timestamp": "2026-11-04T12:35:12Z"
}
```
