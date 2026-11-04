# TerraGuard AI — Urban Risk Intelligence Platform

### Predict. Prevent. Protect

**INFINEX 2K26 — Global AI Hackathon**  
*UN Sustainable Development Goals (SDGs): 3, 6, 9, 11, 13*

---

## 🏛️ System Architecture Documents

The master architectural foundation of TerraGuard AI:

| Specification Document | Focus & Contents |
| :--- | :--- |
| **[`PROJECT_ARCHITECTURE.md`](PROJECT_ARCHITECTURE.md)** | End-to-end system topology, monorepo breakdown, UI design principles, and security boundaries |
| **[`DEVELOPMENT_ROADMAP.md`](DEVELOPMENT_ROADMAP.md)** | 9-Phase incremental implementation roadmap with strict exit criteria and quality gates |
| **[`TECH_STACK.md`](TECH_STACK.md)** | Detailed library versions, Architecture Decision Records (ADRs), and layer responsibilities |
| **[`DATABASE_DESIGN.md`](DATABASE_DESIGN.md)** | MongoDB Atlas collections, GeoJSON schemas (`Point`, `Polygon`), and `2dsphere` spatial indexing plan |
| **[`API_DESIGN.md`](API_DESIGN.md)** | RESTful FastAPI v1 endpoint contracts, request/response models, and error states |
| **[`AI_AGENT_ARCHITECTURE.md`](AI_AGENT_ARCHITECTURE.md)** | Multimodal Gemini 2.0 Vision analysis, XGBoost predictive risk engine, and Explainable AI (XAI) |
| **[`N8N_WORKFLOW_ARCHITECTURE.md`](N8N_WORKFLOW_ARCHITECTURE.md)** | Event-driven webhook contracts, emergency escalation pipelines, and database isolation rules |
| **[`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md)** | Multi-cloud deployment plan for Vercel, Render (API & n8n Docker), and MongoDB Atlas |

---

## 📁 Repository Layout

```
TerraGuard-AI/
├── apps/
│   ├── web/                     # Next.js 14 App Router, React 18, TypeScript, Tailwind CSS
│   │   ├── app/                 # App Router pages and route handlers
│   │   │   ├── api/health/      # Frontend health check probe
│   │   │   ├── layout.tsx       # Root layout with command center theme
│   │   │   └── page.tsx         # Command Center Cockpit & Status Ticker
│   │   ├── components/ui/       # Design system primitives
│   │   ├── features/            # Domain-driven feature modules
│   │   │   ├── dashboard/       # Metric cards, triage board
│   │   │   ├── maps/            # MapLibre GL JS vector viewer & layer controls
│   │   │   ├── risk/            # Predictive risk gauges & XAI factors
│   │   │   ├── reports/         # Citizen reporting & triage review
│   │   │   ├── navigation/      # Midnight Navy navigation sidebar
│   │   │   ├── ai-command/      # Gemini Vision hazard inspector
│   │   │   ├── automation/      # n8n webhook status monitors
│   │   │   ├── analytics/       # Recharts timeseries widgets
│   │   │   └── admin/           # Municipal operations & user RBAC
│   │   ├── hooks/               # Custom React hooks (useMap, useTelemetry)
│   │   ├── lib/                 # Shared utilities (cn, date-fns)
│   │   ├── services/            # Centralized API service connecting to backend /api/v1
│   │   ├── types/               # TypeScript interfaces & GeoJSON typings
│   │   ├── public/              # Static assets & icons
│   │   └── styles/              # Tailwind CSS directives & custom scrollbars
│   │
│   └── backend/                 # Python 3.11+ FastAPI Async Backend
│       ├── app/
│       │   ├── api/v1/          # Versioned REST API endpoints (/api/v1/health)
│       │   ├── core/            # Config (Pydantic v2 BaseSettings), logging, errors
│       │   ├── models/          # MongoDB document models (Phase 2)
│       │   ├── schemas/         # Pydantic validation schemas
│       │   ├── services/        # Business logic & external API connectors
│       │   ├── repositories/    # Async database access layer
│       │   ├── agents/          # Gemini Vision hazard classifier
│       │   ├── ml/              # Scikit-learn & XGBoost risk models
│       │   ├── integrations/    # Open-Meteo, OpenAQ, Cloudinary
│       │   ├── workflows/       # n8n webhook dispatchers
│       │   └── utils/           # Geospatial & helper utilities
│       ├── tests/               # Pytest suite with async ASGI test client
│       ├── requirements.txt     # Locked production dependencies
│       └── main.py              # Application entrypoint & CORS middleware
│
├── automation/
│   └── n8n/                     # Isolated n8n automation engine specifications
│       ├── workflows/           # Exported JSON automation workflows
│       ├── documentation/       # Webhook contracts & integration guides
│       └── examples/            # Example webhook events & payloads
│
├── docs/                        # Architectural blueprints & diagrams
├── infrastructure/              # Cloud infrastructure manifests (Render, Vercel)
├── scripts/                     # Geospatial seeders, simulators, & ML training
├── .env.example                 # Root environment template
├── .gitignore                   # Production git exclusion list
├── package.json                 # Monorepo orchestration scripts
└── README.md                    # Setup & developer documentation
```

---

## 🚀 Quick Start & Local Development

### Prerequisites

- **Node.js**: `v18+` or `v20+` (Tested on `v22.17.0`)
- **Python**: `3.11+` (Tested on `3.13.5`)
- **npm**: `v10+`

---

### 1. Backend Setup (FastAPI)

1. Open a terminal in the project root:

   ```powershell
   cd apps/backend
   ```

2. Activate the virtual environment:
   - **Windows:**

     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```

   - **macOS / Linux:**

     ```bash
     source .venv/bin/activate
     ```

3. Install dependencies (if not already installed):

   ```bash
   pip install -r requirements.txt
   ```

4. Copy the environment template:

   ```powershell
   cp .env.example .env
   ```

5. Run the FastAPI development server:

   ```powershell
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

6. Verify Backend:
   - **OpenAPI Interactive Documentation:** [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
   - **System Health Check:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
   - **Run Test Suite:**

     ```powershell
     pytest tests/
     ```

---

### 2. Frontend Setup (Next.js)

1. Open a second terminal in the project root:

   ```powershell
   cd apps/web
   ```

2. Copy the environment template:

   ```powershell
   cp .env.example .env.local
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the Next.js development server:

   ```bash
   npm run dev
   ```

5. Open your browser:
   - **Command Center Dashboard:** [http://localhost:3000](http://localhost:3000)
   - **Frontend Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

### 3. Monorepo Root Shortcuts

From the root directory, you can also execute:

```bash
# Start frontend
npm run dev:web

# Build frontend
npm run build:web

# Run backend tests
npm run test:backend
```

---

## 🎨 UI Design System Rules

- **Canvas:** Light neutral background (`#F8FAFC`, `#FFFFFF`)
- **Navigation:** Deep Midnight Navy (`#0B132B`, `#1C2541`)
- **Accents:** Electric Cyan (`#06B6D4`) & Marine Blue (`#0284C7`)
- **Hazard Semantics:**
  - `Low`: Emerald Green (`#10B981`)
  - `Moderate`: Amber Gold (`#F59E0B`)
  - `High`: Vibrant Orange (`#F97316`)
  - `Critical`: Vivid Rose / Crimson (`#F43F5E`)
- **Map:** MapLibre GL JS vector tiles with real-time reactive GeoJSON layers
