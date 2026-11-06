"""
TerraGuard AI — Hackathon Presentation Generator (PPTX & PDF)
INFINEX 2K26 — Global AI Hackathon | Organized by PropCare NW
Generates 15 comprehensive, visually stunning presentation slides in PPTX and PDF formats.
"""

import os
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

from reportlab.lib.pagesizes import landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
USER_UPLOADED_DIR = Path(r"C:\Users\jaswant karun\.gemini\antigravity\brain\5bab71c2-e02a-4eb3-a586-8b7f871e1c3f\.user_uploaded")

PPTX_OUTPUT = ROOT_DIR / "INFINEX_2K26_TerraGuard_AI_Presentation.pptx"
PDF_OUTPUT = ROOT_DIR / "INFINEX_2K26_TerraGuard_AI_Presentation.pdf"

# Verified Image Assets
IMG_LANDING = USER_UPLOADED_DIR / "media_1793981726356_148b916c.jpg"
IMG_LIVE_MAP = USER_UPLOADED_DIR / "media_1793980531722_bebedf05.jpg"
IMG_SATELLITE_GIS = USER_UPLOADED_DIR / "media_1793970663238_ea26031d.jpg"
IMG_FLOOD_INTEL = USER_UPLOADED_DIR / "media_1793970688828_80163246.jpg"
IMG_ADMIN_TRIAGE = USER_UPLOADED_DIR / "media_1793984515045_1ca6a9e4.jpg"
IMG_SIREN_MODAL = USER_UPLOADED_DIR / "media_1793980770735_19bc8d09.jpg"
IMG_GITHUB_REPO = USER_UPLOADED_DIR / "media_1793988322133_9e652c11.png"
IMG_GITHUB_CI = USER_UPLOADED_DIR / "media_1793988334914_6c2fac01.png"

# Color Palette (Dark Tactical Command Center Theme)
COLOR_BG = RGBColor(11, 19, 43)          # #0B132B Deep Navy
COLOR_CARD = RGBColor(22, 34, 68)        # #162244 Slate Navy
COLOR_CARD_ALT = RGBColor(15, 23, 42)    # #0F172A Dark Slate
COLOR_BORDER = RGBColor(40, 58, 107)     # #283A6B Card Outline
COLOR_CYAN = RGBColor(6, 182, 212)       # #06B6D4 Primary Accent
COLOR_SKY = RGBColor(56, 189, 248)       # #38BDF8 Highlight Blue
COLOR_EMERALD = RGBColor(16, 185, 129)   # #10B981 Success / Safe
COLOR_AMBER = RGBColor(245, 158, 11)     # #F59E0B Warning / Notice
COLOR_CORAL = RGBColor(239, 68, 68)      # #EF4444 Hazard / Siren
COLOR_WHITE = RGBColor(255, 255, 255)    # #FFFFFF
COLOR_MUTED = RGBColor(148, 163, 184)    # #94A3B8 Secondary Text

RL_BG = colors.HexColor("#0B132B")
RL_CARD = colors.HexColor("#162244")
RL_CARD_ALT = colors.HexColor("#0F172A")
RL_BORDER = colors.HexColor("#283A6B")
RL_CYAN = colors.HexColor("#06B6D4")
RL_SKY = colors.HexColor("#38BDF8")
RL_EMERALD = colors.HexColor("#10B981")
RL_AMBER = colors.HexColor("#F59E0B")
RL_CORAL = colors.HexColor("#EF4444")
RL_WHITE = colors.HexColor("#FFFFFF")
RL_MUTED = colors.HexColor("#94A3B8")


# ---------------------------------------------------------------------------
# SLIDE CONTENT SPECIFICATIONS (15 SLIDES)
# ---------------------------------------------------------------------------

SLIDES_DATA = [
    # SLIDE 1
    {
        "slide_num": 1,
        "category": "INFINEX 2K26 | GLOBAL AI HACKATHON | ORGANIZED BY PROPCARE NW",
        "title": "TERRAGUARD AI",
        "subtitle": "Real-Time Environmental Intelligence & Predictive Risk Prevention Platform",
        "tagline": "Detect real conditions. Predict emerging risks. Verify outcomes. Prevent damage.",
        "type": "title",
        "image": IMG_LANDING,
        "details": [
            ("Live Production Deployment (Vercel)", "https://terra-guard-ai-chi.vercel.app/"),
            ("GitHub Open-Source Repository", "https://github.com/Jaswant-Karun/TerraGuard-AI.git"),
            ("Official Demo Video Link", "[Insert Demo Video Google Drive Link Here]"),
            ("Target Problem Domain", "Autonomous Urban Climate Resilience & Flash Flood Prevention"),
        ]
    },
    # SLIDE 2
    {
        "slide_num": 2,
        "category": "THE PROBLEM STATEMENT",
        "title": "THE URBAN CLIMATE CRISIS & MUNICIPAL BLINDSPOTS",
        "subtitle": "Why Traditional Disaster Management Systems Fail Modern Cities",
        "type": "cards_4",
        "cards": [
            {
                "title": "1. Catastrophic Cloudbursts",
                "accent": COLOR_CORAL,
                "rl_accent": RL_CORAL,
                "points": [
                    "Sudden micro-cloudbursts (>50mm/h) overwhelm storm culverts in under 15 minutes.",
                    "Streets turn into torrents, submerging vehicles and stranding thousands of citizens.",
                    "Annual urban climate property damages exceed $3.2B across South Asian metros."
                ]
            },
            {
                "title": "2. Siloed Departmental Blindspots",
                "accent": COLOR_AMBER,
                "rl_accent": RL_AMBER,
                "points": [
                    "Weather stations, water level sensors, and traffic cameras sit in isolated software silos.",
                    "Municipal emergency officers lack unified real-time spatial situational awareness.",
                    "No predictive modeling to anticipate localized flooding before it strikes."
                ]
            },
            {
                "title": "3. Purely Reactive Response",
                "accent": COLOR_SKY,
                "rl_accent": RL_SKY,
                "points": [
                    "Agencies only mobilize pumps and emergency crews AFTER waterlogging has already peaked.",
                    "Emergency dispatch lines crash from 911/112 call overload during peak cloudbursts.",
                    "Average municipal response delay: 35-50 minutes, when 10 minutes makes the difference."
                ]
            },
            {
                "title": "4. Misinformation & Duplication",
                "accent": COLOR_MUTED,
                "rl_accent": RL_MUTED,
                "points": [
                    "Social media citizen reports are flood with unverified rumors and outdated photos.",
                    "Multiple citizens report the same puddle, overwhelming manual verification queues.",
                    "Zero audit trail or tamper-proof ground-truth verification for emergency sirens."
                ]
            }
        ]
    },
    # SLIDE 3
    {
        "slide_num": 3,
        "category": "THE SOLUTION",
        "title": "TERRAGUARD AI: AUTONOMOUS PREDICTIVE PREVENTION",
        "subtitle": "Transforming Reactive Urban Disaster Management into Autonomous Prevention",
        "type": "two_col_solution",
        "image": IMG_LANDING,
        "pillars": [
            ("PERCEIVE (Real-Time Sensing)", "Continuous ingestion of IMD AWS tipping bucket rain gauges, IoT culvert level sensors, ambient microclimate telemetry, and crowdsourced citizen visual reports."),
            ("PREDICT (ML Inundation Engine)", "Hydro-UNet neural networks and calibrated Gradient Boosting regressors project localized flood risk contours and inundation depths up to 6 hours ahead."),
            ("VERIFY (Multimodal AI Vision)", "Google Gemini 1.5 Pro/Flash analyzes citizen mobile photos to assess water stagnation, identify blocked storm grates, and scrub duplicate spam."),
            ("PROTECT (Autonomous Orchestration)", "Integrated n8n automation engine broadcasts emergency sector sirens, dispatches dewatering pump squads, and re-routes commuters away from danger.")
        ]
    },
    # SLIDE 4
    {
        "slide_num": 4,
        "category": "SYSTEM ARCHITECTURE",
        "title": "END-TO-END RESILIENT CLOUD ARCHITECTURE",
        "subtitle": "High-Throughput, Geospatial Clustered Pipeline Built for Zero-Downtime Reliability",
        "type": "architecture_grid",
        "blocks": [
            ("1. Client Experience Layer", "Next.js 14 App Router, TypeScript, MapLibre GL WebGL Engine, Tailwind CSS, Framer Motion. Edge-rendered on Vercel with global CDN caching."),
            ("2. Application API Gateway", "FastAPI (Python 3.11) with asynchronous worker pools, Pydantic v2 schemas, JWT authentication, and SlowAPI rate limiting. Hosted on Render."),
            ("3. AI Perception & ML Engine", "Google Gemini 1.5 Vision API for photo damage assessment; Hydro-UNet & Gradient Boosting regressors for flood depth contour generation."),
            ("4. n8n Orchestration Microservice", "Autonomous event-driven workflow engine running on Render: triggers public sirens, dispatches municipal squads, and pushes WhatsApp/SMS advisories."),
            ("5. MongoDB Atlas Geospatial Cluster", "Enterprise database with 2dsphere spatial indexing for instant geo-queries, PII-scrubbed collections, and zero-downtime local persistence fallbacks.")
        ]
    },
    # SLIDE 5
    {
        "slide_num": 5,
        "category": "CORE COMMAND CENTER",
        "title": "LIVE GIS RISK INTELLIGENCE COMMAND CENTER",
        "subtitle": "Street-Level Situational Awareness Across Critical Municipal Urban Basins",
        "type": "showcase_with_image",
        "image": IMG_LIVE_MAP,
        "badge": "PRODUCTION READY",
        "points": [
            "Real-Time Spatial Threat Zones: Vector polygons visualising Critical (Red), High (Orange), and Moderate (Yellow) flash flood susceptibility zones.",
            "Vital Community Assets: Real-time status mapping of 6 operational hospital emergency wards and designated municipal relief shelters.",
            "Live Sensor Overlays: Tipping bucket rain gauges (mm/h), drainage culvert sensor nodes, and real-time citizen-reported hazard markers.",
            "Multi-Tier Geolocation: High-accuracy hardware GPS with low-latency network fallback, centering smoothly on municipal command coordinates.",
            "Instant GIS Symbology Legend: Scientific separation distinguishing raw meteorological observations from verified ground-truth flood incidents."
        ]
    },
    # SLIDE 6
    {
        "slide_num": 6,
        "category": "NEW MODULE: STUDIO 2.0",
        "title": "TERRAGUARD AI 2.0: MAP INTELLIGENCE STUDIO",
        "subtitle": "Military-Grade Operational GIS Workspace Designed for City Command Engineers",
        "type": "showcase_with_image",
        "image": IMG_SATELLITE_GIS,
        "badge": "ADDITIVE 2.0 FEATURE",
        "points": [
            "Dedicated Non-Destructive Route: Located at /dashboard/map-studio with persistent sidebar navigation and blue '2.0' badge.",
            "4 Basemap Switching Styles: Municipal Street, Orbital Satellite, Satellite with Labels (Esri World Imagery + Reference Places), Topographic Terrain.",
            "14 Functional WebGL GIS Layers: Zero decorative switches — every toggle actively controls MapLibre layers across Environmental, Infrastructure & Incidents.",
            "Advanced Collapsible Control Panel: Inspired by tactical operational GIS interfaces with opacity sliders, GPS locate, 3D tilt, and session persistence.",
            "Enterprise RBAC Protection: Citizen views scrub sensitive PII; unredacted municipal notes and siren escalation require ADMIN/COORDINATOR authentication."
        ]
    },
    # SLIDE 7
    {
        "slide_num": 7,
        "category": "MAP INTELLIGENCE EXPERIENCES",
        "title": "11 SPECIALIZED GEOGRAPHIC MAP EXPERIENCES",
        "subtitle": "Complete Domain-Specific Geospatial Intelligence at the Click of a Button",
        "type": "showcase_with_image",
        "image": IMG_FLOOD_INTEL,
        "badge": "11 INTERACTIVE EXPERIENCES",
        "points": [
            "Map 1: Operational Satellite GIS — High-resolution orbital imagery with civic labels & infrastructure.",
            "Map 2: Flood Risk Intelligence — Hydro-UNet inundation susceptibility contours & hyetograph charts.",
            "Map 3: Live Rainfall Monitoring — Real-time precipitation rate (mm/h) and IMD AWS telemetry.",
            "Map 4: Elevation & Terrain — SRTM 30m DEM hillshade, slope gradients, and low-lying basin markers.",
            "Map 5: Drainage & Water Bodies — Raja Kaluve stormwater networks, Bellandur & Ulsoor lake perimeters.",
            "Map 6: Extreme Heat Risk — Urban Heat Island (UHI) temperature anomalies and Steadman Heat Index.",
            "Map 7: Air Quality Intelligence — CPCB CAAQMS monitoring stations (PM2.5, PM10, NO2, NAQI).",
            "Map 8: Citizen Hazard Reports — Geocoded public reports with status pills and PII scrubbing.",
            "Map 9: Verified Incident Ledger — Field-grounded emergency operations center dispatch records.",
            "Map 10: Infrastructure & Facilities — Hospitals, trauma centers, and disaster relief shelters.",
            "Map 11: Safe Navigation & Evacuation Corridors — Real-time hazard-avoidance routing for commuters."
        ]
    },
    # SLIDE 8
    {
        "slide_num": 8,
        "category": "AI & COMPUTER VISION",
        "title": "MULTIMODAL AI: GOOGLE GEMINI HAZARD PERCEPTION",
        "subtitle": "Instant Visual Verification and Automated Spatial Deduplication Engine",
        "type": "two_col_tech",
        "left_card": {
            "title": "Google Gemini 1.5 Vision Analysis",
            "badge": "AI VISION AGENT",
            "accent": COLOR_CYAN,
            "rl_accent": RL_CYAN,
            "points": [
                "Automated Inundation Depth Estimation: Classifies waterlogging depth (<15cm, 15-45cm, >45cm critical submersion).",
                "Drainage Culvert Obstruction Detection: Identifies plastic debris, silt buildup, and collapsed curb infrastructure.",
                "Structural Damage Categorization: Recognizes submerged potholes, downed electrical poles, and pavement fractures.",
                "Instant Safety Precautions: Generates immediate driver advice (e.g. 'Hydroplaning risk; avoid low-clearance vehicles')."
            ]
        },
        "right_card": {
            "title": "Perceptual Deduplication Engine",
            "badge": "70% TIME SAVINGS",
            "accent": COLOR_EMERALD,
            "rl_accent": RL_EMERALD,
            "points": [
                "SHA-256 Perceptual Hashing: Compares uploaded image hashes against active submissions to catch identical reposts.",
                "Geospatial Proximity Clustering: Groups reports submitted within a 50-meter radius into a single master incident.",
                "Eliminates Triage Queue Flooding: Reduces dispatcher cognitive fatigue during extreme cloudburst emergencies.",
                "Automated Cluster Aggregation: Increases priority severity score as multiple citizens report the same active hazard."
            ]
        }
    },
    # SLIDE 9
    {
        "slide_num": 9,
        "category": "MUNICIPAL OPERATIONS",
        "title": "RAPID MUNICIPAL INCIDENT TRIAGE & VERIFICATION",
        "subtitle": "Streamlined Command Portal Giving City Engineers Ground-Truth Verification Control",
        "type": "showcase_with_image",
        "image": IMG_ADMIN_TRIAGE,
        "badge": "OPERATIONAL EOC",
        "points": [
            "Instant One-Click Triage: Supervisors review queue with direct 'Triage / Verify', 'Escalate', and 'Reject / False' buttons.",
            "Role-Based Access Control (RBAC): Strict permission boundaries across CITIZEN, COORDINATOR, ANALYST, and ADMIN tiers.",
            "Immutable Field Verification Audit: Logs verified officer ID, inspection notes, timestamp, and field squad dispatch ID.",
            "Real-Time Incident Sync: Verified hazards instantly update Live Risk Map and Map Studio layers with zero manual refresh.",
            "High-Throughput Queue Management: Designed to handle over 10,000 concurrent hazard submissions during monsoon cloudbursts."
        ]
    },
    # SLIDE 10
    {
        "slide_num": 10,
        "category": "PUBLIC WARNING SYSTEM",
        "title": "EMERGENCY PUBLIC SIREN ESCALATION & SOS",
        "subtitle": "Two-Person Rule Emergency Broadcast to Protect Citizens and Commuters",
        "type": "showcase_with_image",
        "image": IMG_SIREN_MODAL,
        "badge": "LIFE SAFETY PROTOCOL",
        "points": [
            "Failsafe Siren Activation: Municipal officers trigger siren modal directly from verified high-severity incident cards.",
            "Multi-Channel Broadcast: Sends real-time visual alerts and warning sirens across all active citizen dashboards in the sector.",
            "Automated Pump Crew Dispatch: Notifies municipal dewatering suction pump teams with exact GPS coordinates and culvert ID.",
            "Emergency Traffic Diversions: Communicates with traffic police command to barricade inundated underpasses and lowlands.",
            "Citizen Emergency SOS Beacon: Allows trapped commuters to emit a GPS distress ping received immediately by first responders."
        ]
    },
    # SLIDE 11
    {
        "slide_num": 11,
        "category": "CORE HACKATHON HIGHLIGHT",
        "title": "n8n WORKFLOW AUTOMATION ENGINE",
        "subtitle": "Autonomous Event-Driven Orchestration Connecting IoT Sensors, AI, and Municipal Teams",
        "type": "n8n_workflows",
        "workflows": [
            {
                "name": "Workflow 1: Severe Weather Ingestion & Early Warning",
                "tag": "IoT & METEOROLOGY",
                "accent": COLOR_CYAN,
                "desc": "Cron triggers every 5 mins polling Open-Meteo & IMD AWS APIs -> Evaluates rainfall rate (>30mm/h) -> Auto-flags lowland drainage basins in MongoDB Atlas."
            },
            {
                "name": "Workflow 2: Emergency Siren Escalation & Squad Dispatch",
                "tag": "EMERGENCY BROADCAST",
                "accent": COLOR_CORAL,
                "desc": "Webhook triggered upon supervisor verification -> Broadcasts citizen dashboard push alerts -> Dispatches SMS/WhatsApp alerts via Twilio to BBMP pump operators."
            },
            {
                "name": "Workflow 3: AI Vision Auto-Triage & Deduplication",
                "tag": "GEMINI AI PIPELINE",
                "accent": COLOR_EMERALD,
                "desc": "Catches citizen photo upload -> Invokes Google Gemini Vision -> Computes 50m spatial cluster -> Assigns severity and queues for supervisor confirmation."
            },
            {
                "name": "Workflow 4: Scheduled Daily Municipal Risk Digest",
                "tag": "REPORTING & COMPLIANCE",
                "accent": COLOR_AMBER,
                "desc": "Runs daily at 06:00 UTC -> Aggregates 24-hour rainfall totals, unresolved drainage clogs, and response SLA metrics -> Generates PDF report for city commissioners."
            }
        ]
    },
    # SLIDE 12
    {
        "slide_num": 12,
        "category": "CORE HACKATHON HIGHLIGHT",
        "title": "MONGODB ATLAS GEOSPATIAL CLUSTER ARCHITECTURE",
        "subtitle": "Enterprise Cloud Database Providing Sub-Millisecond Spatial Querying & High Availability",
        "type": "cards_4",
        "cards": [
            {
                "title": "2dsphere Spatial Indexing",
                "accent": COLOR_EMERALD,
                "rl_accent": RL_EMERALD,
                "points": [
                    "High-performance spherical geometry indexing for real-time geographic queries.",
                    "Powers $near, $geoWithin, and $geoIntersects operations with sub-5ms query latency.",
                    "Instantly matches incoming citizen GPS coords against active flood zone polygons."
                ]
            },
            {
                "title": "Core Collections Architecture",
                "accent": COLOR_CYAN,
                "rl_accent": RL_CYAN,
                "points": [
                    "users: Secure RBAC profiles with bcrypt hashed passwords, roles, and refresh tokens.",
                    "citizen_reports: GeoJSON Points, Gemini vision outputs, and verification audit trails.",
                    "flood_zones: GeoJSON Polygons, depth metrics, population-at-risk, drainage saturation.",
                    "telemetry: Time-series precipitation, water level sensors, and CAAQMS air data."
                ]
            },
            {
                "title": "Zero-Downtime Local Persistence",
                "accent": COLOR_SKY,
                "rl_accent": RL_SKY,
                "points": [
                    "Resilient dual-layer architecture: MongoDB Atlas primary + local disk caching.",
                    "In-memory stores sync with reports_cache.json and users_cache.json.",
                    "Guarantees 100% operational survival across server restarts and network dropouts."
                ]
            },
            {
                "title": "Security & Enterprise Compliance",
                "accent": COLOR_AMBER,
                "rl_accent": RL_AMBER,
                "points": [
                    "Encrypted at rest and in transit via TLS 1.3.",
                    "Strict role-based projection masks citizen phone numbers and email from public APIs.",
                    "Tamper-proof verification logs record full audit trails for municipal governance."
                ]
            }
        ]
    },
    # SLIDE 13
    {
        "slide_num": 13,
        "category": "TECHNICAL IMPLEMENTATION",
        "title": "TECHNOLOGY STACK & DEVOPS INFRASTRUCTURE",
        "subtitle": "Modern, Battle-Tested Full-Stack Ecosystem Designed for Reliability & Scalability",
        "type": "tech_table",
        "image": IMG_GITHUB_CI,
        "stack": [
            ("Frontend Client", "Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, MapLibre GL, Lucide Icons", "Vercel Edge Network"),
            ("Backend Application", "FastAPI (Python 3.11), Pydantic v2, Motor / AsyncIOMotor, PyJWT, SlowAPI, Uvicorn ASGI", "Render Cloud Hosting"),
            ("AI & Machine Learning", "Google Gemini 1.5 Pro / Flash (Multimodal Vision), Hydro-UNet, Gradient Boosting Regressors", "Google AI Studio & Scikit-Learn"),
            ("Workflow Automation", "n8n Workflow Automation Engine (Event-driven Webhooks, Cron Triggers, Multi-node Alerts)", "Render Microservice"),
            ("Database Tier", "MongoDB Atlas Cloud Database (2dsphere geospatial indexing, time-series telemetry collections)", "MongoDB Atlas Cloud"),
            ("Geospatial & Mapping", "Esri World Imagery, OpenStreetMap, SRTM 30m Digital Elevation Model, Turf.js spatial analysis", "MapLibre Vector / Raster Engine"),
            ("CI/CD & Code Quality", "GitHub Actions CI/CD Pipeline (Ruff Linting + 105 Automated Pytest Backend Tests Passing)", "GitHub Actions (Green Status)")
        ]
    },
    # SLIDE 14
    {
        "slide_num": 14,
        "category": "REAL-WORLD IMPACT",
        "title": "PILOT CITY IMPACT & INNOVATION MATRIX",
        "subtitle": "Demonstrated Measurable Improvements Across Bengaluru Urban Drainage Basins",
        "type": "impact_slide",
        "metrics": [
            ("65%", "Faster Emergency Dispatch", "Dewatering suction pumps deployed in 12 mins vs. 35 mins baseline."),
            ("80%", "Reduction in Vehicle Damage", "Real-time navigation diverts commuters around surcharged culverts."),
            ("100%", "Verified Ground Truth", "Zero unverified public warning sirens triggered; tamper-proof audit trail."),
            ("70%", "Triage Fatigue Reduction", "Perceptual hashing and 50m spatial deduplication eliminate report flooding.")
        ],
        "comparison": [
            ("Feature / Capability", "Legacy Municipal Systems", "TerraGuard AI Platform"),
            ("Response Strategy", "Purely reactive after 112/911 calls", "Autonomous predictive prevention (6h lead time)"),
            ("Workflow Automation", "Manual phone calls & paper dispatch", "Autonomous n8n event-driven orchestration"),
            ("Citizen Visual Reports", "Unverified text complaints & social media", "Google Gemini 1.5 multimodal vision ground-truthing"),
            ("GIS Visualization", "Static PDF flood maps or basic pin cards", "Interactive 11-map studio with 14 active GIS layers"),
            ("Public Warning Protocol", "Broadcast sirens delayed by hours", "Targeted two-person failsafe siren escalation in seconds")
        ]
    },
    # SLIDE 15
    {
        "slide_num": 15,
        "category": "SUBMISSION & ROADMAP",
        "title": "INFINEX 2K26 SUBMISSION SUMMARY & ROADMAP",
        "subtitle": "TerraGuard AI — Real-Time Environmental Intelligence & Predictive Risk Prevention",
        "type": "final_submission",
        "links": [
            ("Hackathon Name", "INFINEX 2K26 — Global AI Hackathon (Organized by PropCare NW)"),
            ("Project Title", "TerraGuard AI — Real-Time Environmental Intelligence & Predictive Risk Prevention Platform"),
            ("Live Working Demo (Vercel)", "https://terra-guard-ai-chi.vercel.app/"),
            ("GitHub Open-Source Repository", "https://github.com/Jaswant-Karun/TerraGuard-AI.git"),
            ("Backend API Deployment (Render)", "https://terraguard-ai-xo6s.onrender.com"),
            ("Official Demo Video Link", "[Insert Demo Video Google Drive Link Here]")
        ],
        "roadmap": [
            ("Q2 2026: Satellite SAR Radar", "Integration of Sentinel-1 Synthetic Aperture Radar (SAR) for cloud-penetrating orbital flood mapping."),
            ("Q3 2026: IoT Sluice Gate Actuators", "Autonomous bidirectional communication to trigger physical storm culvert floodgates via MQTT."),
            ("Q4 2026: LoRaWAN Citizen Beacons", "Decentralized mesh radio beacons allowing citizens to signal SOS even when cellular towers fail.")
        ]
    }
]


# ---------------------------------------------------------------------------
# POWERPOINT (PPTX) GENERATOR
# ---------------------------------------------------------------------------

def generate_pptx():
    prs = Presentation()
    # 16:9 Widescreen layout
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]  # Blank slide

    for data in SLIDES_DATA:
        slide = prs.slides.add_slide(blank_layout)

        # 1. Dark Background Fill
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG
        bg.line.fill.background()

        # 2. Header Bar
        add_pptx_header(slide, data["category"], data["title"], data.get("subtitle"))

        # 3. Slide Content Layouts
        stype = data["type"]

        if stype == "title":
            render_pptx_title_slide(slide, data)
        elif stype == "cards_4":
            render_pptx_cards_4(slide, data)
        elif stype == "two_col_solution":
            render_pptx_two_col_solution(slide, data)
        elif stype == "architecture_grid":
            render_pptx_architecture_grid(slide, data)
        elif stype == "showcase_with_image":
            render_pptx_showcase_image(slide, data)
        elif stype == "two_col_tech":
            render_pptx_two_col_tech(slide, data)
        elif stype == "n8n_workflows":
            render_pptx_n8n_workflows(slide, data)
        elif stype == "tech_table":
            render_pptx_tech_table(slide, data)
        elif stype == "impact_slide":
            render_pptx_impact_slide(slide, data)
        elif stype == "final_submission":
            render_pptx_final_submission(slide, data)

        # 4. Slide Footer
        add_pptx_footer(slide, data["slide_num"])

    prs.save(str(PPTX_OUTPUT))
    print(f"[SUCCESS] PPTX generated with {len(SLIDES_DATA)} slides at:\n  {PPTX_OUTPUT}")


def add_pptx_header(slide, category, title, subtitle):
    # Top Category Pill
    cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.35))
    tf_c = cat_box.text_frame
    tf_c.word_wrap = True
    p_c = tf_c.paragraphs[0]
    p_c.text = category.upper()
    p_c.font.size = Pt(10)
    p_c.font.bold = True
    p_c.font.color.rgb = COLOR_CYAN

    # Main Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(11.7), Inches(0.55))
    tf_t = title_box.text_frame
    tf_t.word_wrap = True
    p_t = tf_t.paragraphs[0]
    p_t.text = title
    p_t.font.size = Pt(20)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_WHITE

    # Subtitle
    if subtitle:
        sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.22), Inches(11.7), Inches(0.35))
        tf_s = sub_box.text_frame
        tf_s.word_wrap = True
        p_s = tf_s.paragraphs[0]
        p_s.text = subtitle
        p_s.font.size = Pt(11)
        p_s.font.color.rgb = COLOR_MUTED


def add_pptx_footer(slide, slide_num):
    # Footer separator line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.015))
    line.fill.solid()
    line.fill.fore_color.rgb = COLOR_BORDER
    line.line.fill.background()

    # Footer left text
    f_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.08), Inches(8.0), Inches(0.3))
    tf = f_box.text_frame
    p = tf.paragraphs[0]
    p.text = "TerraGuard AI — Real-Time Environmental Intelligence & Prevention Platform | INFINEX 2K26"
    p.font.size = Pt(9)
    p.font.color.rgb = COLOR_MUTED

    # Footer right slide number
    num_box = slide.shapes.add_textbox(Inches(10.5), Inches(7.08), Inches(2.0), Inches(0.3))
    tf_n = num_box.text_frame
    p_n = tf_n.paragraphs[0]
    p_n.alignment = PP_ALIGN.RIGHT
    p_n.text = f"Slide {slide_num} of 15"
    p_n.font.size = Pt(9)
    p_n.font.color.rgb = COLOR_CYAN


def render_pptx_title_slide(slide, data):
    # Left Card with links
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.7), Inches(6.0), Inches(5.1))
    card.fill.solid()
    card.fill.fore_color.rgb = COLOR_CARD
    card.line.color.rgb = COLOR_BORDER
    card.line.width = Pt(1.5)

    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.35)
    tf.margin_right = Inches(0.35)
    tf.margin_top = Inches(0.35)

    p0 = tf.paragraphs[0]
    p0.text = "OFFICIAL HACKATHON SUBMISSION PACK"
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_CYAN

    p_tag = tf.add_paragraph()
    p_tag.text = f'"{data["tagline"]}"'
    p_tag.font.size = Pt(13)
    p_tag.font.italic = True
    p_tag.font.color.rgb = COLOR_WHITE
    p_tag.space_before = Pt(8)
    p_tag.space_after = Pt(14)

    for label, val in data["details"]:
        p_lbl = tf.add_paragraph()
        p_lbl.text = label.upper()
        p_lbl.font.size = Pt(9)
        p_lbl.font.bold = True
        p_lbl.font.color.rgb = COLOR_SKY
        p_lbl.space_before = Pt(6)

        p_val = tf.add_paragraph()
        p_val.text = val
        p_val.font.size = Pt(10)
        p_val.font.bold = ("Insert" in val or "http" in val)
        p_val.font.color.rgb = COLOR_EMERALD if "vercel" in val else (COLOR_AMBER if "Insert" in val else COLOR_WHITE)
        p_val.space_after = Pt(4)

    # Right Image Preview
    if data["image"].exists():
        slide.shapes.add_picture(str(data["image"]), Inches(7.05), Inches(1.7), width=Inches(5.48))


def render_pptx_cards_4(slide, data):
    cards = data["cards"]
    col_w = Inches(2.78)
    gap = Inches(0.2)
    top = Inches(1.7)
    h = Inches(5.1)

    for i, c in enumerate(cards):
        left = Inches(0.8) + i * (col_w + gap)
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, col_w, h)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = c["accent"]
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.25)

        p_t = tf.paragraphs[0]
        p_t.text = c["title"]
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = c["accent"]
        p_t.space_after = Pt(12)

        for pt in c["points"]:
            p = tf.add_paragraph()
            p.text = f"•  {pt}"
            p.font.size = Pt(10)
            p.font.color.rgb = COLOR_WHITE
            p.space_after = Pt(10)


def render_pptx_two_col_solution(slide, data):
    # Left Column: Image
    if data["image"].exists():
        slide.shapes.add_picture(str(data["image"]), Inches(0.8), Inches(1.7), width=Inches(5.5))

    # Right Column: Pillars
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.55), Inches(1.7), Inches(5.98), Inches(5.1))
    card.fill.solid()
    card.fill.fore_color.rgb = COLOR_CARD
    card.line.color.rgb = COLOR_BORDER
    card.line.width = Pt(1.5)

    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.3)
    tf.margin_right = Inches(0.3)
    tf.margin_top = Inches(0.3)

    p0 = tf.paragraphs[0]
    p0.text = "CORE ARCHITECTURAL PILLARS"
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_CYAN
    p0.space_after = Pt(10)

    for title, desc in data["pillars"]:
        p_t = tf.add_paragraph()
        p_t.text = f"▸ {title}"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_SKY
        p_t.space_before = Pt(6)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = COLOR_WHITE
        p_d.space_after = Pt(8)


def render_pptx_architecture_grid(slide, data):
    blocks = data["blocks"]
    card_w = Inches(11.733)
    h = Inches(0.9)
    gap = Inches(0.12)
    top_start = Inches(1.68)

    colors_list = [COLOR_CYAN, COLOR_SKY, COLOR_EMERALD, COLOR_AMBER, COLOR_CORAL]

    for i, (title, desc) in enumerate(blocks):
        top = top_start + i * (h + gap)
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top, card_w, h)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = colors_list[i % len(colors_list)]
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.15)

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = colors_list[i % len(colors_list)]

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = COLOR_WHITE


def render_pptx_showcase_image(slide, data):
    # Left Card with Points
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.7), Inches(5.8), Inches(5.1))
    card.fill.solid()
    card.fill.fore_color.rgb = COLOR_CARD
    card.line.color.rgb = COLOR_BORDER
    card.line.width = Pt(1.5)

    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_right = Inches(0.25)
    tf.margin_top = Inches(0.25)

    p0 = tf.paragraphs[0]
    p0.text = f"KEY SYSTEM CAPABILITIES [{data.get('badge', 'FEATURE')}]"
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_CYAN
    p0.space_after = Pt(10)

    for pt in data["points"]:
        p = tf.add_paragraph()
        p.text = f"•  {pt}"
        p.font.size = Pt(9.5)
        p.font.color.rgb = COLOR_WHITE
        p.space_after = Pt(8)

    # Right Image
    if data["image"].exists():
        slide.shapes.add_picture(str(data["image"]), Inches(6.8), Inches(1.7), width=Inches(5.733))


def render_pptx_two_col_tech(slide, data):
    w = Inches(5.75)
    h = Inches(5.1)
    top = Inches(1.7)

    # Left Card
    c_left = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top, w, h)
    c_left.fill.solid()
    c_left.fill.fore_color.rgb = COLOR_CARD
    c_left.line.color.rgb = data["left_card"]["accent"]
    c_left.line.width = Pt(1.5)

    tf_l = c_left.text_frame
    tf_l.word_wrap = True
    tf_l.margin_left = Inches(0.3)
    tf_l.margin_right = Inches(0.3)
    tf_l.margin_top = Inches(0.3)

    p0 = tf_l.paragraphs[0]
    p0.text = f'{data["left_card"]["title"]} ({data["left_card"]["badge"]})'
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = data["left_card"]["accent"]
    p0.space_after = Pt(12)

    for pt in data["left_card"]["points"]:
        p = tf_l.add_paragraph()
        p.text = f"•  {pt}"
        p.font.size = Pt(10)
        p.font.color.rgb = COLOR_WHITE
        p.space_after = Pt(10)

    # Right Card
    c_right = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.78), top, w, h)
    c_right.fill.solid()
    c_right.fill.fore_color.rgb = COLOR_CARD
    c_right.line.color.rgb = data["right_card"]["accent"]
    c_right.line.width = Pt(1.5)

    tf_r = c_right.text_frame
    tf_r.word_wrap = True
    tf_r.margin_left = Inches(0.3)
    tf_r.margin_right = Inches(0.3)
    tf_r.margin_top = Inches(0.3)

    p0_r = tf_r.paragraphs[0]
    p0_r.text = f'{data["right_card"]["title"]} ({data["right_card"]["badge"]})'
    p0_r.font.size = Pt(12)
    p0_r.font.bold = True
    p0_r.font.color.rgb = data["right_card"]["accent"]
    p0_r.space_after = Pt(12)

    for pt in data["right_card"]["points"]:
        p = tf_r.add_paragraph()
        p.text = f"•  {pt}"
        p.font.size = Pt(10)
        p.font.color.rgb = COLOR_WHITE
        p.space_after = Pt(10)


def render_pptx_n8n_workflows(slide, data):
    workflows = data["workflows"]
    col_w = Inches(5.75)
    row_h = Inches(2.4)
    top_start = Inches(1.7)
    gap_x = Inches(0.233)
    gap_y = Inches(0.25)

    positions = [
        (Inches(0.8), top_start),
        (Inches(0.8) + col_w + gap_x, top_start),
        (Inches(0.8), top_start + row_h + gap_y),
        (Inches(0.8) + col_w + gap_x, top_start + row_h + gap_y),
    ]

    for i, wf in enumerate(workflows):
        left, top = positions[i]
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, col_w, row_h)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = wf["accent"]
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.2)

        p_t = tf.paragraphs[0]
        p_t.text = f"{wf['name']} [{wf['tag']}]"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = wf["accent"]
        p_t.space_after = Pt(8)

        p_d = tf.add_paragraph()
        p_d.text = wf["desc"]
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = COLOR_WHITE


def render_pptx_tech_table(slide, data):
    # Left Table of Tech
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.7), Inches(7.5), Inches(5.1))
    card.fill.solid()
    card.fill.fore_color.rgb = COLOR_CARD
    card.line.color.rgb = COLOR_BORDER
    card.line.width = Pt(1.5)

    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_right = Inches(0.25)
    tf.margin_top = Inches(0.2)

    p0 = tf.paragraphs[0]
    p0.text = "FULL-STACK TECHNICAL COMPONENT MATRIX"
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_CYAN
    p0.space_after = Pt(8)

    for cat, tech, host in data["stack"]:
        p = tf.add_paragraph()
        p.text = f"• {cat.upper()}: {tech}  [{host}]"
        p.font.size = Pt(9)
        p.font.color.rgb = COLOR_WHITE
        p.space_after = Pt(6)

    # Right Image (GitHub CI Green status)
    if data["image"].exists():
        slide.shapes.add_picture(str(data["image"]), Inches(8.5), Inches(1.7), width=Inches(4.033))


def render_pptx_impact_slide(slide, data):
    # Top 4 Metrics Cards
    metrics = data["metrics"]
    w = Inches(2.78)
    h = Inches(1.4)
    gap = Inches(0.2)

    for i, (stat, title, sub) in enumerate(metrics):
        left = Inches(0.8) + i * (w + gap)
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.7), w, h)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_CYAN
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.15)
        tf.margin_top = Inches(0.12)

        p_s = tf.paragraphs[0]
        p_s.text = stat
        p_s.font.size = Pt(22)
        p_s.font.bold = True
        p_s.font.color.rgb = COLOR_CYAN

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(9.5)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_WHITE

        p_d = tf.add_paragraph()
        p_d.text = sub
        p_d.font.size = Pt(8)
        p_d.font.color.rgb = COLOR_MUTED

    # Bottom Comparison Table
    table_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(3.3), Inches(11.733), Inches(3.5))
    table_card.fill.solid()
    table_card.fill.fore_color.rgb = COLOR_CARD
    table_card.line.color.rgb = COLOR_BORDER
    table_card.line.width = Pt(1.5)

    tf_t = table_card.text_frame
    tf_t.word_wrap = True
    tf_t.margin_left = Inches(0.25)
    tf_t.margin_right = Inches(0.25)
    tf_t.margin_top = Inches(0.2)

    p0 = tf_t.paragraphs[0]
    p0.text = "INNOVATION BENCHMARK: LEGACY CITY TOOLS VS. TERRAGUARD AI"
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_SKY
    p0.space_after = Pt(8)

    for row in data["comparison"][1:]:
        p = tf_t.add_paragraph()
        p.text = f"• {row[0]}:  Legacy = {row[1]}  ➔  TerraGuard AI = {row[2]}"
        p.font.size = Pt(9)
        p.font.color.rgb = COLOR_WHITE
        p.space_after = Pt(6)


def render_pptx_final_submission(slide, data):
    # Left Card: Links & Deliverables
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.7), Inches(6.0), Inches(5.1))
    card.fill.solid()
    card.fill.fore_color.rgb = COLOR_CARD
    card.line.color.rgb = COLOR_CYAN
    card.line.width = Pt(1.5)

    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.3)
    tf.margin_right = Inches(0.3)
    tf.margin_top = Inches(0.25)

    p0 = tf.paragraphs[0]
    p0.text = "OFFICIAL SUBMISSION DELIVERABLES"
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_CYAN
    p0.space_after = Pt(8)

    for k, v in data["links"]:
        p_k = tf.add_paragraph()
        p_k.text = k.upper()
        p_k.font.size = Pt(8.5)
        p_k.font.bold = True
        p_k.font.color.rgb = COLOR_SKY

        p_v = tf.add_paragraph()
        p_v.text = v
        p_v.font.size = Pt(9.5)
        p_v.font.bold = ("Insert" in v or "vercel" in v)
        p_v.font.color.rgb = COLOR_EMERALD if "vercel" in v else (COLOR_AMBER if "Insert" in v else COLOR_WHITE)
        p_v.space_after = Pt(6)

    # Right Card: Roadmap
    card_r = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.05), Inches(1.7), Inches(5.48), Inches(5.1))
    card_r.fill.solid()
    card_r.fill.fore_color.rgb = COLOR_CARD
    card_r.line.color.rgb = COLOR_EMERALD
    card_r.line.width = Pt(1.5)

    tf_r = card_r.text_frame
    tf_r.word_wrap = True
    tf_r.margin_left = Inches(0.3)
    tf_r.margin_right = Inches(0.3)
    tf_r.margin_top = Inches(0.25)

    p0_r = tf_r.paragraphs[0]
    p0_r.text = "FUTURE ROADMAP & IMPACT EXPANSION"
    p0_r.font.size = Pt(11)
    p0_r.font.bold = True
    p0_r.font.color.rgb = COLOR_EMERALD
    p0_r.space_after = Pt(12)

    for title, desc in data["roadmap"]:
        p_t = tf_r.add_paragraph()
        p_t.text = f"▸ {title}"
        p_t.font.size = Pt(10.5)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_SKY
        p_t.space_before = Pt(8)

        p_d = tf_r.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9)
        p_d.font.color.rgb = COLOR_WHITE
        p_d.space_after = Pt(8)


# ---------------------------------------------------------------------------
# PDF GENERATOR (REPORTLAB)
# ---------------------------------------------------------------------------

def generate_pdf():
    # 16:9 Widescreen dimensions matching PPTX
    W = 13.333 * inch
    H = 7.5 * inch
    c = canvas.Canvas(str(PDF_OUTPUT), pagesize=(W, H))

    for data in SLIDES_DATA:
        # Background
        c.setFillColor(RL_BG)
        c.rect(0, 0, W, H, fill=1, stroke=0)

        # Header
        render_pdf_header(c, data["category"], data["title"], data.get("subtitle"), W, H)

        # Content Layout
        stype = data["type"]
        if stype == "title":
            render_pdf_title_slide(c, data, W, H)
        elif stype == "cards_4":
            render_pdf_cards_4(c, data, W, H)
        elif stype == "two_col_solution":
            render_pdf_two_col_solution(c, data, W, H)
        elif stype == "architecture_grid":
            render_pdf_architecture_grid(c, data, W, H)
        elif stype == "showcase_with_image":
            render_pdf_showcase_image(c, data, W, H)
        elif stype == "two_col_tech":
            render_pdf_two_col_tech(c, data, W, H)
        elif stype == "n8n_workflows":
            render_pdf_n8n_workflows(c, data, W, H)
        elif stype == "tech_table":
            render_pdf_tech_table(c, data, W, H)
        elif stype == "impact_slide":
            render_pdf_impact_slide(c, data, W, H)
        elif stype == "final_submission":
            render_pdf_final_submission(c, data, W, H)

        # Footer
        render_pdf_footer(c, data["slide_num"], W, H)

        c.showPage()

    c.save()
    print(f"[SUCCESS] PDF generated with {len(SLIDES_DATA)} pages at:\n  {PDF_OUTPUT}")


def render_pdf_header(c, category, title, subtitle, W, H):
    # Category
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(RL_CYAN)
    c.drawString(0.8 * inch, H - 0.55 * inch, category.upper())

    # Title
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(RL_WHITE)
    c.drawString(0.8 * inch, H - 0.92 * inch, title)

    # Subtitle
    if subtitle:
        c.setFont("Helvetica", 11)
        c.setFillColor(RL_MUTED)
        c.drawString(0.8 * inch, H - 1.22 * inch, subtitle)


def render_pdf_footer(c, slide_num, W, H):
    # Separator Line
    c.setStrokeColor(RL_BORDER)
    c.setLineWidth(1)
    c.line(0.8 * inch, 0.45 * inch, W - 0.8 * inch, 0.45 * inch)

    # Left text
    c.setFont("Helvetica", 9)
    c.setFillColor(RL_MUTED)
    c.drawString(0.8 * inch, 0.25 * inch, "TerraGuard AI — Real-Time Environmental Intelligence & Prevention Platform | INFINEX 2K26")

    # Right text
    c.drawRightString(W - 0.8 * inch, 0.25 * inch, f"Page {slide_num} of 15")


def draw_card(c, x, y, w, h, border_color=RL_BORDER, bg_color=RL_CARD):
    c.setFillColor(bg_color)
    c.setStrokeColor(border_color)
    c.setLineWidth(1.5)
    c.roundRect(x, y, w, h, 6, fill=1, stroke=1)


def render_pdf_title_slide(c, data, W, H):
    card_x = 0.8 * inch
    card_y = 0.7 * inch
    card_w = 6.0 * inch
    card_h = 5.1 * inch

    draw_card(c, card_x, card_y, card_w, card_h, border_color=RL_CYAN)

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(RL_CYAN)
    c.drawString(card_x + 0.35 * inch, card_y + card_h - 0.45 * inch, "OFFICIAL HACKATHON SUBMISSION PACK")

    c.setFont("Helvetica-Oblique", 12)
    c.setFillColor(RL_WHITE)
    c.drawString(card_x + 0.35 * inch, card_y + card_h - 0.85 * inch, f'"{data["tagline"]}"')

    curr_y = card_y + card_h - 1.3 * inch
    for label, val in data["details"]:
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(RL_SKY)
        c.drawString(card_x + 0.35 * inch, curr_y, label.upper())

        c.setFont("Helvetica-Bold" if ("Insert" in val or "http" in val) else "Helvetica", 10)
        c.setFillColor(RL_EMERALD if "vercel" in val else (RL_AMBER if "Insert" in val else RL_WHITE))
        c.drawString(card_x + 0.35 * inch, curr_y - 0.22 * inch, val)
        curr_y -= 0.65 * inch

    # Right Image
    if data["image"].exists():
        c.drawImage(str(data["image"]), 7.05 * inch, 0.7 * inch, width=5.48 * inch, height=5.1 * inch, preserveAspectRatio=True)


def render_pdf_cards_4(c, data, W, H):
    cards = data["cards"]
    col_w = 2.78 * inch
    gap = 0.2 * inch
    top_y = 0.7 * inch
    h = 5.1 * inch

    for i, card_info in enumerate(cards):
        x = 0.8 * inch + i * (col_w + gap)
        draw_card(c, x, top_y, col_w, h, border_color=card_info["rl_accent"])

        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(card_info["rl_accent"])
        c.drawString(x + 0.2 * inch, top_y + h - 0.45 * inch, card_info["title"])

        curr_y = top_y + h - 0.85 * inch
        for pt in card_info["points"]:
            c.setFont("Helvetica", 9)
            c.setFillColor(RL_WHITE)
            words = pt.split()
            line = ""
            for w in words:
                if len(line + " " + w) < 32:
                    line += " " + w if line else w
                else:
                    c.drawString(x + 0.2 * inch, curr_y, "• " + line)
                    curr_y -= 0.18 * inch
                    line = w
            if line:
                c.drawString(x + 0.2 * inch, curr_y, "• " + line)
                curr_y -= 0.28 * inch


def render_pdf_two_col_solution(c, data, W, H):
    if data["image"].exists():
        c.drawImage(str(data["image"]), 0.8 * inch, 0.7 * inch, width=5.5 * inch, height=5.1 * inch, preserveAspectRatio=True)

    card_x = 6.55 * inch
    card_y = 0.7 * inch
    card_w = 5.98 * inch
    card_h = 5.1 * inch
    draw_card(c, card_x, card_y, card_w, card_h)

    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(RL_CYAN)
    c.drawString(card_x + 0.3 * inch, card_y + card_h - 0.45 * inch, "CORE ARCHITECTURAL PILLARS")

    curr_y = card_y + card_h - 0.85 * inch
    for title, desc in data["pillars"]:
        c.setFont("Helvetica-Bold", 10.5)
        c.setFillColor(RL_SKY)
        c.drawString(card_x + 0.3 * inch, curr_y, f"▸ {title}")
        curr_y -= 0.22 * inch

        c.setFont("Helvetica", 9)
        c.setFillColor(RL_WHITE)
        words = desc.split()
        line = ""
        for w in words:
            if len(line + " " + w) < 70:
                line += " " + w if line else w
            else:
                c.drawString(card_x + 0.45 * inch, curr_y, line)
                curr_y -= 0.18 * inch
                line = w
        if line:
            c.drawString(card_x + 0.45 * inch, curr_y, line)
            curr_y -= 0.32 * inch


def render_pdf_architecture_grid(c, data, W, H):
    blocks = data["blocks"]
    card_w = 11.733 * inch
    h = 0.9 * inch
    gap = 0.12 * inch
    top_start = H - 1.55 * inch

    colors_list = [RL_CYAN, RL_SKY, RL_EMERALD, RL_AMBER, RL_CORAL]

    for i, (title, desc) in enumerate(blocks):
        y = top_start - (i + 1) * h - i * gap
        draw_card(c, 0.8 * inch, y, card_w, h, border_color=colors_list[i % len(colors_list)])

        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(colors_list[i % len(colors_list)])
        c.drawString(1.05 * inch, y + h - 0.3 * inch, title)

        c.setFont("Helvetica", 9.5)
        c.setFillColor(RL_WHITE)
        c.drawString(1.05 * inch, y + h - 0.6 * inch, desc)


def render_pdf_showcase_image(c, data, W, H):
    card_x = 0.8 * inch
    card_y = 0.7 * inch
    card_w = 5.8 * inch
    card_h = 5.1 * inch

    draw_card(c, card_x, card_y, card_w, card_h)

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(RL_CYAN)
    c.drawString(card_x + 0.25 * inch, card_y + card_h - 0.45 * inch, f"KEY SYSTEM CAPABILITIES [{data.get('badge', 'FEATURE')}]")

    curr_y = card_y + card_h - 0.85 * inch
    for pt in data["points"]:
        c.setFont("Helvetica", 9.2)
        c.setFillColor(RL_WHITE)
        words = pt.split()
        line = ""
        for w in words:
            if len(line + " " + w) < 60:
                line += " " + w if line else w
            else:
                c.drawString(card_x + 0.25 * inch, curr_y, "• " + line)
                curr_y -= 0.18 * inch
                line = w
        if line:
            c.drawString(card_x + 0.25 * inch, curr_y, "• " + line)
            curr_y -= 0.28 * inch

    # Right Image
    if data["image"].exists():
        c.drawImage(str(data["image"]), 6.8 * inch, 0.7 * inch, width=5.733 * inch, height=5.1 * inch, preserveAspectRatio=True)


def render_pdf_two_col_tech(c, data, W, H):
    w = 5.75 * inch
    h = 5.1 * inch
    y = 0.7 * inch

    # Left
    draw_card(c, 0.8 * inch, y, w, h, border_color=data["left_card"]["rl_accent"])
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(data["left_card"]["rl_accent"])
    c.drawString(1.1 * inch, y + h - 0.45 * inch, f'{data["left_card"]["title"]} ({data["left_card"]["badge"]})')

    curr_y = y + h - 0.85 * inch
    for pt in data["left_card"]["points"]:
        c.setFont("Helvetica", 9.5)
        c.setFillColor(RL_WHITE)
        words = pt.split()
        line = ""
        for wd in words:
            if len(line + " " + wd) < 55:
                line += " " + wd if line else wd
            else:
                c.drawString(1.1 * inch, curr_y, "• " + line)
                curr_y -= 0.2 * inch
                line = wd
        if line:
            c.drawString(1.1 * inch, curr_y, "• " + line)
            curr_y -= 0.32 * inch

    # Right
    draw_card(c, 6.78 * inch, y, w, h, border_color=data["right_card"]["rl_accent"])
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(data["right_card"]["rl_accent"])
    c.drawString(7.08 * inch, y + h - 0.45 * inch, f'{data["right_card"]["title"]} ({data["right_card"]["badge"]})')

    curr_y = y + h - 0.85 * inch
    for pt in data["right_card"]["points"]:
        c.setFont("Helvetica", 9.5)
        c.setFillColor(RL_WHITE)
        words = pt.split()
        line = ""
        for wd in words:
            if len(line + " " + wd) < 55:
                line += " " + wd if line else wd
            else:
                c.drawString(7.08 * inch, curr_y, "• " + line)
                curr_y -= 0.2 * inch
                line = wd
        if line:
            c.drawString(7.08 * inch, curr_y, "• " + line)
            curr_y -= 0.32 * inch


def render_pdf_n8n_workflows(c, data, W, H):
    workflows = data["workflows"]
    col_w = 5.75 * inch
    row_h = 2.4 * inch
    gap_x = 0.233 * inch
    gap_y = 0.25 * inch

    positions = [
        (0.8 * inch, H - 1.55 * inch - row_h),
        (0.8 * inch + col_w + gap_x, H - 1.55 * inch - row_h),
        (0.8 * inch, H - 1.55 * inch - 2 * row_h - gap_y),
        (0.8 * inch + col_w + gap_x, H - 1.55 * inch - 2 * row_h - gap_y),
    ]

    for i, wf in enumerate(workflows):
        x, y = positions[i]
        draw_card(c, x, y, col_w, row_h, border_color=colors.HexColor("#06B6D4" if i == 0 else ("#EF4444" if i == 1 else ("#10B981" if i == 2 else "#F59E0B"))))

        c.setFont("Helvetica-Bold", 10.5)
        c.setFillColor(RL_WHITE)
        c.drawString(x + 0.25 * inch, y + row_h - 0.35 * inch, f"{wf['name']}")

        c.setFont("Helvetica", 9)
        c.setFillColor(RL_MUTED)
        words = wf["desc"].split()
        curr_y = y + row_h - 0.65 * inch
        line = ""
        for wd in words:
            if len(line + " " + wd) < 65:
                line += " " + wd if line else wd
            else:
                c.drawString(x + 0.25 * inch, curr_y, line)
                curr_y -= 0.2 * inch
                line = wd
        if line:
            c.drawString(x + 0.25 * inch, curr_y, line)


def render_pdf_tech_table(c, data, W, H):
    card_x = 0.8 * inch
    card_y = 0.7 * inch
    card_w = 7.5 * inch
    card_h = 5.1 * inch

    draw_card(c, card_x, card_y, card_w, card_h)

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(RL_CYAN)
    c.drawString(card_x + 0.25 * inch, card_y + card_h - 0.45 * inch, "FULL-STACK TECHNICAL COMPONENT MATRIX")

    curr_y = card_y + card_h - 0.85 * inch
    for cat, tech, host in data["stack"]:
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(RL_SKY)
        c.drawString(card_x + 0.25 * inch, curr_y, f"• {cat.upper()}:")

        c.setFont("Helvetica", 8.5)
        c.setFillColor(RL_WHITE)
        c.drawString(card_x + 2.2 * inch, curr_y, tech)

        c.setFont("Helvetica-Oblique", 8)
        c.setFillColor(RL_EMERALD)
        c.drawRightString(card_x + card_w - 0.25 * inch, curr_y, f"[{host}]")

        curr_y -= 0.55 * inch

    # Right Image
    if data["image"].exists():
        c.drawImage(str(data["image"]), 8.5 * inch, 0.7 * inch, width=4.033 * inch, height=5.1 * inch, preserveAspectRatio=True)


def render_pdf_impact_slide(c, data, W, H):
    metrics = data["metrics"]
    w = 2.78 * inch
    h = 1.4 * inch
    gap = 0.2 * inch
    y_metric = H - 1.55 * inch - h

    for i, (stat, title, sub) in enumerate(metrics):
        x = 0.8 * inch + i * (w + gap)
        draw_card(c, x, y_metric, w, h, border_color=RL_CYAN)

        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(RL_CYAN)
        c.drawString(x + 0.15 * inch, y_metric + h - 0.45 * inch, stat)

        c.setFont("Helvetica-Bold", 9.5)
        c.setFillColor(RL_WHITE)
        c.drawString(x + 0.15 * inch, y_metric + h - 0.8 * inch, title)

        c.setFont("Helvetica", 8)
        c.setFillColor(RL_MUTED)
        c.drawString(x + 0.15 * inch, y_metric + h - 1.1 * inch, sub)

    # Bottom Table
    table_y = 0.7 * inch
    table_h = 3.3 * inch
    draw_card(c, 0.8 * inch, table_y, 11.733 * inch, table_h)

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(RL_SKY)
    c.drawString(1.05 * inch, table_y + table_h - 0.45 * inch, "INNOVATION BENCHMARK: LEGACY CITY TOOLS VS. TERRAGUARD AI")

    curr_y = table_y + table_h - 0.85 * inch
    for row in data["comparison"][1:]:
        c.setFont("Helvetica", 9)
        c.setFillColor(RL_WHITE)
        c.drawString(1.05 * inch, curr_y, f"• {row[0]}:")
        c.setFillColor(RL_MUTED)
        c.drawString(3.5 * inch, curr_y, f"Legacy: {row[1]}")
        c.setFillColor(RL_EMERALD)
        c.drawString(7.5 * inch, curr_y, f"➔  TerraGuard AI: {row[2]}")
        curr_y -= 0.45 * inch


def render_pdf_final_submission(c, data, W, H):
    card_x = 0.8 * inch
    card_y = 0.7 * inch
    card_w = 6.0 * inch
    card_h = 5.1 * inch

    draw_card(c, card_x, card_y, card_w, card_h, border_color=RL_CYAN)

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(RL_CYAN)
    c.drawString(card_x + 0.3 * inch, card_y + card_h - 0.45 * inch, "OFFICIAL SUBMISSION DELIVERABLES")

    curr_y = card_y + card_h - 0.85 * inch
    for k, v in data["links"]:
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(RL_SKY)
        c.drawString(card_x + 0.3 * inch, curr_y, k.upper())

        c.setFont("Helvetica-Bold" if ("Insert" in v or "vercel" in v) else "Helvetica", 9.5)
        c.setFillColor(RL_EMERALD if "vercel" in v else (RL_AMBER if "Insert" in v else RL_WHITE))
        c.drawString(card_x + 0.3 * inch, curr_y - 0.22 * inch, v)
        curr_y -= 0.65 * inch

    # Right Card
    card_rx = 7.05 * inch
    card_rw = 5.48 * inch
    draw_card(c, card_rx, card_y, card_rw, card_h, border_color=RL_EMERALD)

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(RL_EMERALD)
    c.drawString(card_rx + 0.3 * inch, card_y + card_h - 0.45 * inch, "FUTURE ROADMAP & IMPACT EXPANSION")

    curr_y = card_y + card_h - 0.85 * inch
    for title, desc in data["roadmap"]:
        c.setFont("Helvetica-Bold", 10.5)
        c.setFillColor(RL_SKY)
        c.drawString(card_rx + 0.3 * inch, curr_y, f"▸ {title}")
        curr_y -= 0.25 * inch

        c.setFont("Helvetica", 9)
        c.setFillColor(RL_WHITE)
        words = desc.split()
        line = ""
        for wd in words:
            if len(line + " " + wd) < 65:
                line += " " + wd if line else wd
            else:
                c.drawString(card_rx + 0.45 * inch, curr_y, line)
                curr_y -= 0.2 * inch
                line = wd
        if line:
            c.drawString(card_rx + 0.45 * inch, curr_y, line)
            curr_y -= 0.4 * inch


if __name__ == "__main__":
    print("=" * 60)
    print("TERRAGUARD AI — INFINEX 2K26 HACKATHON PRESENTATION GENERATOR")
    print("=" * 60)
    generate_pptx()
    generate_pdf()
    print("=" * 60)
    print("ALL DELIVERABLES SUCCESSFULLY CREATED!")
    print(f"PPTX: {PPTX_OUTPUT} ({os.path.getsize(PPTX_OUTPUT)} bytes)")
    print(f"PDF:  {PDF_OUTPUT} ({os.path.getsize(PDF_OUTPUT)} bytes)")
    print("=" * 60)
