# TerraGuard AI 2.0 — 5-Minute Live Hackathon Demo Script

**Event:** INFINEX 2K26 Global AI Hackathon  
**Target Duration:** Exactly 5 Minutes (300 Seconds)  
**Presenter:** Project Lead / Autonomous Systems Architect  
**Live Production URL:** `https://terra-guard-ai-chi.vercel.app`  
**Backup Offline Fallback:** Client-side vector simulation in browser  

---

## Demo Timing & Stage Overview

---

## Detailed Step-by-Step Walkthrough

### Part 1: The Problem & Mission (00:00 – 00:45)
* **Screen Display:** Public Homepage (`https://terra-guard-ai-chi.vercel.app`)
* **Speaker Script:**
  > *"Judges and fellow innovators, in modern megacities like Bengaluru, a single 45-minute cloudburst paralyses entire tech corridors, submerges thousands of vehicles, and leaves emergency responders flying blind. Why? Because rainfall gauges, air quality sensors, citizen calls, and drainage maps sit in four completely disconnected government silos.*
  >
  > *Meet **TerraGuard AI 2.0**: The world's first autonomous multi-hazard climate intelligence and closed-loop prediction platform. We detect threats across physical sensors, predict inundation with LiDAR-calibrated models, verify outcomes with ground truth, and prevent casualties through automated dispatch."*

---

### Part 2: Citizen Persona Walkthrough (00:45 – 01:45)
* **Screen Action:** Navigate to `/dashboard/report`
* **Speaker Script:**
  > *"Let's begin from the perspective of an ordinary citizen on 80ft Road Koramangala during a heavy downpour.*
  >
  > *The citizen opens TerraGuard on their phone, captures a photo of a severe culvert backflow, and the system automatically tags their GPS coordinates. Instantly, our lightweight computer vision model scores the hazard severity at Level 4 with $91\%$ confidence.*
  >
  > *When they submit, our backend applies 30-minute spatial duplicate suppression so our dispatchers aren't bombarded with 50 duplicate reports of the same drain. It immediately appears on the citywide map as an unverified incident with zero PII exposure."*

---

### Part 3: EOC Analyst & Map Studio 2.0 (01:45 – 03:15)
* **Screen Action:** Click sidebar item: `Map Intelligence Studio 2.0` (`/dashboard/map-studio`)
* **Screen Action:** Press hotkey `[` to open the Left Layers Panel.
* **Speaker Script:**
  > *"Now, let's switch to the Emergency Operations Center commander screen. Welcome to the **Map Intelligence Studio 2.0**.*
  >
  > *Notice this is not a decorative map with static image overlays. Every pixel is driven by authentic geospatial data. At the top, we have our 11 specialized intelligence views. On Map 1, we see natural-color Esri optical satellite imagery combined with real BBMP trauma hospitals, shelters, and drainage channels.*
  >
  > *Let's toggle to Map 2: **Flood Risk Intelligence**. Using our tactical dark GIS canvas, you are looking at calibrated Hydro-UNet v2.4 susceptibility polygons for the Koramangala basin. Notice how clicking any polygon surfaces our Explainable AI panel: it tells the commander exactly why this zone is Critical—$83.6\%$ drainage saturation combined with a $0.72\text{m}$ projected surcharge.*
  >
  > *Let's scrub our Hydrological Timeline Scrubber at the bottom from $-4\text{h}$ of observed Open-Meteo rainfall to $+3\text{h}$ of ML forecast. Notice zero fake continuous animations—only authenticated hourly time-slices."*

---

### Part 4: The Core Innovation: Prediction Verification & n8n Automation (03:15 – 04:15)
* **Screen Action:** Click the **`n8n Sync: 6/6`** pill in the top header.
* **Speaker Script:**
  > *"Now, for our most critical innovation: **Prediction Verification**.*
  >
  > *Most predictive AIs make a forecast and walk away. TerraGuard AI closes the loop. When our model forecasted $0.65\text{m}$ of water depth for Koramangala, our automated pipeline waited for the 3-hour horizon, ingested real stormwater sensor telemetry ($0.70\text{m}$), and scored its own prediction error: an absolute difference of just $5\text{ cm}$ with $92.86\%$ accuracy.*
  >
  > *Right here in our header, clicking the **n8n Sync** pill reveals our six live event-driven workflows operating on Render. You can see real execution receipts audited in MongoDB—from sensor ingestion to automated Telegram alert delivery and field squad dispatch."*

---

### Part 5: Impact & Hackathon Sign-Off (04:15 – 05:00)
* **Screen Action:** Open `/dashboard/analytics` and show the 4-Tier Provenance ribbon.
* **Speaker Script:**
  > *"Finally, look at our Municipal Analytics Studio. Every metric enforces our mandatory 4-tier provenance separation: Blue for physical sensors, Emerald for verified EOC incidents, Amber for model simulations, and Purple for AI syntheses.*
  >
  > *TerraGuard AI directly addresses UN Sustainable Development Goals 11, 13, 3, and 9. It is deployed, fully tested across 127 backend test cases, mobile-optimized, and ready to protect urban lives today.*
  >
  > *TerraGuard AI: Detect. Predict. Verify. Prevent. Thank you!"*

---

## Keyboard Shortcuts & Emergency Contingencies
* **`[` Key:** Toggles Left Layer Control Panel.
* **`]` Key:** Toggles Right Domain Intelligence Drawer.
* **`Esc` Key:** Closes active modal / fullscreen.
* **Offline Contingency:** If venue Wi-Fi drops, the frontend automatically falls back to client-side vector synthesis with high-fidelity local telemetry, ensuring 100% demo uptime.
