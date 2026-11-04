# TerraGuard AI — REST API Design & Endpoint Specification

**Backend Framework:** Python FastAPI (v0.111+)
**Base API Route:** `/api/v1`
**Specification Standard:** OpenAPI 3.1 & Pydantic v2 Models

---

## 1. Authentication & User Management

### 1.1 User Registration

- **Endpoint:** `POST /api/v1/auth/register`
- **Description:** Creates a new citizen or emergency operator account.
- **Request Body:**

```json
{
  "email": "resident@city.gov",
  "password": "StrongPassword123!",
  "full_name": "Dr. Sarah Chen",
  "role": "CITIZEN",
  "phone": "+1-555-0199"
}
```

- **Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "user_id": "66a9b1c2e4b0a1d2e3f4a5a0",
    "email": "resident@city.gov",
    "full_name": "Dr. Sarah Chen",
    "role": "CITIZEN"
  }
}
```

### 1.2 User Login & Token Issuance

- **Endpoint:** `POST /api/v1/auth/login`
- **Description:** Authenticates credentials and returns a signed JWT bearer token.
- **Request Body (`application/x-www-form-urlencoded` or JSON):**

```json
{
  "username": "resident@city.gov",
  "password": "StrongPassword123!"
}
```

- **Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in_seconds": 86400,
  "user": {
    "user_id": "66a9b1c2e4b0a1d2e3f4a5a0",
    "email": "resident@city.gov",
    "role": "CITIZEN"
  }
}
```

---

## 2. Incident & Hazard Reporting

### 2.1 Submit Hazard Incident (Citizen or Auto-Sensor)

- **Endpoint:** `POST /api/v1/incidents/report`
- **Description:** Ingests a new hazard report with optional media image. Asynchronously queues Gemini Vision image classification and dispatches high-severity alerts.
- **Request Body:**

```json
{
  "title": "Severe Waterlogging Underpass",
  "description": "Storm drain overflowing; vehicles stranded in 2+ ft water.",
  "category": "FLOOD",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "address": "MG Road Underpass, Sector 4",
  "image_url": "https://res.cloudinary.com/terraguard/image/upload/sample_flood.jpg"
}
```

- **Response (201 Created):**

```json
{
  "status": "success",
  "incident_id": "66a9b1c2e4b0a1d2e3f4a5b1",
  "severity": 4,
  "status": "REPORTED",
  "ai_analysis": {
    "detected_hazards": ["standing_water", "submerged_vehicles"],
    "confidence": 0.94,
    "recommended_action": "Deploy rapid suction pump units."
  },
  "created_at": "2026-11-04T12:28:45Z"
}
```

### 2.2 Query Geospatial Incidents (GeoJSON FeatureCollection)

- **Endpoint:** `GET /api/v1/incidents`
- **Query Parameters:**
  - `lat` (float, optional): Center latitude
  - `lng` (float, optional): Center longitude
  - `radius_km` (float, default: `10.0`): Proximity radius
  - `status` (string, optional): `REPORTED`, `VERIFIED`, `DISPATCHED`, `RESOLVED`
  - `category` (string, optional): `FLOOD`, `FIRE`, `AIR_POLLUTION`, etc.
  - `min_severity` (int, default: `1`): 1–5
- **Response (200 OK — GeoJSON FeatureCollection):**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "66a9b1c2e4b0a1d2e3f4a5b1",
      "geometry": {
        "type": "Point",
        "coordinates": [77.5946, 12.9716]
      },
      "properties": {
        "title": "Severe Waterlogging Underpass",
        "category": "FLOOD",
        "severity": 4,
        "status": "VERIFIED",
        "confidence_score": 0.94,
        "image_url": "https://res.cloudinary.com/terraguard/image/upload/sample_flood.jpg",
        "created_at": "2026-11-04T12:28:45Z"
      }
    }
  ],
  "total_count": 1
}
```

### 2.3 Update Incident Triage Status

- **Endpoint:** `PATCH /api/v1/incidents/{incident_id}/status`
- **Headers:** `Authorization: Bearer <TOKEN>` (Requires `RESPONDER` or `ADMIN`)
- **Request Body:**

```json
{
  "status": "DISPATCHED",
  "notes": "Emergency Drainage Unit 3 en route.",
  "assigned_department": "MUNICIPAL_STORMWATER_CORPS"
}
```

- **Response (200 OK):**

```json
{
  "status": "success",
  "incident_id": "66a9b1c2e4b0a1d2e3f4a5b1",
  "current_status": "DISPATCHED",
  "updated_at": "2026-11-04T12:35:00Z"
}
```

---

## 3. Environmental Telemetry & Sensors

### 3.1 Live Environmental Telemetry

- **Endpoint:** `GET /api/v1/telemetry/live`
- **Query Parameters:** `lat` (float), `lng` (float)
- **Response (200 OK):**

```json
{
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "city": "Bengaluru"
  },
  "weather": {
    "precipitation_mm": 48.5,
    "temperature_celsius": 24.2,
    "relative_humidity": 88,
    "wind_speed_kmh": 32.4,
    "source": "OPEN_METEO"
  },
  "air_quality": {
    "aqi_us": 142,
    "pm25": 52.3,
    "pm10": 98.7,
    "status": "UNHEALTHY_SENSITIVE",
    "source": "OPEN_AQ"
  },
  "timestamp": "2026-11-04T12:00:00Z"
}
```

### 3.2 24-Hour Timeseries (For Recharts Visualizations)

- **Endpoint:** `GET /api/v1/telemetry/timeseries`
- **Query Parameters:** `hours` (default: 24), `station_id` (optional)
- **Response (200 OK):**

```json
{
  "metrics": [
    { "time": "08:00", "precipitation": 12.0, "aqi": 85, "water_level_m": 1.2 },
    { "time": "10:00", "precipitation": 28.5, "aqi": 110, "water_level_m": 1.8 },
    { "time": "12:00", "precipitation": 48.5, "aqi": 142, "water_level_m": 2.4 }
  ]
}
```

---

## 4. Predictive Risk Engine & Spatial Zones

### 4.1 Urban Risk Zones Boundary & Scores

- **Endpoint:** `GET /api/v1/risks/zones`
- **Response (200 OK — GeoJSON FeatureCollection of Polygons):**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [[77.585, 12.965], [77.605, 12.965], [77.605, 12.980], [77.585, 12.980], [77.585, 12.965]]
        ]
      },
      "properties": {
        "zone_code": "URBAN-ZONE-04A",
        "name": "Central Lowland Drainage Basin",
        "composite_risk_score": 78.4,
        "risk_level": "HIGH",
        "primary_hazard": "FLASH_FLOOD",
        "contributing_factors": {
          "precipitation_load": 0.45,
          "topographic_depression": 0.25,
          "drain_capacity_deficit": 0.20,
          "incident_reports_active": 0.10
        }
      }
    }
  ]
}
```

### 4.2 On-Demand AI Risk Simulation

- **Endpoint:** `POST /api/v1/risks/simulate`
- **Request Body:**

```json
{
  "zone_code": "URBAN-ZONE-04A",
  "simulated_rainfall_mm": 80.0,
  "duration_hours": 3
}
```

- **Response (200 OK):**

```json
{
  "projected_risk_score": 92.1,
  "projected_risk_level": "CRITICAL",
  "flood_inundation_probability": 0.88,
  "estimated_affected_population": 45000,
  "critical_infrastructure_at_risk": ["City Hospital Substation", "Sector 4 Metro Line"],
  "ai_mitigation_plan": "Pre-stage mobile high-capacity pumps at Sector 4 Junction. Trigger flood barrier protocol."
}
```

---

## 5. Webhooks & Automation Integration

### 5.1 n8n Action Callback

- **Endpoint:** `POST /api/v1/webhooks/n8n/action-callback`
- **Headers:** `X-TerraGuard-Webhook-Secret: <SECRET>`
- **Request Body:**

```json
{
  "workflow_id": "WF-CRITICAL-HAZARD-01",
  "incident_id": "66a9b1c2e4b0a1d2e3f4a5b1",
  "action_dispatched": "EMERGENCY_BROADCAST",
  "channels_notified": ["TELEGRAM", "SMS"],
  "status": "SUCCESS",
  "executed_at": "2026-11-04T12:35:10Z"
}
```

---

## 6. System Health & Diagnostics

### 6.1 Health Check

- **Endpoint:** `GET /api/v1/health`
- **Response (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2026-11-04T12:35:20Z",
  "database": {
    "status": "connected",
    "latency_ms": 14.2
  },
  "services": {
    "open_meteo": "operational",
    "open_aq": "operational",
    "gemini_api": "operational"
  }
}
```
