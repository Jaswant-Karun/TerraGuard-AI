# TerraGuard AI — Database Design & Spatial Schema Specification

**Database:** MongoDB Atlas (v7.0+)
**Spatial Engine:** MongoDB GeoJSON with `2dsphere` Indexing

---

## 1. Database Architecture Overview

TerraGuard AI leverages MongoDB Atlas as a document-based spatial data engine. Document stores provide the ideal flexible representation for diverse sensor telemetry (varying pollutant parameters, weather attributes) and native GeoJSON specifications (`Point`, `Polygon`, `MultiPolygon`) capable of sub-millisecond `$nearSphere` and `$geoIntersects` queries.

```text
                    +---------------------------+
                    |    MongoDB Atlas Cluster  |
                    |   Database: "terraguard"  |
                    +-------------+-------------+
                                  |
     +-----------------+----------+---------+-----------------+
     |                 |                    |                 |
     v                 v                    v                 v
+-------------+ +--------------------+ +-------------+ +---------------+
| incidents   | | telemetry_readings | | risk_zones  | | users & logs  |
| (GeoJSON Pt)| | (GeoJSON Point)    | | (Polygon)   | | (Admin/Auth)  |
+-------------+ +--------------------+ +-------------+ +---------------+
```

---

## 2. Collections & Document Schemas

### 2.1 Collection: `incidents`

Stores all hazard reports submitted by citizens, automated sensor alerts, and triage response stages.

```json
{
  "_id": "ObjectId('66a9b1c2e4b0a1d2e3f4a5b1')",
  "title": "Severe Flash Flooding at Metro Underpass",
  "description": "Water level reaching over 2 feet, vehicles stalled, storm drain clogged with urban debris.",
  "category": "FLOOD",
  "status": "VERIFIED",
  "severity": 4,
  "confidence_score": 0.94,
  "location": {
    "type": "Point",
    "coordinates": [77.5946, 12.9716]
  },
  "address": "MG Road Underpass, Central Ward, Sector 4",
  "media_urls": [
    "https://res.cloudinary.com/terraguard/image/upload/v1722000000/incidents/flood_mg_road.jpg"
  ],
  "ai_analysis": {
    "model_version": "gemini-2.0-flash",
    "analyzed_at": "2026-11-04T12:30:15Z",
    "detected_hazards": ["standing_water", "submerged_vehicles", "blocked_drainage"],
    "water_depth_estimate_meters": 0.65,
    "structural_risk_flag": true,
    "recommended_action": "Deploy rapid suction pump units and redirect traffic via North Overpass."
  },
  "reported_by": {
    "user_id": "ObjectId('66a9b1c2e4b0a1d2e3f4a5a0')",
    "name": "Citizen Sentinel",
    "is_anonymous": false
  },
  "assigned_team": {
    "department": "MUNICIPAL_STORMWATER_CORPS",
    "dispatched_at": "2026-11-04T12:35:00Z",
    "status": "EN_ROUTE"
  },
  "created_at": "2026-11-04T12:28:45Z",
  "updated_at": "2026-11-04T12:35:00Z"
}
```

#### Enums & Allowed Values

- **`category`**: `FLOOD`, `AIR_POLLUTION`, `FIRE`, `LANDSLIDE`, `INFRASTRUCTURE_FAILURE`, `HEATWAVE`, `WATER_CONTAMINATION`.
- **`status`**: `REPORTED`, `AI_ANALYZED`, `VERIFIED`, `DISPATCHED`, `RESOLVED`, `REJECTED`.
- **`severity`**: Integer `1` (Minor advisory) to `5` (Life-threatening emergency).

---

### 2.2 Collection: `telemetry_readings`

Time-series environmental records ingested from Open-Meteo, OpenAQ, and local environmental stations.

```json
{
  "_id": "ObjectId('66a9b1c2e4b0a1d2e3f4a5c3')",
  "station_id": "METEO-CENTRAL-01",
  "source": "OPEN_METEO",
  "location": {
    "type": "Point",
    "coordinates": [77.5912, 12.9784]
  },
  "metrics": {
    "precipitation_mm": 48.5,
    "precipitation_probability": 95,
    "temperature_celsius": 24.2,
    "relative_humidity": 88,
    "wind_speed_kmh": 32.4,
    "wind_gusts_kmh": 54.1,
    "surface_pressure_hpa": 1008.2,
    "aqi_us": 142,
    "pm25": 52.3,
    "pm10": 98.7,
    "no2": 31.4,
    "o3": 18.2
  },
  "timestamp": "2026-11-04T12:00:00Z",
  "created_at": "2026-11-04T12:05:00Z"
}
```

---

### 2.3 Collection: `risk_zones`

Spatial boundary polygons delineating administrative zones, floodplains, and vulnerable urban sectors.

```json
{
  "_id": "ObjectId('66a9b1c2e4b0a1d2e3f4a5d8')",
  "zone_code": "URBAN-ZONE-04A",
  "name": "Central Lowland Drainage Basin",
  "boundary": {
    "type": "Polygon",
    "coordinates": [
      [
        [77.5850, 12.9650],
        [77.6050, 12.9650],
        [77.6050, 12.9800],
        [77.5850, 12.9800],
        [77.5850, 12.9650]
      ]
    ]
  },
  "composite_risk_score": 78.4,
  "risk_level": "HIGH",
  "factors": {
    "rainfall_saturation_weight": 0.45,
    "elevation_vulnerability_weight": 0.25,
    "drainage_clog_index": 0.20,
    "historical_incident_density": 0.10
  },
  "population_density_per_sqkm": 14200,
  "critical_infrastructure_count": 8,
  "evacuation_routes": ["NH-44 Corridor West", "Ring Road Elevated Spur"],
  "last_assessed_at": "2026-11-04T12:15:00Z"
}
```

---

### 2.4 Collection: `action_logs` (Disaster Response & Automation Trail)

Tracks automated triggers fired by n8n or municipal supervisors to provide full audit accountability.

```json
{
  "_id": "ObjectId('66a9b1c2e4b0a1d2e3f4a5e9')",
  "incident_id": "ObjectId('66a9b1c2e4b0a1d2e3f4a5b1')",
  "triggered_by": "N8N_AUTOMATION_ROUTER",
  "workflow_id": "WF-CRITICAL-HAZARD-01",
  "action_type": "EMERGENCY_BROADCAST",
  "channels": ["TELEGRAM_ALERT_CHANNEL", "SMS_GATEWAY", "MUNICIPAL_DASHBOARD_SOUND"],
  "payload": {
    "severity": 4,
    "target_zone": "URBAN-ZONE-04A",
    "message": "Flash flood warning at MG Road Underpass. Diversions in effect."
  },
  "response_status": "DELIVERED",
  "created_at": "2026-11-04T12:35:05Z"
}
```

---

### 2.5 Collection: `users`

Supports Role-Based Access Control (RBAC).

```json
{
  "_id": "ObjectId('66a9b1c2e4b0a1d2e3f4a5a0')",
  "email": "commander@terraguard.ai",
  "hashed_password": "$2b$12$e80yq9B...",
  "full_name": "Chief Elena Rostova",
  "role": "CITY_ADMIN",
  "department": "Emergency Operations Command",
  "is_active": true,
  "created_at": "2026-11-01T08:00:00Z"
}
```

---

## 3. Indexes & Optimization Plan

### 3.1 Geospatial Indexes

```javascript
// Spatial indexing on point locations for sub-millisecond proximity queries
db.incidents.createIndex({ "location": "2dsphere" });
db.telemetry_readings.createIndex({ "location": "2dsphere" });

// Spatial indexing on boundary polygons
db.risk_zones.createIndex({ "boundary": "2dsphere" });
```

### 3.2 Compound & Performance Indexes

```javascript
// Incident status and temporal queries
db.incidents.createIndex({ "status": 1, "created_at": -1 });
db.incidents.createIndex({ "category": 1, "severity": -1 });

// Time-series telemetry lookups
db.telemetry_readings.createIndex({ "station_id": 1, "timestamp": -1 });
db.telemetry_readings.createIndex({ "timestamp": -1 });

// User authentication
db.users.createIndex({ "email": 1 }, { unique: true });
```

---

## 4. Primary Geospatial Query Patterns

### Proximity Query: Incidents Near User Location (`$nearSphere`)

```javascript
db.incidents.find({
  location: {
    $nearSphere: {
      $geometry: {
        type: "Point",
        coordinates: [77.5946, 12.9716]
      },
      $maxDistance: 5000 // 5 km radius in meters
    }
  },
  status: { $in: ["VERIFIED", "DISPATCHED"] }
});
```

### Boundary Containment Query (`$geoWithin`)

```javascript
db.incidents.find({
  location: {
    $geoWithin: {
      $polygon: [
        [77.5850, 12.9650],
        [77.6050, 12.9650],
        [77.6050, 12.9800],
        [77.5850, 12.9800],
        [77.5850, 12.9650]
      ]
    }
  }
});
```
