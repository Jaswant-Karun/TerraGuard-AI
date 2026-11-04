# TerraGuard AI — Cloud Deployment & DevOps Plan

**INFINEX 2K26 — Global AI Hackathon**

---

## 1. Hosting Architecture Overview

TerraGuard AI is engineered for multi-cloud production resilience:

- **Frontend Layer:** Hosted on **Vercel** for edge caching, asset delivery, and instant Next.js App Router performance.
- **Backend API Gateway & AI Services:** Hosted on **Render** as a containerized Python FastAPI web service with auto-scaling and continuous zero-downtime deployment from GitHub.
- **Automation Engine:** Hosted on **Render** as a dedicated Docker service with an attached **Persistent Disk Volume** running `n8nio/n8n`.
- **Database:** Hosted on **MongoDB Atlas** with automated automated GeoJSON `2dsphere` indexes, encrypted connections (TLS 1.3), and automated backups.

```
                      +-----------------------------+
                      |         GitHub Repo         |
                      |  (jaswant-karun/TerraGuard) |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v (Push to main / PR)                         v (Push to main / PR)
    +-------------------+                         +-------------------+
    |   Vercel Edge     |                         |   Render Cloud    |
    | (Next.js Frontend)|                         | (FastAPI Service) |
    +---------+---------+                         +---------+---------+
              |                                             |
              | HTTPS API Requests                          | Async MongoDB Driver
              +---------------------------------------------+
                                                            |
                                      +---------------------+---------------------+
                                      |                                           |
                                      v                                           v
                          +------------------------+                 +-------------------------+
                          |   MongoDB Atlas M0/M10 |                 |   Render n8n Service    |
                          |  (Database: terraguard)|                 | (Persistent Disk Volume)|
                          +------------------------+                 +-------------------------+
```

---

## 2. Environment Variables & Secret Configuration

> [!WARNING]
> Secrets must NEVER be committed to Git. All secrets are injected exclusively via cloud provider environment dashboards or local uncommitted `.env` files.

### 2.1 Frontend Environment (`frontend/.env.local` / Vercel Environment)

| Variable Name | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Render FastAPI public URL | `https://terraguard-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_MAP_TILE_URL` | MapLibre basemap style | `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json` |
| `NEXT_PUBLIC_DEFAULT_LAT` | Default center latitude | `12.9716` |
| `NEXT_PUBLIC_DEFAULT_LNG` | Default center longitude | `77.5946` |
| `NEXT_PUBLIC_APP_NAME` | Branding title | `TerraGuard AI` |

### 2.2 Backend Environment (`backend/.env` / Render Web Service)

| Variable Name | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `PROJECT_NAME` | Application name | `TerraGuard AI Backend` |
| `API_V1_STR` | API prefix string | `/api/v1` |
| `ENVIRONMENT` | Environment mode | `production` / `development` |
| `MONGODB_URI` | Atlas MongoDB connection string | `mongodb+srv://admin:<PWD>@cluster.mongodb.net/terraguard?retryWrites=true&w=majority` |
| `DATABASE_NAME` | Database identifier | `terraguard` |
| `GEMINI_API_KEY` | Google Gemini 2.0 API Key | Secret Google API Key |
| `JWT_SECRET_KEY` | Secret for HMAC token signing | 64-char random hex string |
| `JWT_ALGORITHM` | JWT hashing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration window | `1440` (24 hours) |
| `CLOUDINARY_URL` | Cloudinary credentials URL | `cloudinary://api_key:api_secret@cloud_name` |
| `N8N_WEBHOOK_URL` | Render n8n service webhook base | `https://terraguard-n8n.onrender.com/webhook` |
| `N8N_WEBHOOK_SECRET` | Shared HMAC secret for webhooks | 48-char random string |
| `CORS_ORIGINS` | Permitted client origins | `["https://terraguard.vercel.app","http://localhost:3000"]` |

### 2.3 n8n Environment (Render Persistent Container)

| Variable Name | Description | Value |
| :--- | :--- | :--- |
| `N8N_ENCRYPTION_KEY` | Key for workflow credential encryption | 32-char hex string |
| `WEBHOOK_URL` | Public webhook URL prefix | `https://terraguard-n8n.onrender.com/` |
| `N8N_BASIC_AUTH_ACTIVE` | Enables console login security | `true` |
| `N8N_BASIC_AUTH_USER` | Administrator username | `admin` |
| `N8N_BASIC_AUTH_PASSWORD` | Administrator password | High-entropy password |
| `N8N_METRICS` | Prometheus metrics | `true` |

---

## 3. Render Infrastructure Specifications

### 3.1 Backend FastAPI Service (`Dockerfile`)

```dockerfile
FROM python:3.11-slim as base

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3.2 n8n Service on Render

- **Service Type:** Web Service
- **Runtime:** Docker (`n8nio/n8n:latest`)
- **Disk Mount:** `/home/node/.n8n` (Size: 1 GB–5 GB persistent volume)
- **Port:** `5678`

---

## 4. Vercel Configuration (`frontend/vercel.json`)

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "cleanUrls": true
}
```

---

## 5. Verification & Pre-Flight Smoke Test Checklist

Before declaring the system live for the INFINEX 2K26 hackathon:

- [ ] **Database Connectivity:** Verify MongoDB Atlas network access allows Render's outbound IPs and the `2dsphere` index exists on `incidents.location` and `telemetry_readings.location`.
- [ ] **Backend Health Check:** Verify `GET /api/v1/health` returns `status: "healthy"` and latency < 50ms.
- [ ] **AI Model Verification:** Verify Gemini Vision endpoint analyzes test image and returns valid JSON matching `GeminiHazardAnalysis`.
- [ ] **n8n Webhook Test:** Trigger test webhook and confirm delivery receipt logged in `action_logs`.
- [ ] **Frontend Production Build:** Execute `npm run build` with zero TypeScript errors or broken imports.
- [ ] **Map Rendering:** Open command center and verify OpenStreetMap vector tiles load crisply with reactive incident pins.
