# TerraGuard AI
### AI-Powered Urban Risk Intelligence, Prediction & Disaster Prevention Platform
**Predict. Prevent. Protect.**

*INFINEX 2K26 — Global AI Hackathon*  
*Target UN SDGs: 3, 6, 9, 11, 13*

---

## 🏛️ System Architecture Documents

The full architectural foundation of TerraGuard AI has been established and audited across the following documents:

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

## 📂 Repository Structure

```
TerraGuard-AI/
|-- frontend/                 # Next.js 14/15, TypeScript, Tailwind CSS, MapLibre GL JS, Framer Motion
|-- backend/                  # FastAPI async API, Motor MongoDB, Gemini Vision SDK, XGBoost
|-- n8n/                      # Isolated workflow automation engine, webhook configurations
|-- scripts/                  # Spatial seeding, synthetic hazard simulations, ML training scripts
|-- docs/                     # Deep technical specifications & architectural diagrams
|-- PROJECT_ARCHITECTURE.md   # Master System Architecture
|-- DEVELOPMENT_ROADMAP.md    # Phased execution plan
|-- TECH_STACK.md             # Stack matrix & dependencies
|-- DATABASE_DESIGN.md        # MongoDB Atlas & 2dsphere schema
|-- API_DESIGN.md             # REST API v1 contracts
|-- AI_AGENT_ARCHITECTURE.md  # Gemini Vision & ML predictive engine
|-- N8N_WORKFLOW_ARCHITECTURE.md # Automation pipelines & webhooks
`-- DEPLOYMENT_PLAN.md        # Vercel & Render deployment blueprints
```

---

## 🎨 UI/UX Design System Direction
- **Command Center Aesthetic:** Premium smart-city control cockpit.
- **Canvas / Dashboard:** Crisp light-mode surfaces (`#F8FAFC`, `#FFFFFF`) for daytime operational clarity.
- **Sidebar & Shell:** Deep Midnight Navy (`#0B132B`, `#1C2541`).
- **Feature Accents:** Vibrant Cyan (`#06B6D4`) and Marine Blue (`#0284C7`).
- **Geospatial Engine:** MapLibre GL JS with OpenStreetMap vector tiles and real-time hazard overlays.

