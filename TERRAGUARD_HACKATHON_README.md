# TerraGuard AI 2.0 — Autonomous Urban Multi-Hazard Intelligence & Resilience Platform

<p align="center">
  <img src="https://img.shields.io/badge/Platform-TerraGuard%20AI%202.0-0A192F?style=for-the-badge&logo=shield" alt="TerraGuard AI"/>
  <img src="https://img.shields.io/badge/Next.js-14.2%20App%20Router-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/FastAPI-0.110%20Async-009688?style=for-the-badge&logo=fastapi" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas%202dsphere-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/n8n-Orchestration%20Engine-FF6D5A?style=for-the-badge&logo=n8n" alt="n8n"/>
  <img src="https://img.shields.io/badge/Hackathon-INFINEX%202K26-blueviolet?style=for-the-badge" alt="INFINEX 2K26"/>
</p>

---

## 🌐 Live Production Deployments
* **Production Web Dashboard (Vercel):** [https://terra-guard-ai-chi.vercel.app](https://terra-guard-ai-chi.vercel.app)
* **Production API Service (Render):** [https://terraguard-ai-xo6s.onrender.com/api/v1](https://terraguard-ai-xo6s.onrender.com/api/v1)
* **Interactive API Documentation:** [Swagger UI Docs](https://terraguard-ai-xo6s.onrender.com/api/v1/docs)
* **n8n Automation Engine:** [Render Docker Webhook Gateway](https://terraguard-n8n.onrender.com)

---

## 🎯 The Real-World Challenge
Modern megacities like Bengaluru, Mumbai, and Jakarta face acute compounding climate emergencies. Intense convective cloudbursts dump $75+\text{ mm}$ of rain in under an hour, overwhelming stormwater networks and stranding thousands of citizens. Existing municipal emergency management suffers from:
* Disconnected data silos between weather radars, air quality sensors, and citizen hotlines.
* Delayed manual triage of citizen distress reports.
* Black-box predictive models that offer no explainability or uncertainty bounds.
* Forward-looking models that never verify predictions against empirical ground-truth outcomes.
* Decorative maps that use uncalibrated heatmaps or static tiles.

---

## 💡 The TerraGuard AI Solution
TerraGuard AI 2.0 is an autonomous, event-driven urban climate resilience platform that unifies real-time environmental telemetry, deep learning hydrological simulations, explainable AI directives, and automated municipal emergency dispatches into a single operational interface.

### Core Capabilities:
1. **Map Intelligence Studio 2.0:** 11 specialized map views spanning optical satellite GIS, calibrated flood inundation vectors, Doppler radar isohyets, digital elevation contours, heat vulnerability, air quality dispersal, and risk-aware evacuation routing.
2. **Closed-Loop Prediction Verification:** Automatically tracks predictive forecast accuracy ($|y_{\text{pred}} - y_{\text{obs}}|$) against real stormwater depth sensors, logging verified outcomes to MongoDB.
3. **Mandatory 4-Tier Provenance Separation:** Transparent visual tags distinguish between physical sensor readings, audited EOC incidents, ML models, and LLM generative syntheses.
4. **n8n Autonomous Workflows:** 6 event-driven automation pipelines managing sensor polling, alert thresholds, duplicate suppression, and field squad dispatch.

---

## 🗺️ The 11 Map Studio Intelligence Experiences

1. **Map 1 — Operational Satellite GIS:** High-resolution Esri optical imagery + active trauma hospitals, shelters, and drainage channels.
2. **Map 2 — Flood Risk Intelligence:** Calibrated Hydro-UNet v2.4 susceptibility polygons with population-at-risk metrics.
3. **Map 3 — Live Rainfall Telemetry:** Real-time Open-Meteo gauges with radial precipitation scales and historical hyetographs.
4. **Map 4 — Elevation & Terrain Benchmark:** NASA SRTM 30m contour lines and ridge benchmarks for hydrological runoff analysis.
5. **Map 5 — Water Bodies & Culverts:** OpenStreetMap hydrological networks detailing lake perimeters and stormwater drains.
6. **Map 6 — Extreme Heat Vulnerability:** NOAA Rothfusz apparent temperature polygons calculating urban heat island wet-bulb depressions.
7. **Map 7 — Air Quality Intelligence:** Continuous CAAQMS air quality stations with Indian NAQI multi-pollutant plume overlays.
8. **Map 8 — Citizen Hazard Reports:** Crowdsourced mobile submissions with automated AI vision confidence scores and duplicate filtering.
9. **Map 9 — Verified Municipal Incidents:** Ground-truthed emergency triage points confirmed by on-duty EOC supervisors.
10. **Map 10 — Critical Infrastructure:** Civil defense facilities, power substations, and transit hubs with flood clearance metrics.
11. **Map 11 — Safe Navigation & Risk Routing:** Dynamic topological pathfinding avoiding active inundation zones.

---

## 🛠️ Technology Stack
* **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, MapLibre GL JS, Framer Motion, Lucide Icons.
* **Backend:** FastAPI, Python 3.11, Uvicorn, Pydantic v2, SlowAPI Rate Limiting, Motor (Async MongoDB).
* **Machine Learning:** PyTorch (Hydro-UNet v2.4), Scikit-Learn (XGBoost Classifier), Google Gemini 2.5 Multi-Agent System.
* **Data & Persistence:** MongoDB Atlas (GeoJSON 2dsphere indexing), Redis/In-Memory LRU Caches.
* **Automation:** n8n Workflow Automation, HMAC-SHA256 Webhook Verification.
* **Deployment:** Vercel Edge Network (Web) + Render Cloud Services (API & n8n Docker).

---

## 🚀 Local Quickstart Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Jaswant-Karun/TerraGuard-AI.git
cd TerraGuard-AI
npm install
```

### 2. Configure Environment Variables
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env.local
```

### 3. Run Backend Test Suite
```bash
cd apps/backend
pytest tests -v
# 127 passed in 120s
```

### 4. Start Local Development
```bash
# Terminal 1: FastAPI Backend
cd apps/backend
uvicorn main:app --reload --port 8000

# Terminal 2: Next.js Frontend
cd apps/web
npm run dev
# Accessible at http://localhost:3000
```

---

## 🏆 United Nations SDG Alignment
* **SDG 11 (Target 11.5):** Reduces casualties and economic damages from urban water-related disasters.
* **SDG 13 (Target 13.1):** Strengthens municipal resilience and adaptive capacity to acute climate shocks.
* **SDG 3 (Target 3.9):** Mitigates respiratory deaths via real-time air quality plumes and heat stroke via wet-bulb monitoring.
* **SDG 9 (Target 9.1):** Protects critical urban transit, healthcare, and civil defense infrastructure.
