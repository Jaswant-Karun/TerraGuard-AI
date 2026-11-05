# TerraGuard AI — n8n Webhook Security & Integration Contracts

This document specifies the authenticated webhook architecture connecting FastAPI and n8n.

---

## 1. Security Architecture & Authentication

All incoming and outgoing webhooks enforce strict security guarantees:

1. **Shared Secret Authentication:**  
   Every HTTP request between FastAPI and n8n carries the secret header:
   ```http
   X-Webhook-Secret: tg_dev_secret_key
   ```
   Validated using constant-time string comparison (`hmac.compare_digest`) to prevent timing side-channel attacks.

2. **Loop Prevention & Hop Limit:**  
   All requests carry an origin tag:
   ```http
   X-TerraGuard-Origin: backend | n8n
   ```
   If a webhook callback is received with matching origin or if loop depth exceeds 3 hops, the event is immediately terminated.

3. **Frontend Isolation:**  
   Webhook URLs, signing secrets, and n8n credentials are **never exposed to frontend clients**. The web dashboard interacts solely through authenticated FastAPI endpoints (`/api/v1/automation/*`).

---

## 2. Webhook Endpoints Matrix

### A. FastAPI to n8n (Outgoing Events)

| Target n8n Webhook Path | Trigger Event | Description |
| :--- | :--- | :--- |
| `POST /webhook/trigger-environmental-monitoring` | Manual / Scheduled | Triggers multi-hazard telemetry audit |
| `POST /webhook/risk-threshold-check` | Risk Assessment Complete | Emits composite risk score for threshold evaluation |
| `POST /webhook/citizen-report-event` | Citizen Report Submitted | Passes unverified hazard report for automated validation |
| `POST /webhook/alert-notification-event` | Alert Approved | Dispatches multi-channel siren broadcast |
| `POST /webhook/response-task-creation` | High Threat Breach | Requests municipal department field task formulation |
| `POST /webhook/trigger-daily-intelligence-report` | Daily Schedule / Manual | Triggers daily executive situation report synthesis |

### B. n8n to FastAPI (Incoming Callbacks)

All callback endpoints are mounted under `/api/v1/automation/webhooks/`:

#### 1. Risk Assessment Callback
`POST /api/v1/automation/webhooks/risk-assessment-callback`
```json
{
  "workflow_id": "WF_01_ENV_MONITORING",
  "status": "SUCCESS",
  "assessment_id": "risk_635c39ac",
  "composite_risk_score": 72.4,
  "risk_level": "HIGH"
}
```

#### 2. Create Alert Callback
`POST /api/v1/automation/webhooks/create-alert`
```json
{
  "title": "Elevated Urban Inundation Warning",
  "message": "Continuous 45mm/h rainfall converging into Bellandur lake drainage basin.",
  "severity": "HIGH",
  "target_zone": "BLR-SOUTH-04",
  "lat": 12.9352,
  "lng": 77.6669,
  "radius_km": 5.0
}
```

#### 3. Task Dispatch Callback
`POST /api/v1/automation/webhooks/task-dispatch-callback`
```json
{
  "workflow_id": "WF_05_RESPONSE_TASK_CREATION",
  "status": "DISPATCHED",
  "title": "Deploy mobile dewatering pumps to Koramangala 80ft Rd outfall",
  "assigned_department": "MUNICIPAL_STORMWATER_CORPS",
  "priority": "HIGH",
  "instructions": "Stage trailer dewatering units to prevent underpass waterlogging.",
  "location": { "type": "Point", "coordinates": [77.6245, 12.9352] },
  "requires_human_approval": false
}
```

#### 4. Alert Delivery Callback
`POST /api/v1/automation/webhooks/alert-delivery-callback`
```json
{
  "workflow_id": "WF_04_ALERT_NOTIFICATION",
  "alert_id": "alert_821a",
  "dispatched_count": 482,
  "delivery_status": "DELIVERED",
  "channels": ["TELEGRAM", "SMS", "DASHBOARD"]
}
```

#### 5. Daily Intelligence Callback
`POST /api/v1/automation/webhooks/daily-intelligence-callback`
```json
{
  "workflow_id": "WF_06_DAILY_INTELLIGENCE_REPORT",
  "status": "SUCCESS",
  "report_date": "2026-11-05",
  "title": "Daily Municipal Risk Intelligence Briefing",
  "summary_text": "TERRAGUARD AI METROPOLITAN DAILY SITUATION REPORT...",
  "total_incidents": 14
}
```

