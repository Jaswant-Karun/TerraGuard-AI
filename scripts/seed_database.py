#!/usr/bin/env python3
"""TerraGuard AI — Database Seeding Script.

Seeds clearly identified sample records for development and local testing.
All generated records carry metadata.is_sample = True.
"""

import argparse
import asyncio
import os
import sys
from datetime import UTC, datetime
from pathlib import Path

# Add backend to Python path
backend_dir = Path(__file__).resolve().parent.parent / "apps" / "backend"
sys.path.insert(0, str(backend_dir))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.core.config import settings  # noqa: E402
from app.core.database import db_manager  # noqa: E402
from app.core.security import hash_password  # noqa: E402


SAMPLE_METADATA = {
    "is_sample": True,
    "seed_version": "1.0.0",
    "environment": "development",
    "seeded_at": datetime.now(UTC).isoformat(),
}

# 1. Sample Facilities & Critical Infrastructure
SAMPLE_LOCATIONS = [
    {
        "name": "Victoria Hospital Emergency Trauma Center",
        "category": "HOSPITAL",
        "location": {"type": "Point", "coordinates": [77.5738, 12.9642]},
        "address": "Fort Road, Kalasipalyam, Bengaluru, Karnataka 560002",
        "capacity": 850,
        "is_operational": True,
        "contact_phone": "+91-80-2670-1150",
        "metadata": SAMPLE_METADATA,
    },
    {
        "name": "High Grounds Fire & Disaster Rescue Station",
        "category": "FIRE_STATION",
        "location": {"type": "Point", "coordinates": [77.5873, 12.9902]},
        "address": "Sankey Road, High Grounds, Bengaluru 560001",
        "capacity": 45,
        "is_operational": True,
        "contact_phone": "+91-80-2297-1500",
        "metadata": SAMPLE_METADATA,
    },
    {
        "name": "Koramangala Stormwater Sluice & Pumping Station",
        "category": "PUMP_STATION",
        "location": {"type": "Point", "coordinates": [77.6245, 12.9352]},
        "address": "80 Feet Road, 4th Block, Koramangala, Bengaluru 560034",
        "capacity": 12000,
        "is_operational": True,
        "contact_phone": "+91-80-2553-9090",
        "metadata": SAMPLE_METADATA,
    },
    {
        "name": "BBMP Central Emergency Shelter & Relief Hub",
        "category": "EMERGENCY_SHELTER",
        "location": {"type": "Point", "coordinates": [77.5946, 12.9716]},
        "address": "Corporation Circle, Hudson Circle, Bengaluru 560001",
        "capacity": 1500,
        "is_operational": True,
        "contact_phone": "+91-80-2222-1188",
        "metadata": SAMPLE_METADATA,
    },
    {
        "name": "Peenya Industrial HAZMAT Rapid Response Station",
        "category": "RELIEF_HUB",
        "location": {"type": "Point", "coordinates": [77.5255, 13.0305]},
        "address": "Peenya Industrial Area Phase 2, Bengaluru 560058",
        "capacity": 300,
        "is_operational": True,
        "contact_phone": "+91-80-2839-4411",
        "metadata": SAMPLE_METADATA,
    },
    {
        "name": "Hebbal Lake Flood Siphon & Telemetry Station",
        "category": "SENSOR_STATION",
        "location": {"type": "Point", "coordinates": [77.5925, 13.0382]},
        "address": "Bellary Road, Hebbal Flyover Junction, Bengaluru 560024",
        "capacity": 50,
        "is_operational": True,
        "contact_phone": "+91-80-2341-2299",
        "metadata": SAMPLE_METADATA,
    },
]

# 2. Sample Risk Assessment Zones (Polygons)
SAMPLE_RISK_ZONES = [
    {
        "zone_code": "BLR-ZONE-BELLANDUR-01",
        "name": "Bellandur Lake Flood Basin Catchment",
        "risk_level": "HIGH",
        "composite_risk_score": 78.4,
        "primary_hazard": "FLASH_FLOOD",
        "boundary": {
            "type": "Polygon",
            "coordinates": [
                [
                    [77.6550, 12.9250],
                    [77.6850, 12.9250],
                    [77.6850, 12.9480],
                    [77.6550, 12.9480],
                    [77.6550, 12.9250],
                ]
            ],
        },
        "contributing_factors": {
            "topographical_slope_score": 82.0,
            "soil_saturation_index": 79.5,
            "storm_drain_capacity_deficit": 74.0,
        },
        "estimated_affected_population": 48500,
        "metadata": SAMPLE_METADATA,
    },
    {
        "zone_code": "BLR-ZONE-SILKBOARD-02",
        "name": "Central Silk Board Runoff Inundation Sector",
        "risk_level": "CRITICAL",
        "composite_risk_score": 91.2,
        "primary_hazard": "FLASH_FLOOD",
        "boundary": {
            "type": "Polygon",
            "coordinates": [
                [
                    [77.6150, 12.9120],
                    [77.6350, 12.9120],
                    [77.6350, 12.9260],
                    [77.6150, 12.9260],
                    [77.6150, 12.9120],
                ]
            ],
        },
        "contributing_factors": {
            "elevation_depression_ratio": 94.0,
            "impervious_surface_percent": 96.0,
            "culvert_backflow_risk": 88.5,
        },
        "estimated_affected_population": 65000,
        "metadata": SAMPLE_METADATA,
    },
    {
        "zone_code": "BLR-ZONE-PEENYA-03",
        "name": "Peenya Heavy Industrial Air Quality Basin",
        "risk_level": "MODERATE",
        "composite_risk_score": 62.0,
        "primary_hazard": "AIR_POLLUTION",
        "boundary": {
            "type": "Polygon",
            "coordinates": [
                [
                    [77.5100, 13.0180],
                    [77.5400, 13.0180],
                    [77.5400, 13.0450],
                    [77.5100, 13.0450],
                    [77.5100, 13.0180],
                ]
            ],
        },
        "contributing_factors": {
            "voc_particulate_concentration": 68.0,
            "thermal_inversion_susceptibility": 58.0,
        },
        "estimated_affected_population": 32000,
        "metadata": SAMPLE_METADATA,
    },
]

# 3. Sample Citizen Hazard Reports
SAMPLE_CITIZEN_REPORTS = [
    {
        "title": "Severe road waterlogging - Indiranagar 100ft Rd",
        "description": "Knee-deep stormwater accumulating near 12th Main junction, two vehicles stalled, drain blocked with silt.",
        "category": "FLOOD",
        "severity": 4,
        "status": "VERIFIED",
        "location": {"type": "Point", "coordinates": [77.6408, 12.9719]},
        "address": "100 Feet Rd & 12th Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru",
        "media_urls": ["https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800"],
        "metadata": SAMPLE_METADATA,
    },
    {
        "title": "Storm drain wall breached at HSR Sector 2",
        "description": "Secondary storm canal wall cracked under heavy flow, water entering basements of apartment complexes.",
        "category": "FLOOD",
        "severity": 4,
        "status": "DISPATCHED",
        "location": {"type": "Point", "coordinates": [77.6521, 12.9121]},
        "address": "19th Main Rd, Sector 2, HSR Layout, Bengaluru",
        "media_urls": [],
        "metadata": SAMPLE_METADATA,
    },
    {
        "title": "Fallen power transformer & tree blocking corridor",
        "description": "Old banyan branch collapsed onto high-tension wire and road divider, emergency barricade required.",
        "category": "INFRASTRUCTURE_FAILURE",
        "severity": 3,
        "status": "AI_ANALYZED",
        "location": {"type": "Point", "coordinates": [77.5833, 12.9304]},
        "address": "9th Main Rd, 4th Block, Jayanagar, Bengaluru",
        "media_urls": [],
        "metadata": SAMPLE_METADATA,
    },
    {
        "title": "Heavy chemical particulate cloud fromPeenya foundry",
        "description": "Intense pungent smoke plume drifting toward residential colonies, zero wind dispersing the haze.",
        "category": "AIR_POLLUTION",
        "severity": 3,
        "status": "REPORTED",
        "location": {"type": "Point", "coordinates": [77.5210, 13.0290]},
        "address": "Phase 2, Peenya Industrial Area, Bengaluru",
        "media_urls": [],
        "metadata": SAMPLE_METADATA,
    },
    {
        "title": "Sudden water level surge near Bellandur feeder canal",
        "description": "Water rising above warning marker on footbridge within 15 minutes of heavy rain.",
        "category": "FLOOD",
        "severity": 5,
        "status": "VERIFIED",
        "location": {"type": "Point", "coordinates": [77.6711, 12.9348]},
        "address": "Yemalur Main Rd, Bellandur Lake Buffer, Bengaluru",
        "media_urls": [],
        "metadata": SAMPLE_METADATA,
    },
]

# 4. Sample Alerts
SAMPLE_ALERTS = [
    {
        "title": "Flash Flood Red Advisory — Bellandur & Outer Ring Road",
        "message": "High water levels detected in storm runoff channels. Evacuate subterranean parking structures immediately. Follow approved evacuation routes.",
        "severity": "HIGH",
        "target_zone": "BLR-ZONE-BELLANDUR-01",
        "location": {"type": "Point", "coordinates": [77.6680, 12.9360]},
        "radius_km": 6.5,
        "channels": ["SMS", "TELEGRAM", "DASHBOARD", "SIREN"],
        "is_active": True,
        "metadata": SAMPLE_METADATA,
    },
    {
        "title": "Air Quality Alert — PM2.5 Spike across Peenya Sector",
        "message": "Particulate pollution levels exceed 240 µg/m³. Vulnerable citizens and seniors advised to remain indoors.",
        "severity": "MODERATE",
        "target_zone": "BLR-ZONE-PEENYA-03",
        "location": {"type": "Point", "coordinates": [77.5255, 13.0305]},
        "radius_km": 4.0,
        "channels": ["TELEGRAM", "DASHBOARD"],
        "is_active": True,
        "metadata": SAMPLE_METADATA,
    },
]

# 5. Sample Safe Evacuation Routes
SAMPLE_SAFE_ROUTES = [
    {
        "name": "Koramangala-to-Hudson Safe High-Ground Corridor",
        "status": "ACTIVE",
        "path": {
            "type": "LineString",
            "coordinates": [
                [77.6245, 12.9352],
                [77.6100, 12.9500],
                [77.5990, 12.9650],
                [77.5946, 12.9716],
            ],
        },
        "avoid_hazard_categories": ["FLOOD"],
        "capacity_vehicles_per_hour": 2200,
        "origin_zone": "BLR-ZONE-SILKBOARD-02",
        "destination_shelter_id": "BBMP-CENTRAL-SHELTER",
        "metadata": SAMPLE_METADATA,
    }
]

# 6. Sample Historical Events (For AI Model Baselines)
SAMPLE_HISTORICAL_EVENTS = [
    {
        "event_type": "URBAN_CLOUDBURST_FLOOD",
        "description": "Bengaluru September 2022 historic urban cloudburst (131mm in 4 hours). Widespread inundation of ORR IT corridor.",
        "location": {"type": "Point", "coordinates": [77.6711, 12.9348]},
        "peak_severity": 5,
        "damage_estimate_usd": 28000000.0,
        "casualties_count": 2,
        "occurred_at": datetime(2022, 9, 5, 18, 30, tzinfo=UTC),
        "metadata": SAMPLE_METADATA,
    },
    {
        "event_type": "HEATWAVE_PARTICULATE_TRAP",
        "description": "April 2024 sustained 39.2°C temperature inversion creating ground-level ozone and PM10 stagnation.",
        "location": {"type": "Point", "coordinates": [77.5255, 13.0305]},
        "peak_severity": 3,
        "damage_estimate_usd": 450000.0,
        "casualties_count": 0,
        "occurred_at": datetime(2024, 4, 18, 12, 0, tzinfo=UTC),
        "metadata": SAMPLE_METADATA,
    },
]


async def seed_dataset(purge_first: bool = False, dry_run: bool = False) -> None:
    print(f"\n🌱 [TerraGuard AI] Database Seeder starting...")
    print(f"   Target Environment: {settings.ENVIRONMENT}")
    print(f"   Database Name:      {settings.DATABASE_NAME}")

    await db_manager.connect()

    is_atlas = not db_manager.is_fallback() and db_manager.db is not None
    print(f"   Connection Mode:    {'MongoDB Atlas (Cluster)' if is_atlas else 'In-Memory Resilient Store'}")

    if purge_first:
        print("\n🧹 Purging existing sample data (metadata.is_sample == True)...")
        if not dry_run:
            for col_name in db_manager.COLLECTIONS:
                if is_atlas:
                    res = await db_manager.db[col_name].delete_many({"metadata.is_sample": True})
                    print(f"   - Removed {res.deleted_count} sample docs from '{col_name}'")
                else:
                    store = db_manager._collections_data.get(col_name, {})
                    keys_to_del = [k for k, v in store.items() if v.get("metadata", {}).get("is_sample") is True]
                    for k in keys_to_del:
                        del store[k]
                    print(f"   - Removed {len(keys_to_del)} sample docs from in-memory '{col_name}'")

    if dry_run:
        print("\n🔍 DRY RUN: No documents will be committed to the database.")
        print(f"   Planned Locations:         {len(SAMPLE_LOCATIONS)}")
        print(f"   Planned Risk Zones:        {len(SAMPLE_RISK_ZONES)}")
        print(f"   Planned Citizen Reports:   {len(SAMPLE_CITIZEN_REPORTS)}")
        print(f"   Planned Alerts:            {len(SAMPLE_ALERTS)}")
        print(f"   Planned Safe Routes:       {len(SAMPLE_SAFE_ROUTES)}")
        print(f"   Planned Historical Events: {len(SAMPLE_HISTORICAL_EVENTS)}")
        await db_manager.disconnect()
        return

    # Seed Locations
    print(f"\n📍 Inserting {len(SAMPLE_LOCATIONS)} critical facilities into 'locations'...")
    for loc in SAMPLE_LOCATIONS:
        if is_atlas:
            await db_manager.db["locations"].replace_one(
                {"name": loc["name"]},
                loc,
                upsert=True,
            )
        else:
            doc_id = loc.get("id") or loc["name"]
            loc["id"] = doc_id
            db_manager._collections_data.setdefault("locations", {})[doc_id] = loc

    # Seed Risk Zones
    print(f"🗺️  Inserting {len(SAMPLE_RISK_ZONES)} risk zones into 'risk_assessments'...")
    for rz in SAMPLE_RISK_ZONES:
        if is_atlas:
            await db_manager.db["risk_assessments"].replace_one(
                {"zone_code": rz["zone_code"]},
                rz,
                upsert=True,
            )
        else:
            doc_id = rz["zone_code"]
            rz["id"] = doc_id
            db_manager._collections_data.setdefault("risk_assessments", {})[doc_id] = rz

    # Seed Citizen Reports
    print(f"📢 Inserting {len(SAMPLE_CITIZEN_REPORTS)} citizen reports into 'citizen_reports'...")
    for cr in SAMPLE_CITIZEN_REPORTS:
        if is_atlas:
            await db_manager.db["citizen_reports"].replace_one(
                {"title": cr["title"]},
                cr,
                upsert=True,
            )
        else:
            doc_id = cr["title"]
            cr["id"] = doc_id
            db_manager._collections_data.setdefault("citizen_reports", {})[doc_id] = cr

    # Seed Alerts
    print(f"🚨 Inserting {len(SAMPLE_ALERTS)} alerts into 'alerts'...")
    for alert in SAMPLE_ALERTS:
        if is_atlas:
            await db_manager.db["alerts"].replace_one(
                {"title": alert["title"]},
                alert,
                upsert=True,
            )
        else:
            doc_id = alert["title"]
            alert["id"] = doc_id
            db_manager._collections_data.setdefault("alerts", {})[doc_id] = alert

    # Seed Safe Routes
    print(f"🛣️  Inserting {len(SAMPLE_SAFE_ROUTES)} evacuation routes into 'safe_routes'...")
    for route in SAMPLE_SAFE_ROUTES:
        if is_atlas:
            await db_manager.db["safe_routes"].replace_one(
                {"name": route["name"]},
                route,
                upsert=True,
            )
        else:
            doc_id = route["name"]
            route["id"] = doc_id
            db_manager._collections_data.setdefault("safe_routes", {})[doc_id] = route

    # Seed Historical Events
    print(f"📜 Inserting {len(SAMPLE_HISTORICAL_EVENTS)} historical events into 'historical_events'...")
    for he in SAMPLE_HISTORICAL_EVENTS:
        if is_atlas:
            await db_manager.db["historical_events"].replace_one(
                {"event_type": he["event_type"], "occurred_at": he["occurred_at"]},
                he,
                upsert=True,
            )
        else:
            doc_id = f"{he['event_type']}_{he['occurred_at']}"
            he["id"] = doc_id
            db_manager._collections_data.setdefault("historical_events", {})[doc_id] = he

    print("\n✅ Seed dataset applied successfully!")
    await db_manager.disconnect()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TerraGuard AI Sample Data Seeder")
    parser.add_argument("--purge", action="store_true", help="Purge existing sample data before seeding")
    parser.add_argument("--dry-run", action="store_true", help="Preview seed operations without writing to database")
    args = parser.parse_args()

    asyncio.run(seed_dataset(purge_first=args.purge, dry_run=args.dry_run))
