# TerraGuard AI — Project Architecture & System Design
**INFINEX 2K26 — Global AI Hackathon**
*Tagline: Predict. Prevent. Protect.*

---

## 1. Executive Summary & Mission
**TerraGuard AI** is an enterprise-grade, production-style urban risk intelligence, predictive environmental analytics, and automated disaster prevention platform. Designed for municipal authorities, emergency dispatch teams, urban planners, environmental monitoring organizations, and citizens, TerraGuard AI bridges the gap between passive sensor telemetry and active, automated disaster prevention.

The system addresses **UN Sustainable Development Goals (SDGs)**:
- **SDG 3:** Good Health and Well-Being (Early hazard mitigation, air quality monitoring)
- **SDG 6:** Clean Water and Sanitation (Urban flood run-off, drainage and water contamination warnings)
- **SDG 9:** Industry, Innovation, and Infrastructure (Climate-resilient urban infrastructure)
- **SDG 11:** Sustainable Cities and Communities (Smart-city emergency response and spatial risk mitigation)
- **SDG 13:** Climate Action (Predictive intelligence against climate disasters)

---

## 2. High-Level System Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                      TERRAGUARD AI PLATFORM                                       |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  CLIENT / PRESENTATION TIER (Vercel)                                                               |
|  +-----------------------------------------------------------------------------------------------+ |
|  | Next.js App Router (React 19 / TypeScript / Tailwind CSS)                                     | |
|  | - Command Center Dashboard (Light Canvas #F8FAFC / Dark Navy Navigation #0B132B)             | |
|  | - MapLibre GL JS (Vector OpenStreetMap tiles, 3D terrain, dynamic GeoJSON hazard heatmaps)     | |
|  | - Recharts (Temporal risk trends, air/water sensor timeseries, incident metrics)             | |
|  | - Framer Motion (State transitions, telemetry pulses, alert modals, smooth animations)        | |
|  | - Citizen Incident Report Portal with Gemini Vision camera capture & GPS geocoding            | |
|  +-----------------------------------------------------------------------------------------------+ |
|                                                  |                                                 |
|                                       HTTPS / WSS REST API Calls                                   |
|                                                  v                                                 |
|  BACKEND API GATEWAY & SERVICES (Render)                                                          |
|  +-----------------------------------------------------------------------------------------------+ |
|  | FastAPI Async Web Framework (Python 3.11+)                                                     | |
|  | - Pydantic v2 Request/Response Validation & Sanitization                                      | |
|  | - Async Motor Driver / Connection Pool                                                         | |
|  | - JWT Authentication & RBAC (Citizen, Responder, Urban Admin, SuperAdmin)                     | |
|  | - Telemetry Ingestion Engine (Open-Meteo, OpenAQ, IoT feeds)                                     | |
|  | - Geospatial Query Router (MongoDB $geoWithin, $nearSphere, $geoIntersects)                    | |
|  | - Webhook Dispatcher to n8n Automation Engine                                                  | |
|  +-----------------------------------------------------------------------------------------------+ |
|           |                                 |                                 |                    |
|           v                                 v                                 v                    |
|  +------------------+             +-------------------+             +--------------------+         |
|  | AI & ML ENGINE   |             | PRIMARY DATABASE  |             | AUTOMATION ENGINE  |         |
|  | (FastAPI Submod) |             | (MongoDB Atlas)   |             | (n8n on Render)    |         |
|  +------------------+             +-------------------+             +--------------------+         |
|  | - Gemini Vision  |             | - GeoJSON 2dsphere|             | - Webhook receivers|         |
|  |   Hazard Analysis|             | - Temporal indices|             | - Multi-step alerts|         |
|  | - XGBoost &      |             | - Sensor time-    |             | - Telegram/SMS/    |         |
|  |   Scikit-Learn   |             |   series collec.  |             |   Email escalations|         |
|  |   Risk Predictors|             | - Incidents &     |             | - Scheduled health |         |
|  | - Explainable AI |             |   Citizen reports |             |   and sync jobs    |         |
|  |   (SHAP/TreeExpl)|             | - Audit trail &   |             | - Dedicated SQLite/|         |
|  | - Gemini 2.0     |             |   Action workflows|             |   Postgres storage |         |
|  |   Action Engine  |             |                   |             |   (Isolated DB)    |         |
|  +------------------+             +-------------------+             +--------------------+         |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Monorepo Repository Structure

The project adopts a structured, cleanly separated monorepo layout that prevents cross-layer coupling while facilitating simultaneous local development and independent cloud deployments (Vercel + Render).

```
TerraGuard-AI/
|-- .github/                          # CI/CD Workflows, PR templates, and automated tests
|   `-- workflows/
|       |-- frontend-ci.yml           # Lint, build check, and test frontend
|       `-- backend-ci.yml            # Flake8/Black, pytest, Pydantic model validation
|
|-- frontend/                         # Next.js 14/15 App Router Frontend
|   |-- src/
|   |   |-- app/                      # App router page routes & layouts
|   |   |   |-- (auth)/               # Login, Register, Forgot Password
|   |   |   |-- (dashboard)/          # Command center, map view, analytics, alerts
|   |   |   |   |-- command-center/   # Main real-time command dashboard
|   |   |   |   |-- map/              # Fullscreen geospatial interactive explorer
|   |   |   |   |-- incidents/        # Incident management & emergency triage
|   |   |   |   |-- predictions/      # ML risk prediction & simulation sandbox
|   |   |   |   `-- reports/          # Citizen reporting & verified hazard feed
|   |   |   |-- api/                  # Edge proxies or BFF endpoints (if required)
|   |   |   |-- layout.tsx            # Global HTML shell & context providers
|   |   |   `-- page.tsx              # Cinematic Smart-City Landing Page
|   |   |-- components/               # Modular UI Components
|   |   |   |-- ui/                   # Reusable primitive design system components
|   |   |   |-- map/                  # MapLibre GL wrapper, layers, cluster markers
|   |   |   |-- charts/               # Recharts components (Risk Gauges, Trend lines)
|   |   |   |-- navigation/           # Navy Sidebar, Topbar, Status ticker
|   |   |   |-- command-center/       # Metric cards, active alerts list, quick dispatch
|   |   |   `-- incidents/            # Image uploader, camera capture, Gemini tagger
|   |   |-- hooks/                    # Custom React hooks (useMap, useTelemetry, useAuth)
|   |   |-- lib/                      # API clients, Axios/Fetch wrappers, constants, utils
|   |   |-- types/                    # Shared TypeScript interfaces (GeoJSON, API DTOs)
|   |   `-- styles/                   # Tailwind globals, maplibre-gl.css overrides
|   |-- public/                       # Static assets, map markers, hazard icons, geo-demos
|   |-- package.json
|   |-- tsconfig.json
|   |-- tailwind.config.ts
|   `-- next.config.mjs
|
|-- backend/                          # FastAPI Python Async Application
|   |-- app/
|   |   |-- api/                      # Versioned API routes (v1)
|   |   |   |-- v1/
|   |   |   |   |-- router.py         # Consolidated API v1 router
|   |   |   |   |-- endpoints/
|   |   |   |   |   |-- auth.py       # JWT authentication & session endpoints
|   |   |   |   |   |-- incidents.py  # Incident reporting, verification, updates
|   |   |   |   |   |-- telemetry.py  # Weather, AQI, hydrological ingest & queries
|   |   |   |   |   |-- risks.py      # Spatial risk scoring & zone evaluations
|   |   |   |   |   |-- ai.py         # Gemini Vision analysis & mitigation generator
|   |   |   |   |   `-- webhooks.py   # Internal & n8n bidirectional webhooks
|   |   |-- core/                     # Application configuration & security
|   |   |   |-- config.py             # Pydantic Settings (ENV variables, secrets)
|   |   |   |-- database.py           # Motor async client & database connection lifecycle
|   |   |   |-- security.py           # Passlib bcrypt hashing, JWT issuance & validation
|   |   |   `-- exceptions.py         # Custom error handlers and HTTP standard mappings
|   |   |-- models/                   # Pydantic v2 schemas and request/response models
|   |   |   |-- incident.py           # GeoJSON Feature models for hazards
|   |   |   |-- telemetry.py          # Weather, particulate, flood sensor models
|   |   |   |-- risk.py               # Risk index models & factor breakdowns
|   |   |   `-- user.py               # User profiles, roles, and credentials
|   |   |-- services/                 # Business logic & third-party integrations
|   |   |   |-- open_meteo.py         # Open-Meteo precipitation & wind ingest service
|   |   |   |-- open_aq.py            # OpenAQ particulate & pollutant ingest service
|   |   |   |-- gemini_vision.py      # Google Gemini 2.0 / Vision API integration
|   |   |   |-- ml_risk_engine.py     # Scikit-Learn & XGBoost predictive inference
|   |   |   |-- geospatial.py         # MongoDB 2dsphere spatial calculations
|   |   |   |-- n8n_client.py         # Async webhook trigger & notification bridge
|   |   |   `-- storage.py            # Cloudinary/S3 image storage adapter
|   |   |-- ml_models/                # Serialized trained models & metadata (.json, .joblib)
|   |   `-- main.py                   # FastAPI application factory, CORS, and middleware
|   |-- tests/                        # Pytest suite
|   |-- requirements.txt              # Production Python dependencies
|   |-- requirements-dev.txt          # Linting, formatting, test tools
|   `-- Dockerfile                    # Container definition for Render backend deployment
|
|-- n8n/                              # Automation Workflows & Configuration
|   |-- workflows/                    # Exported JSON workflow definitions
|   |   |-- 01_critical_hazard_alert.json      # Flash flood / air spike immediate alerts
|   |   |-- 02_citizen_report_verification.json# Automated verification & dispatch flow
|   |   `-- 03_scheduled_telemetry_sync.json   # Periodic sensor pull and health check
|   |-- docker-compose.yml            # Local n8n development orchestration
|   `-- README.md                     # Render deployment guide with persistent SQLite/Postgres
|
|-- scripts/                          # Seeding, Simulation, & ML Training Scripts
|   |-- seed_geospatial_data.py       # Seeds realistic urban zones, sensors, and hazards
|   |-- train_flood_risk_model.py     # Trains flood prediction model on historical data
|   `-- train_air_quality_model.py    # Trains particulate/toxic gas spike predictor
|
|-- docs/                             # Deep architectural blueprints & specifications
|   |-- architecture/
|   `-- diagrams/
|
|-- PROJECT_ARCHITECTURE.md           # Master system architecture (this file)
|-- DEVELOPMENT_ROADMAP.md            # Step-by-step phased development plan
|-- TECH_STACK.md                     # Complete dependencies, versions, & rationale
|-- DATABASE_DESIGN.md                # MongoDB Atlas schemas, GeoJSON, and index plan
|-- API_DESIGN.md                     # Comprehensive REST endpoints and payload spec
|-- AI_AGENT_ARCHITECTURE.md          # Gemini Vision + ML risk orchestration spec
|-- N8N_WORKFLOW_ARCHITECTURE.md      # Webhook contracts, triggers, and notification flows
`-- DEPLOYMENT_PLAN.md                # Vercel + Render + Atlas deployment architecture
```

---

## 4. UI/UX Design System Specification

### 4.1 Visual Hierarchy & Aesthetic Target
TerraGuard AI adopts a **Premium Smart-City Command Center** aesthetic:
- **Canvas / App Surface:** Light, crisp neutrals (`#F8FAFC`, `#FFFFFF`, `#F1F5F9`) ensuring high daylight legibility, clean data visualization, and maximum map contrast.
- **Sidebar & Command Shell:** Deep Midnight Navy (`#0B132B`, `#1C2541`, `#1E293B`) creating an authoritative, modern control-tower presence.
- **Primary Feature Accents:** Electric Cyan (`#06B6D4`), Marine Blue (`#0284C7`), and Sky Blue (`#0EA5E9`) for active selections, map routes, and telemetry readouts.
- **Hazard Severity Palette:**
  - *Low / Stable:* Emerald Green (`#10B981`)
  - *Moderate / Watch:* Amber Gold (`#F59E0B`)
  - *High / Warning:* Vibrant Orange (`#F97316`)
  - *Critical / Danger:* Vivid Rose / Crimson (`#F43F5E`)
- **Interactive Geospatial Focus:** The map is the primary cockpit component—vector tiles with smooth layer toggling (heatmaps, contour lines, sensor clusters, risk zones, evacuation corridors).
- **Animation Framework:** Framer Motion delivers contextual micro-interactions, alert drawer expansions, realtime data counter ticks, and smooth tab switching.

---

## 5. Security & Isolation Architecture

1. **No Secret Ingestion in Client Bundles:** All Gemini API keys, Cloudinary secrets, and MongoDB connection strings remain exclusively on the FastAPI backend or Render environment variables.
2. **Database Domain Separation:** 
   - **MongoDB Atlas** stores all application domain data (telemetry, incidents, geospatial layers, predictions, user sessions).
   - **n8n Automation Engine** maintains its own isolated database (PostgreSQL or persistent SQLite volume on Render). n8n never shares collections with the main application to avoid schema collisions and lock contention.
3. **Authentication & Authorization:**
   - Stateless JWT tokens signed with HMAC-SHA256.
   - Granular Role-Based Access Control (RBAC): `CITIZEN`, `FIELD_RESPONDER`, `URBAN_PLANNER`, `CITY_ADMIN`.
4. **Resilient Fallback Design:** When external APIs (e.g., OpenAQ or Open-Meteo) experience rate limits or localized outages, the system surfaces an explicit `UNAVAILABLE_DEGRADED` banner with the last verified cache timestamp rather than generating synthetic "mock" live data.
