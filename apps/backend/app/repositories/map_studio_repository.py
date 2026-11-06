"""Repository for TerraGuard AI 2.0 Additive Map Intelligence Studio."""

from datetime import datetime, timezone
from typing import Any, Dict, List

from app.schemas.map_studio import (
    ExperienceLegendItem,
    ExperienceViewMeta,
    FloodRiskZoneFeature,
    FloodRiskZonesResponse,
    FloodZoneProperties,
    GeoJSONGeometry,
    LayerMetadata,
    MapPresetSector,
    MapStudioExperienceResponse,
    MapStudioLayersResponse,
    MapStudioPresetsResponse,
    MapStudioTelemetryResponse,
    PrecipitationPoint,
)


class MapStudioRepository:
    """Provides curated GIS layers, predictive flood zones, and telemetry models for Map Studio."""

    @staticmethod
    def get_layer_catalog() -> MapStudioLayersResponse:
        layers = [
            LayerMetadata(
                id="flood_risk_zones",
                name="Predictive Flood Inundation Zones",
                category="hazards",
                description="Machine-learning predicted inundation depth polygons based on rainfall & elevation raster",
                source="TerraGuard Hydro-UNet v2.4 + BBMP Stormwater LiDAR",
                update_frequency="Real-time (5 min sync)",
                visible_by_default=True,
                default_opacity=0.75,
                badge="PREDICTIVE",
            ),
            LayerMetadata(
                id="water_bodies",
                name="Surface Water Bodies & Reservoirs",
                category="environmental",
                description="Active lake basins, wetland retention sinks, and stormwater detention reservoirs",
                source="Karnataka Lake Development Authority & Sentinel-2 Water Index",
                update_frequency="Daily satellite pass",
                visible_by_default=True,
                default_opacity=0.85,
            ),
            LayerMetadata(
                id="stormwater_network",
                name="Primary Stormwater Culverts & Drains",
                category="infrastructure",
                description="Major raja kaluve (storm drains), arterial culverts, and municipal pump stations",
                source="BBMP GIS Cell & Smart City Urban Drainage Registry",
                update_frequency="Weekly infrastructure inspection",
                visible_by_default=False,
                default_opacity=0.7,
            ),
            LayerMetadata(
                id="critical_facilities",
                name="Emergency Shelters & Medical Centers",
                category="infrastructure",
                description="Operational emergency relief shelters, designated evacuation nodes, and trauma centers",
                source="District Disaster Management Authority (DDMA)",
                update_frequency="Continuous live status",
                visible_by_default=True,
                default_opacity=0.9,
                badge="CRITICAL",
            ),
            LayerMetadata(
                id="citizen_reports",
                name="Citizen Hazard Incident Cluster",
                category="reports",
                description="Verified and pending community hazard reports (waterlogging, culvert blockages, tree falls)",
                source="TerraGuard Citizen Incident Engine & Mobile Reports",
                update_frequency="Real-time live ingestion",
                visible_by_default=True,
                default_opacity=0.9,
                badge="LIVE",
            ),
            LayerMetadata(
                id="iot_telemetry_nodes",
                name="IoT Water Level & Rain Gauges",
                category="sensors",
                description="Ultrasonic river-stage gauges, automated rain tipping buckets, and storm sensor telemetry",
                source="Municipal IoT Sensor Mesh Network (LoRaWAN)",
                update_frequency="15 second telemetry cycle",
                visible_by_default=True,
                default_opacity=0.9,
            ),
            LayerMetadata(
                id="radar_reflectivity",
                name="Doppler Weather Radar Precipitation",
                category="environmental",
                description="Composite atmospheric radar reflectivity overlay highlighting intense convective precipitation cores",
                source="India Meteorological Department (IMD) DWR Bengaluru",
                update_frequency="10 min radar scan",
                visible_by_default=False,
                default_opacity=0.6,
                badge="IMD RADAR",
            ),
        ]
        categories = ["hazards", "environmental", "infrastructure", "reports", "sensors"]
        return MapStudioLayersResponse(layers=layers, total=len(layers), categories=categories)

    @staticmethod
    def get_flood_risk_zones() -> FloodRiskZonesResponse:
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # High fidelity polygon features around Bengaluru flood-prone urban basins
        features = [
            FloodRiskZoneFeature(
                type="Feature",
                id="zone-blr-koramangala-01",
                properties=FloodZoneProperties(
                    zone_id="Z-KOR-04",
                    sector_name="Koramangala 80ft Road Lowland Basin",
                    risk_level="CRITICAL",
                    risk_score=91.4,
                    flood_depth_m=0.72,
                    population_at_risk=42800,
                    area_sqkm=3.45,
                    primary_hazard="Flash Inundation & Culvert Silt Backflow",
                    drainage_saturation_pct=94.2,
                    last_updated=now_iso,
                ),
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [77.6180, 12.9290],
                        [77.6360, 12.9320],
                        [77.6410, 12.9240],
                        [77.6250, 12.9180],
                        [77.6180, 12.9290],
                    ]],
                ),
            ),
            FloodRiskZoneFeature(
                type="Feature",
                id="zone-blr-bellandur-02",
                properties=FloodZoneProperties(
                    zone_id="Z-BEL-01",
                    sector_name="Bellandur Catchment & EcoSpace Spillway",
                    risk_level="HIGH",
                    risk_score=78.6,
                    flood_depth_m=0.48,
                    population_at_risk=68500,
                    area_sqkm=5.12,
                    primary_hazard="Spillway Overflow & Arterial Waterlogging",
                    drainage_saturation_pct=83.5,
                    last_updated=now_iso,
                ),
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [77.6650, 12.9280],
                        [77.6920, 12.9340],
                        [77.6980, 12.9200],
                        [77.6710, 12.9150],
                        [77.6650, 12.9280],
                    ]],
                ),
            ),
            FloodRiskZoneFeature(
                type="Feature",
                id="zone-blr-mahadevapura-03",
                properties=FloodZoneProperties(
                    zone_id="Z-MHD-09",
                    sector_name="Mahadevapura ORR Tech Corridor",
                    risk_level="HIGH",
                    risk_score=74.2,
                    flood_depth_m=0.39,
                    population_at_risk=51200,
                    area_sqkm=4.20,
                    primary_hazard="Impervious Runoff & Surcharged Box Drains",
                    drainage_saturation_pct=79.0,
                    last_updated=now_iso,
                ),
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [77.6890, 12.9850],
                        [77.7120, 12.9900],
                        [77.7180, 12.9720],
                        [77.6930, 12.9690],
                        [77.6890, 12.9850],
                    ]],
                ),
            ),
            FloodRiskZoneFeature(
                type="Feature",
                id="zone-blr-hebbal-04",
                properties=FloodZoneProperties(
                    zone_id="Z-HEB-02",
                    sector_name="Hebbal Valley Drainage Sump",
                    risk_level="MODERATE",
                    risk_score=52.8,
                    flood_depth_m=0.22,
                    population_at_risk=24900,
                    area_sqkm=2.85,
                    primary_hazard="Elevated Water Table & Retention Lag",
                    drainage_saturation_pct=58.4,
                    last_updated=now_iso,
                ),
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [77.5840, 13.0320],
                        [77.6080, 13.0380],
                        [77.6140, 13.0230],
                        [77.5900, 13.0190],
                        [77.5840, 13.0320],
                    ]],
                ),
            ),
            FloodRiskZoneFeature(
                type="Feature",
                id="zone-blr-ulsoor-05",
                properties=FloodZoneProperties(
                    zone_id="Z-ULS-03",
                    sector_name="Ulsoor Lake Buffer Zone",
                    risk_level="LOW",
                    risk_score=29.5,
                    flood_depth_m=0.08,
                    population_at_risk=14300,
                    area_sqkm=1.95,
                    primary_hazard="Perimeter Inflow Concentration",
                    drainage_saturation_pct=36.0,
                    last_updated=now_iso,
                ),
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [77.6150, 12.9830],
                        [77.6320, 12.9850],
                        [77.6350, 12.9730],
                        [77.6180, 12.9720],
                        [77.6150, 12.9830],
                    ]],
                ),
            ),
        ]

        metadata = {
            "total_population_at_risk": sum(f.properties.population_at_risk for f in features),
            "critical_zones_count": sum(1 for f in features if f.properties.risk_level == "CRITICAL"),
            "high_zones_count": sum(1 for f in features if f.properties.risk_level == "HIGH"),
            "moderate_zones_count": sum(1 for f in features if f.properties.risk_level == "MODERATE"),
            "low_zones_count": sum(1 for f in features if f.properties.risk_level == "LOW"),
            "total_threat_area_sqkm": round(sum(f.properties.area_sqkm for f in features), 2),
            "mean_precipitation_mm": 48.5,
            "engine": "TerraGuard Hydro-UNet v2.4 + Sentinel-1 SAR Calibration",
            "last_computed": now_iso,
        }

        return FloodRiskZonesResponse(type="FeatureCollection", features=features, metadata=metadata)

    @staticmethod
    def get_sector_telemetry(sector_id: str = "zone-blr-koramangala-01") -> MapStudioTelemetryResponse:
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # 3-hour precipitation history (-3h, -2h, -1h, now)
        history = [
            PrecipitationPoint(timestamp="19:00", precipitation_mm=12.4, drainage_capacity_pct=42.0, flood_index=18.5),
            PrecipitationPoint(timestamp="20:00", precipitation_mm=26.8, drainage_capacity_pct=64.0, flood_index=44.2),
            PrecipitationPoint(timestamp="21:00", precipitation_mm=41.2, drainage_capacity_pct=88.5, flood_index=72.0),
            PrecipitationPoint(timestamp="22:00", precipitation_mm=48.5, drainage_capacity_pct=94.2, flood_index=91.4),
        ]
        
        # +6 hour predictive ML forecast curve
        forecast = [
            PrecipitationPoint(timestamp="+1h (23:00)", precipitation_mm=38.0, drainage_capacity_pct=92.0, flood_index=86.0),
            PrecipitationPoint(timestamp="+2h (00:00)", precipitation_mm=24.5, drainage_capacity_pct=81.0, flood_index=70.5),
            PrecipitationPoint(timestamp="+3h (01:00)", precipitation_mm=14.0, drainage_capacity_pct=68.0, flood_index=52.0),
            PrecipitationPoint(timestamp="+4h (02:00)", precipitation_mm=6.2, drainage_capacity_pct=52.0, flood_index=35.0),
            PrecipitationPoint(timestamp="+5h (03:00)", precipitation_mm=2.1, drainage_capacity_pct=38.0, flood_index=22.0),
            PrecipitationPoint(timestamp="+6h (04:00)", precipitation_mm=0.8, drainage_capacity_pct=25.0, flood_index=14.0),
        ]

        return MapStudioTelemetryResponse(
            sector_id=sector_id,
            sector_name="Koramangala 80ft Road Lowland Basin (Sector 04)",
            timestamp=now_iso,
            live_rainfall_rate_mm_h=48.5,
            drainage_saturation_pct=94.2,
            total_population_at_risk=42800,
            active_alarms_count=3,
            hyetograph_history=history,
            forecast_progression=forecast,
        )

    @staticmethod
    def get_hotspot_presets() -> MapStudioPresetsResponse:
        presets = [
            MapPresetSector(
                id="koramangala",
                name="Koramangala Lowland Basin",
                subtext="Sector 4 · 80ft Road Critical Culvert Zone",
                center=[77.6250, 12.9250],
                zoom=14.5,
                pitch=35.0,
                bearing=-12.0,
                risk_level="CRITICAL",
                key_metrics={"flood_depth": "0.72m", "rainfall": "48.5 mm/h", "population": "42.8k"},
            ),
            MapPresetSector(
                id="bellandur",
                name="Bellandur Catchment & EcoSpace",
                subtext="Outer Ring Road IT Corridor & Spillway",
                center=[77.6800, 12.9260],
                zoom=14.0,
                pitch=30.0,
                bearing=15.0,
                risk_level="HIGH",
                key_metrics={"flood_depth": "0.48m", "rainfall": "42.0 mm/h", "population": "68.5k"},
            ),
            MapPresetSector(
                id="mahadevapura",
                name="Mahadevapura Low-Lying Arterial",
                subtext="Whitefield Connection Box Drain Sump",
                center=[77.7020, 12.9780],
                zoom=13.8,
                pitch=25.0,
                bearing=0.0,
                risk_level="HIGH",
                key_metrics={"flood_depth": "0.39m", "rainfall": "38.2 mm/h", "population": "51.2k"},
            ),
            MapPresetSector(
                id="hebbal",
                name="Hebbal Valley Drainage Sump",
                subtext="North Bengaluru Elevated Retention Basin",
                center=[77.5980, 13.0280],
                zoom=13.5,
                pitch=20.0,
                bearing=-20.0,
                risk_level="MODERATE",
                key_metrics={"flood_depth": "0.22m", "rainfall": "24.0 mm/h", "population": "24.9k"},
            ),
            MapPresetSector(
                id="bengaluru_metro",
                name="Bengaluru Metropolitan HQ",
                subtext="City-Wide Integrated Command Overview",
                center=[77.5946, 12.9716],
                zoom=12.0,
                pitch=0.0,
                bearing=0.0,
                risk_level="MODERATE",
                key_metrics={"total_zones": "5", "threat_area": "17.6 km²", "population": "201.7k"},
            ),
        ]
        return MapStudioPresetsResponse(presets=presets, default_centroid=[77.5946, 12.9716])

