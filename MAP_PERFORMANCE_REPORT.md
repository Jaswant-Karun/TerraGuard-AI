# TerraGuard AI — Map Performance & Latency Report
**Module:** Map Intelligence Studio 2.0 (`/dashboard/map-studio`)  
**Benchmarking Tool:** Automated GIS QA Profiler & Chrome DevTools Lighthouse  
**Network Conditions:** Simulated 4G LTE & Broadband Fiber  
**Execution Environment:** Production Vercel Edge CDN + Render Cloud Backend  
**Performance Grade:** **A (98/100 Desktop / 94/100 Mobile)**

---

## 1. Production API Latency & Payload Benchmarks

Measured across 10 sequential sampling runs against the live production backend:

| Endpoint Path | Purpose | HTTP Status | Response Latency (ms) | Payload Size (Bytes) | Feature Count | Compression |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/health` | Backend Heartbeat | 200 OK | $184.2\text{ ms}$ | $245\text{ B}$ | 0 | Brotli |
| `/api/v1/maps/layers` | Layer Catalog Catalog | 200 OK | $195.1\text{ ms}$ | $6,864\text{ B}$ | 0 | Gzip |
| `/api/v1/maps/geojson/flood` | Flood Inundation Polygons | 200 OK | $171.1\text{ ms}$ | $3,719\text{ B}$ | 5 polygons | Gzip |
| `/api/v1/maps/geojson/heat` | Thermal Heat Index Grid | 200 OK | $204.9\text{ ms}$ | $2,661\text{ B}$ | 5 polygons | Gzip |
| `/api/v1/maps/geojson/air-quality` | AQI Dispersal Plumes | 200 OK | $200.0\text{ ms}$ | $2,154\text{ B}$ | 5 points | Gzip |
| `/api/v1/maps/geojson/reports` | Citizen Hazard Pins | 200 OK | $185.0\text{ ms}$ | $2,782\text{ B}$ | 4 points | Gzip |
| `/api/v1/maps/geojson/verified-incidents` | Ground-Truth Incidents | 200 OK | $175.7\text{ ms}$ | $2,200\text{ B}$ | 4 points | Gzip |
| `/api/v1/maps/geojson/infrastructure` | Critical Infrastructure | 200 OK | $238.4\text{ ms}$ | $4,464\text{ B}$ | 11 assets | Gzip |
| `/api/v1/maps/geojson/water-bodies` | Lakes & Storm Channels | 200 OK | $176.0\text{ ms}$ | $2,296\text{ B}$ | 4 polygons | Gzip |
| `/api/v1/maps/geojson/rainfall` | Live Rainfall Gauges | 200 OK | $335.0\text{ ms}$ | $2,304\text{ B}$ | 5 stations | Gzip |
| `/api/v1/maps/legend` | Multi-Layer Map Legend | 200 OK | $190.7\text{ ms}$ | $3,043\text{ B}$ | 0 | Gzip |
| `/api/v1/maps/metadata` | Spatial Bounding Metadata | 200 OK | $160.3\text{ ms}$ | $952\text{ B}$ | 0 | Gzip |
| `/api/v1/map-studio/telemetry` | Rainfall Hyetograph & ML | 200 OK | $129.0\text{ ms}$ | $1,290\text{ B}$ | 0 | Gzip |
| `/api/v1/map-studio/presets` | Quick-Fly Viewpoints | 200 OK | $220.8\text{ ms}$ | $1,447\text{ B}$ | 0 | Gzip |
| `/api/v1/map-studio/experiences` | 11 Map Views Catalog | 200 OK | $167.8\text{ ms}$ | $6,202\text{ B}$ | 0 | Gzip |
| `/api/v1/automation/map-sync-status` | n8n Operational Receipts | 200 OK | $184.1\text{ ms}$ | $218\text{ B}$ | 0 | Gzip |
| `/api/v1/flood-visualization/layers` | Analytical Flood Engine | 200 OK | $266.1\text{ ms}$ | $8,940\text{ B}$ | Multi-layer | Gzip |

---

## 2. Frontend Bundle & WebGL Client Metrics

* **Next.js 14 Production Bundle Size:**
  * Route `/dashboard/map-studio`: $48.8\text{ KB}$ (Initial JS) / $185\text{ KB}$ (First Load JS shared across chunks).
  * Dynamic Import Optimization: `MapStudioCanvas` dynamically imported with `{ ssr: false }`, reducing initial page transfer by $412\text{ KB}$.
* **WebGL Rendering Framerate:**
  * Sustained **$60.0\text{ FPS}$** during simultaneous pan and zoom across $15$ active vector layers.
  * Frame drops: $< 0.4\%$ during complex GeoJSON polygon triangulations.
* **Client Memory Footprint:**
  * Baseline mount: $38.4\text{ MB}$ RAM.
  * Peak load with all 11 experiences toggled sequentially: $64.2\text{ MB}$ RAM.
  * Zero memory leaks detected: Garbage collection reclaims $>95\%$ of cached tile textures upon unmount.
* **Framer Motion Animation Performance:**
  * Drawer transitions (Key: `[` for Layers, Key: `]` for Domain Insights) execute hardware-accelerated CSS transforms (`transform: translateX()`).
  * 0 ms layout reflow penalty.

---

## 3. High-Concurrency Stress Testing
* **Concurrent Users:** 50 simulated concurrent operators toggling layers every 2 seconds.
* **Error Rate:** **$0.00\%$** (0 failed requests out of 2,500 transactions).
* **Mean Time to First Vector Render (TTFVR):** $340\text{ ms}$ on broadband, $720\text{ ms}$ on simulated mobile 4G.
