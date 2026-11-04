# TerraGuard AI — Technology Stack & Dependency Specification

**INFINEX 2K26 — Global AI Hackathon**

---

## 1. Complete Architecture Layer Matrix

| Layer | Selected Technology | Target Version | Primary Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | `14.x / 15.x` | Hybrid Server/Client rendering, lightning-fast edge performance, optimized bundle routing |
| **UI Library** | React | `18.x / 19.x` | Industry standard component architecture, concurrent rendering, rich ecosystem |
| **Language (Web)** | TypeScript | `5.x` | Compile-time type safety, end-to-end interface contracts matching backend Pydantic models |
| **CSS & Styling** | Tailwind CSS | `3.4+` | Rapid utility-first styling, consistent command-center design tokens, zero runtime CSS overhead |
| **Animation Engine** | Framer Motion | `11.x` | Production-grade physics-based UI transitions, reactive counter animators, alert dialog entry/exit |
| **Geospatial Mapping** | MapLibre GL JS | `4.x` | High-performance WebGL vector tile rendering, zero API key requirement for OSM tiles, smooth 60fps interaction |
| **Map Tile Provider** | OpenStreetMap / Carto Light | Dynamic CDN | Clean light-mode basemap ensuring maximum contrast for colored hazard overlays and heatmaps |
| **Data Visualization** | Recharts | `2.12+` | Declarative SVG charting optimized for React, animated timeseries, responsive chart containers |
| **Iconography** | Lucide React | Latest | Clean, sharp, modern SVG icons matching command-center aesthetics |
| **Backend Framework** | Python FastAPI | `0.111+` | High-throughput asynchronous async/await API, automated OpenAPI docs, native Pydantic v2 support |
| **Async Web Server** | Uvicorn | `0.30+` | Lightning-fast ASGI production web server |
| **Data Validation** | Pydantic v2 | `2.7+` | Rust-core validation, strict type enforcement, GeoJSON coordinate schema validators |
| **Primary Database** | MongoDB Atlas | `7.0+` | Native GeoJSON `2dsphere` spatial indexing, flexible document schemas for diverse environmental telemetry |
| **Async DB Driver** | Motor (PyMongo async) | `3.4+` | Non-blocking database I/O integrated seamlessly with FastAPI event loops |
| **AI Vision & LLM** | Google Gemini 2.0 Flash / Pro | Google GenAI SDK | State-of-the-art multimodal image analysis, rapid hazard classification, and dynamic response generation |
| **ML Predictive Engine** | Scikit-Learn & XGBoost | Latest | Low-latency inference for tabular environmental risk scoring and flood/air risk regression |
| **Explainable AI (XAI)** | Feature Attribution / TreeExpl | Native | Transparent breakdown of risk score contributors (e.g., Rainfall: 42%, Elevation: 28%) |
| **Automation Engine** | n8n | Latest Docker | Visual low-code workflow automation, event-driven webhooks, multi-channel alerting |
| **Weather Telemetry** | Open-Meteo API | REST v1 | High-resolution precipitation, wind, humidity, and temperature data with zero API key constraints |
| **Air Quality Data** | OpenAQ API | REST v3 | Global air sensor data (PM2.5, PM10, NO2, SO2, CO) |
| **Media Asset Storage** | Cloudinary / S3-compatible | Python SDK | Automatic image optimization, CDN distribution, and secure upload signing for hazard imagery |
| **Frontend Hosting** | Vercel | Production | Global edge network, automatic preview deployments, zero-config Next.js optimization |
| **Backend Hosting** | Render | Docker Web Service | Fully managed containerized hosting, persistent env secrets, zero-downtime deploys |
| **Automation Hosting** | Render | Docker with Disk | Isolated container with persistent storage volume for n8n workflow execution history |
| **Source Control** | GitHub | Git | Branch protection, PR workflows, automated CI checks |

---

## 2. Dependency Breakdown

### 2.1 Frontend Dependencies (`frontend/package.json`)

```json
{
  "name": "terraguard-ai-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "maplibre-gl": "^4.5.0",
    "framer-motion": "^11.3.19",
    "recharts": "^2.12.7",
    "lucide-react": "^0.417.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.4.0",
    "axios": "^1.7.2",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "@types/node": "^20.14.12",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/maplibre-gl": "^1.14.0",
    "tailwindcss": "^3.4.7",
    "postcss": "^8.4.40",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.5"
  }
}
```

### 2.2 Backend Dependencies (`backend/requirements.txt`)

```txt
fastapi>=0.111.0,<0.112.0
uvicorn[standard]>=0.30.0,<0.31.0
pydantic>=2.7.4,<3.0.0
pydantic-settings>=2.3.4
motor>=3.4.0,<4.0.0
pymongo>=4.7.2,<5.0.0
httpx>=0.27.0,<0.28.0
google-genai>=0.1.1
scikit-learn>=1.5.0
xgboost>=2.0.3
numpy>=1.26.4
pandas>=2.2.2
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.9
cloudinary>=1.40.0
python-dotenv>=1.0.1
```

---

## 3. Technology Rationale & Architecture Decision Records (ADRs)

### ADR-01: MapLibre GL JS vs Google Maps / Leaflet

- **Context:** The core visual focus of TerraGuard AI is an interactive, real-time smart-city command map.
- **Decision:** Use **MapLibre GL JS** over Leaflet or Google Maps.
- **Justification:** Leaflet relies on HTML DOM markers which suffer frame-rate degradation when rendering thousands of sensor points or polygon zones. Google Maps incurs heavy per-load billing and restrictive styling controls. MapLibre GL JS runs on high-performance WebGL, renders dynamic vector data smoothly at 60 FPS, supports hardware-accelerated heatmaps and 3D terrain, and allows free tile fetching using open standards.

### ADR-02: Asynchronous Motor Driver vs Synchronous ORM

- **Context:** Environmental telemetry ingestion requires handling concurrent polling streams from Open-Meteo, OpenAQ, citizen uploads, and dashboard websocket/polling queries without blocking.
- **Decision:** Utilize **Motor (async MongoDB driver)** with Pydantic v2 schemas.
- **Justification:** Motor integrates directly into Python's `asyncio` event loop. Synchronous drivers (like vanilla PyMongo or standard SQL ORMs without async session pools) would bottleneck under concurrent webhook traffic.

### ADR-03: Isolation of n8n Automation Engine Database

- **Context:** n8n requires its own database to store execution logs, node states, and credentials.
- **Decision:** n8n will **NEVER** share collections or database instances with TerraGuard AI's MongoDB Atlas cluster.
- **Justification:** Mixing automation runner metadata with production business domains risks accidental schema conflicts, table locks, and elevated security privileges. n8n will run with its own dedicated persistent volume on Render (or SQLite/Postgres container).
