# TerraGuard AI — n8n Automation Engine Setup Guide

**Architecture:** Distributed Disaster Prevention & Automated Incident Response  
**Isolation Rule:** The n8n automation engine operates with independent storage (SQLite or PostgreSQL persistent disk volume). It **never** connects directly or shares database credentials with TerraGuard's MongoDB Atlas cluster. All state synchronization occurs through authenticated REST APIs and secured webhooks.

---

## 1. Quick Start (Local Docker Development)

To run n8n alongside the TerraGuard backend locally:

```bash
docker run -d \
  --name terraguard-n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=terraguard_dev_secret \
  -e N8N_HOST=localhost \
  -e N8N_PORT=5678 \
  -e N8N_PROTOCOL=http \
  -e WEBHOOK_URL=http://localhost:5678/ \
  -e GENERIC_TIMEZONE=Asia/Kolkata \
  -v terraguard_n8n_data:/home/node/.n8n \
  n8nio/n8n:latest
```

The visual workflow editor is available at [http://localhost:5678](http://localhost:5678).

---

## 2. Environment Configuration

### In `apps/backend/.env`:
```env
# n8n Automation Engine Connectivity
N8N_WEBHOOK_URL="http://localhost:5678/webhook"
N8N_WEBHOOK_SECRET="tg_dev_secret_key"
N8N_ENABLED=true
```

### In n8n Environment (`.env` or Docker env):
```env
TERRAGUARD_BACKEND_URL="http://backend:8000/api/v1"
TERRAGUARD_WEBHOOK_SECRET="tg_dev_secret_key"
```

---

## 3. Importing the Workflows

TerraGuard provides 6 ready-to-import production workflow templates in [`automation/n8n/workflows/`](./automation/n8n/workflows/):

1. `01_environmental_monitoring.json` — Scheduled 15m telemetry check & risk assessment trigger
2. `02_risk_threshold_detection.json` — Event-driven critical alert generation with deduplication
3. `03_citizen_report_processing.json` — Inbound report validation, AI vision analysis, & coordinator notifications
4. `04_alert_notification.json` — Multi-channel citizen advisory broadcast (Telegram, SMS, Push)
5. `05_response_task_creation.json` — Automated municipal crew dispatch with human-approval gates
6. `06_daily_intelligence_report.json` — Scheduled daily 06:00 AM situation synthesis

### To Import:
1. Open the n8n UI at `http://localhost:5678`.
2. In the top-right menu, select **Workflows** $\to$ **Import from File...**
3. Select any file from `automation/n8n/workflows/`.
4. Click **Save** and toggle the workflow switch to **Active**.

---

## 4. Production Deployment on Render

TerraGuard deploys n8n as a private Web Service on Render:
- **Build Command:** *(standard n8n docker image)* `n8nio/n8n:latest`
- **Disk:** 5 GB persistent disk mounted to `/home/node/.n8n`
- **Environment Variables:** Set `N8N_ENCRYPTION_KEY` and `WEBHOOK_URL` to your production domain.

