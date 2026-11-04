# TerraGuard AI — Development Roadmap & Phased Execution Plan

**INFINEX 2K26 — Global AI Hackathon**

---

## 1. Roadmap Principles & Rules

To ensure rock-solid stability, zero duplicate code, and full end-to-end integration:

1. **Incremental, Phased Execution:** Each phase is executed, verified, and audited independently.
2. **Never Generate the Entire Application at Once:** Single-prompt massive generation causes broken APIs, hallucinated imports, and inconsistent UI.
3. **Continuous Operability:** The codebase must compile, pass tests, and remain runnable at the conclusion of every single phase.
4. **No Mock Data in Production:** Explicit degraded states and real fallback handlers are required.
5. **Phase Gates:** Work on Phase \(N+1\) begins only after Phase \(N\) satisfies all verification criteria.

---

## 2. Phase-by-Phase Roadmap

```
+-------------------------------------------------------------------------------------------------------+
| PHASE 0: Audit & Architecture Foundation (Current Phase)                                             |
| Deliverables: Full architecture docs, database schema, API contracts, AI spec, roadmap approval.   |
+-------------------------------------------------------------------------------------------------------+
                                                   |
                                                   v
+-------------------------------------------------------------------------------------------------------+
| PHASE 1: Monorepo Foundation & Toolchain Initialization                                               |
| Deliverables: Next.js + Tailwind + Framer Motion setup, FastAPI core skeleton, clean monorepo scripts.|
+-------------------------------------------------------------------------------------------------------+
                                                   |
                                                   v
+-------------------------------------------------------------------------------------------------------+
| PHASE 2: Database Layer & Async Data Access Architecture                                              |
| Deliverables: MongoDB Atlas Motor connection, 2dsphere GeoJSON indices, Pydantic v2 domain models.    |
+-------------------------------------------------------------------------------------------------------+
                                                   |
                                                   v
+-------------------------------------------------------------------------------------------------------+
| PHASE 3: Live Telemetry Ingestion & Environmental Intelligence                                        |
| Deliverables: Open-Meteo & OpenAQ connectors, spatial caching, real-time weather & AQI sync.        |
+-------------------------------------------------------------------------------------------------------+
                                                   |
                                                   v
+-------------------------------------------------------------------------------------------------------+
| PHASE 4: AI & ML Engine (Vision Hazard Classifier + Predictive Risk Engine)                           |
| Deliverables: Gemini 2.0 Vision analysis, Scikit-learn/XGBoost risk models, Explainable AI insights.  |
+-------------------------------------------------------------------------------------------------------+
                                                   |
                                                   v
+-------------------------------------------------------------------------------------------------------+
| PHASE 5: n8n Automation Engine & Webhook Architecture                                                 |
| Deliverables: Bidirectional webhooks, automated escalation flows, multi-channel dispatch pipelines.   |
+-------------------------------------------------------------------------------------------------------+
                                                   |
                                                   v
+-------------------------------------------------------------------------------------------------------+
| PHASE 6: Frontend Command Center & Geospatial Cockpit                                                 |
| Deliverables: Light canvas / Dark navy sidebar UI, MapLibre GL JS integration, Recharts analytics.    |
+-------------------------------------------------------------------------------------------------------+
                                                   |
                                                   v
+-------------------------------------------------------------------------------------------------------+
| PHASE 7: Citizen Hazard Reporting & Real-Time Incident Management                                   |
| Deliverables: Mobile-responsive incident portal, camera capture, geocoding, triage dispatch queue.    |
+-------------------------------------------------------------------------------------------------------+
                                                   |
                                                   v
+-------------------------------------------------------------------------------------------------------+
| PHASE 8: Production Audit, Cloud Deployment & Hackathon Polish                                        |
| Deliverables: Vercel frontend deploy, Render backend deploy, Render n8n deploy, live demo validation. |
+-------------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Phase Breakdown & Exit Criteria

### Phase 0: Project Audit & Development Foundation (CURRENT)

- [x] Workspace file inspection & audit.
- [x] Master architecture specification (`PROJECT_ARCHITECTURE.md`).
- [x] Comprehensive roadmap document (`DEVELOPMENT_ROADMAP.md`).
- [x] Complete technology stack and dependency manifest (`TECH_STACK.md`).
- [x] MongoDB Atlas schema and 2dsphere indexing plan (`DATABASE_DESIGN.md`).
- [x] RESTful API endpoints and Pydantic specification (`API_DESIGN.md`).
- [x] Gemini Vision and ML risk model architecture (`AI_AGENT_ARCHITECTURE.md`).
- [x] n8n automation and webhook workflow specification (`N8N_WORKFLOW_ARCHITECTURE.md`).
- [x] Deployment strategy for Vercel, Render, and Atlas (`DEPLOYMENT_PLAN.md`).
- **Gate:** Architect review and user approval before touching code.

### Phase 1: Monorepo Setup & Scaffolding

- Directory structure creation (`frontend/`, `backend/`, `n8n/`, `scripts/`).
- Initialize Next.js 14/15 App Router with TypeScript, Tailwind CSS, Lucide React, and Framer Motion.
- Initialize FastAPI Python 3.11+ application with poetry/pip-tools, virtualenv, and base dependencies.
- Configure root `.gitignore`, `.env.example`, and package management scripts.
- **Gate:** Both frontend and backend start locally without errors (`npm run dev`, `uvicorn app.main:app`).

### Phase 2: Database Layer & Spatial Data Access

- Asynchronous Motor MongoDB client lifecycle with health check ping.
- Configuration of collections: `incidents`, `telemetry_readings`, `risk_zones`, `users`, `action_logs`.
- Programmatic creation of `2dsphere` indexes on coordinates and compound indices for timestamps.
- Pydantic v2 schemas for all document models with GeoJSON Point/Polygon validation.
- Database seeder script to populate realistic sample urban zones (e.g., test city coordinates).
- **Gate:** Automated test connects to MongoDB, creates 2dsphere index, inserts GeoJSON document, and executes a `$nearSphere` query successfully.

### Phase 3: Telemetry Ingestion Services

- Open-Meteo API async client (precipitation, wind speed, temperature, pressure).
- OpenAQ API async client (PM2.5, PM10, NO2, O3).
- Ingestion worker / scheduled fetcher caching recent readings into MongoDB.
- Graceful error handling for missing coverage or rate-limits (HTTP 429/503).
- **Gate:** Running telemetry endpoint fetches real live data for a given latitude/longitude and caches it into the database with timestamp and spatial coordinates.

### Phase 4: AI & ML Engine

- Google Gemini 2.0 Vision API client for hazard classification:
  - Input: Image URL or Base64 byte stream + GPS location + user description.
  - Output: Hazard category (Flood, Fire, Landslide, Debris, Structural Damage), severity rating (1–5), confidence score, and suggested immediate municipal mitigation action.
- XGBoost / Scikit-learn Risk Engine:
  - Multi-factor risk calculation combining live rainfall, topography/elevation, historical incidents, and drainage capacity.
  - Explainable AI summary (key contributing risk factors).
- **Gate:** Test script sends a sample hazard photo to the Gemini Vision service and receives structured JSON meeting Pydantic schema validation.

### Phase 5: n8n Automation Engine & Webhook Architecture

- n8n configuration specification on Render with dedicated persistent volume / isolated DB.
- Webhook endpoints in FastAPI to dispatch events (`hazard.detected`, `risk.critical`, `report.submitted`).
- n8n workflows:
  - *Workflow 1:* High-severity disaster escalation (SMS/Email/Webhook alert dispatch).
  - *Workflow 2:* Citizen report verification & automated department routing.
  - *Workflow 3:* Hourly environmental telemetry sync & stale data health check.
- **Gate:** FastAPI fires an alert webhook, received and processed by n8n, returning an HTTP 200 acknowledgment.

### Phase 6: Frontend Command Center & Geospatial Cockpit

- Implementation of the approved design system:
  - Deep Navy navigation sidebar (`#0B132B`).
  - Clean light dashboard background (`#F8FAFC`).
  - Cyan and Blue accents (`#06B6D4`, `#0284C7`).
- MapLibre GL JS integration:
  - Vector tile rendering with OpenStreetMap basemap.
  - GeoJSON hazard layer with dynamic risk-colored circle markers.
  - Heatmap layer for high-density incidents.
  - Interactive popup modals with telemetry summaries.
- Recharts dashboard widgets:
  - 24-hour rainfall and river gauge trendlines.
  - Air Quality Index (AQI) radar and particulate breakdown.
  - Real-time incident severity breakdown donut chart.
- Framer Motion page transitions and card hover states.
- **Gate:** Interactive dashboard loads live data from FastAPI backend with reactive map controls and responsive layout.

### Phase 7: Citizen Incident Reporting & Incident Triage

- Citizen reporting page:
  - Mobile-first responsive UI.
  - Image upload with client-side compression and Cloudinary storage.
  - HTML5 Geolocation API with manual pin adjustment on mini-map.
  - Immediate AI preliminary assessment feedback preview.
- Emergency Responder / Admin Triage Portal:
  - Real-time incident queue with filtering by severity, category, and status.
  - One-click status update (`PENDING`, `VERIFIED`, `DISPATCHED`, `RESOLVED`).
  - Action audit log tracking time to response.
- **Gate:** User submits an incident report via the UI; report is stored in MongoDB, analyzed by Gemini, and appears on the command-center map within 2 seconds.

### Phase 8: Production Audit, Deployment & Verification

- Frontend deployment to Vercel (environment variables, production build optimization).
- Backend deployment to Render (Dockerized web service, connection pooling, CORS hardening).
- n8n deployment to Render (persistent volume, security keys).
- Production health checks, end-to-end integration test, and final documentation polish.
- **Gate:** Public Vercel URL communicates seamlessly with public Render backend and live MongoDB Atlas cluster.
