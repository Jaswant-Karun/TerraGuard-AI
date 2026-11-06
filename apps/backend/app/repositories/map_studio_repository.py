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

    @staticmethod
    def get_all_experiences_meta() -> List[ExperienceViewMeta]:
        return [
            ExperienceViewMeta(
                id="operational-satellite-gis",
                index=1,
                name="Operational Satellite GIS",
                subtitle="High-Resolution Orbital Base & Infrastructure Command",
                badge="REF IMAGE A",
                category="Operations",
                default_basemap="satellite",
                default_zoom=13.5,
                default_pitch=30.0,
                default_bearing=-10.0,
                center=[77.6250, 12.9300],
                attribution="Esri World Imagery, DigitalGlobe, BBMP GIS Cell",
                freshness="Live GIS Ingestion • Optical Pass: 10:45 AM UTC",
                limitations="Sub-meter optical satellite tiles cached via CDN; high cloud cover may partially obscure optical pass.",
            ),
            ExperienceViewMeta(
                id="flood-risk-intelligence",
                index=2,
                name="Flood Risk Intelligence",
                subtitle="Hydro-UNet Predictive Inundation & Culvert Sump Dynamics",
                badge="REF IMAGE B",
                category="Hydrology",
                default_basemap="dark",
                default_zoom=14.0,
                default_pitch=35.0,
                default_bearing=0.0,
                center=[77.6300, 12.9280],
                attribution="TerraGuard Hydro-UNet v2.4, BBMP Stormwater LiDAR, IMD",
                freshness="Live Telemetry Sync • 5 min cadence",
                limitations="Predictive inundation zones are susceptibility estimates; street-level water ponding depends on local micro-debris.",
            ),
            ExperienceViewMeta(
                id="live-rainfall-monitoring",
                index=3,
                name="Live Rainfall Monitoring",
                subtitle="Automated Weather Stations (AWS) & Convective Telemetry",
                badge="OPEN-METEO",
                category="Meteorology",
                default_basemap="dark",
                default_zoom=12.8,
                default_pitch=0.0,
                default_bearing=0.0,
                center=[77.6000, 12.9600],
                attribution="India Meteorological Department (IMD) & Open-Meteo High-Res Mesh",
                freshness="Observation: 4 mins ago • Forecast updated hourly",
                limitations="Precipitation gauges measure point rainfall; spatial distribution uses inverse-distance interpolation.",
            ),
            ExperienceViewMeta(
                id="elevation-terrain",
                index=4,
                name="Elevation & Terrain Intelligence",
                subtitle="Contour Ridges, Valley Basins & Slope Gradients",
                badge="SRTM LiDAR",
                category="Topography",
                default_basemap="topo",
                default_zoom=13.2,
                default_pitch=45.0,
                default_bearing=-25.0,
                center=[77.6100, 12.9500],
                attribution="SRTM 30m Digital Elevation Model & OpenTopoMap",
                freshness="Static Topological Baseline (30m Grid Resolution)",
                limitations="Vertical accuracy is +/- 5m. Underground civil alterations and basement parking sumps not captured.",
            ),
            ExperienceViewMeta(
                id="drainage-water-body",
                index=5,
                name="Drainage & Water-Body Network",
                subtitle="Surface Lakes, Detention Basins & Open Raja Kaluve Channels",
                badge="HYDROGRAPHIC",
                category="Hydrology",
                default_basemap="dark",
                default_zoom=13.4,
                default_pitch=20.0,
                default_bearing=10.0,
                center=[77.6600, 12.9350],
                attribution="Karnataka Lake Development Authority & OpenStreetMap Verified Waterways",
                freshness="Lake boundaries synchronized monthly via Sentinel-2 NDWI",
                limitations="Underground closed piped storm drains are unmapped in older layouts; only verified open channels and culverts shown.",
            ),
            ExperienceViewMeta(
                id="extreme-heat-risk",
                index=6,
                name="Extreme Heat Risk & Microclimate",
                subtitle="Urban Heat Island (UHI) Index & Canopy Disparity",
                badge="HEAT INDEX",
                category="Climate",
                default_basemap="dark",
                default_zoom=12.9,
                default_pitch=15.0,
                default_bearing=0.0,
                center=[77.5950, 12.9700],
                attribution="TerraGuard Thermal Disparity Model + Open-Meteo Ambient Sensors",
                freshness="Model Computed: 15 mins ago",
                limitations="Apparent temperature calculated via Steadman formula; micro-surface albedo relies on high-resolution land-cover maps.",
            ),
            ExperienceViewMeta(
                id="air-quality-intelligence",
                index=7,
                name="Air Quality Intelligence (AQI)",
                subtitle="Continuous Ambient Air Quality Monitoring (CAAQMS)",
                badge="CPCB C-AQI",
                category="Environment",
                default_basemap="dark",
                default_zoom=12.8,
                default_pitch=0.0,
                default_bearing=0.0,
                center=[77.6100, 12.9600],
                attribution="Central Pollution Control Board (CPCB) & OpenAQ Live Stations",
                freshness="Live Stream • Continuous 15-min sample window",
                limitations="Interpolation between distant monitoring stations is approximate; localized vehicular exhaust plumes may cause spikes.",
            ),
            ExperienceViewMeta(
                id="citizen-hazard-report",
                index=8,
                name="Citizen Hazard Reports",
                subtitle="Crowdsourced Ground Hazards & AI-Assisted Classification",
                badge="COMMUNITY",
                category="Crowdsource",
                default_basemap="street",
                default_zoom=13.6,
                default_pitch=20.0,
                default_bearing=0.0,
                center=[77.6300, 12.9300],
                attribution="TerraGuard Citizen Mobile Portal & Vision Engine",
                freshness="Real-Time Event Stream",
                limitations="Citizen reports require municipal verification; reporter PII is scrubbed in compliance with privacy regulations.",
            ),
            ExperienceViewMeta(
                id="verified-incident",
                index=9,
                name="Verified Municipal Incidents",
                subtitle="Triage Confirmed Climate Hazards & Emergency Sirens",
                badge="VERIFIED EOC",
                category="Operations",
                default_basemap="dark",
                default_zoom=13.8,
                default_pitch=25.0,
                default_bearing=-15.0,
                center=[77.6350, 12.9320],
                attribution="Municipal Emergency Operations Center (EOC) Dispatch Logs",
                freshness="Verified by On-Duty Field Supervisor • 12 mins ago",
                limitations="Only incidents triaged and validated by verified municipal administrators appear in this view.",
            ),
            ExperienceViewMeta(
                id="infrastructure-emergency-facility",
                index=10,
                name="Infrastructure & Emergency Facilities",
                subtitle="Trauma Hospitals, Evacuation Shelters & Relief Hubs",
                badge="CIVIL DEFENSE",
                category="Logistics",
                default_basemap="street",
                default_zoom=13.2,
                default_pitch=10.0,
                default_bearing=0.0,
                center=[77.6000, 12.9550],
                attribution="District Disaster Management Authority (DDMA) & BBMP Urban Health",
                freshness="Verified Operational Capacity Registry",
                limitations="Shelter bed availability updates dynamically during flood activation; verify with local nodal officers.",
            ),
            ExperienceViewMeta(
                id="safe-navigation-risk-aware",
                index=11,
                name="Safe Navigation & Risk-Aware Routing",
                subtitle="Dynamic Multi-Criteria Route Hazard Avoidance",
                badge="AI ROUTING",
                category="Mobility",
                default_basemap="dark",
                default_zoom=13.5,
                default_pitch=40.0,
                default_bearing=-12.0,
                center=[77.6100, 12.9450],
                attribution="OSRM Open Routing Engine + TerraGuard Spatial Hazard Intersect",
                freshness="Real-Time Topological Re-routing",
                limitations="No route is guaranteed 100% hazard-free during sudden cloudburst events. Obey emergency municipal traffic police diversions.",
            ),
        ]

    @staticmethod
    def get_experience_data(experience_id: str) -> MapStudioExperienceResponse:
        all_meta = {m.id: m for m in MapStudioRepository.get_all_experiences_meta()}
        meta = all_meta.get(experience_id, all_meta["operational-satellite-gis"])
        now_iso = datetime.now(timezone.utc).isoformat()

        # Build domain data matching user specs for each experience
        if experience_id == "operational-satellite-gis":
            geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "id": "f-victoria",
                        "properties": {"name": "Victoria Hospital Trauma Center", "type": "Hospital", "status": "Operational", "color": "#10b981"},
                        "geometry": {"type": "Point", "coordinates": [77.5750, 12.9640]},
                    },
                    {
                        "type": "Feature",
                        "id": "f-kora-shelter",
                        "properties": {"name": "Koramangala Indoor Evacuation Shelter", "type": "Shelter", "status": "Active Standby", "color": "#10b981"},
                        "geometry": {"type": "Point", "coordinates": [77.6200, 12.9340]},
                    },
                    {
                        "type": "Feature",
                        "id": "inc-culvert-4b",
                        "properties": {"name": "Choked Culvert 4B Silt Backflow", "type": "Hazard", "status": "VERIFIED", "color": "#ef4444"},
                        "geometry": {"type": "Point", "coordinates": [77.6320, 12.9270]},
                    },
                    {
                        "type": "Feature",
                        "id": "zone-kora-poly",
                        "properties": {"name": "Koramangala Lowland Inundation Basin", "risk_level": "CRITICAL", "color": "#ef4444"},
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [[[77.6180, 12.9290], [77.6360, 12.9320], [77.6410, 12.9240], [77.6250, 12.9180], [77.6180, 12.9290]]],
                        },
                    },
                ],
            }
            metrics = {"monitored_sectors": 5, "active_facilities": 14, "verified_hazards": 3, "optical_resolution": "0.5m"}
            legend = [
                ExperienceLegendItem(label="Emergency Facility (Shelter / Hospital)", color="#10b981", shape="circle"),
                ExperienceLegendItem(label="Verified Municipal Hazard", color="#ef4444", shape="circle"),
                ExperienceLegendItem(label="High Risk Inundation Polygon", color="#ef4444", shape="polygon"),
                ExperienceLegendItem(label="Optical Satellite Coverage", color="#38bdf8", shape="square"),
            ]
            side_panel = {
                "headline": "Full-Spectrum Command GIS",
                "satellite_provider": "Esri World Imagery (High-Res ArcGIS)",
                "active_radar_mode": "IMD Doppler DWR Bengaluru",
                "operational_status": "All Primary Response Sectors Green",
            }

        elif experience_id == "flood-risk-intelligence":
            zones = MapStudioRepository.get_flood_risk_zones()
            geojson = zones.model_dump()
            metrics = {
                "total_population_at_risk": 201700,
                "critical_threat_zones": 1,
                "high_threat_zones": 2,
                "drainage_saturation_mean": "83.6%",
            }
            legend = [
                ExperienceLegendItem(label="Critical Risk (>0.65m Depth)", color="#ef4444", shape="polygon"),
                ExperienceLegendItem(label="Elevated High Risk (0.35-0.65m)", color="#f97316", shape="polygon"),
                ExperienceLegendItem(label="Moderate Risk (0.15-0.35m)", color="#eab308", shape="polygon"),
                ExperienceLegendItem(label="Lower Risk (<0.15m Depth)", color="#10b981", shape="polygon"),
                ExperienceLegendItem(label="Surface Lake / Detention Sump", color="#06b6d4", shape="polygon"),
            ]
            side_panel = {
                "headline": "Predictive Flood Inundation Model",
                "engine": "TerraGuard Hydro-UNet v2.4 + LiDAR Elevation",
                "rainfall_intensity": "48.5 mm/h (Convective Cloudburst)",
                "contributing_factors": ["Impervious urban runoff >82%", "Culvert 4B sediment backflow", "Lake spillway elevation lag"],
                "prediction_horizon": "-24h to +6h Simulation Scrubber",
            }

        elif experience_id == "live-rainfall-monitoring":
            geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"name": "Koramangala AWS-04", "rainfall_rate_mm_h": 48.5, "accum_24h_mm": 94.2, "status": "Cloudburst", "color": "#a855f7"},
                        "geometry": {"type": "Point", "coordinates": [77.6250, 12.9280]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "HAL Airport IMD Station", "rainfall_rate_mm_h": 42.0, "accum_24h_mm": 81.5, "status": "Heavy Rain", "color": "#ef4444"},
                        "geometry": {"type": "Point", "coordinates": [77.6680, 12.9550]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Electronic City Sensor Node", "rainfall_rate_mm_h": 35.6, "accum_24h_mm": 68.0, "status": "Moderate", "color": "#f97316"},
                        "geometry": {"type": "Point", "coordinates": [77.6780, 12.8450]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Bengaluru City Central Command", "rainfall_rate_mm_h": 26.4, "accum_24h_mm": 52.3, "status": "Moderate", "color": "#f97316"},
                        "geometry": {"type": "Point", "coordinates": [77.5946, 12.9716]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Hebbal North Tipping Bucket", "rainfall_rate_mm_h": 18.2, "accum_24h_mm": 34.0, "status": "Light-Moderate", "color": "#38bdf8"},
                        "geometry": {"type": "Point", "coordinates": [77.5980, 13.0280]},
                    },
                ],
            }
            metrics = {"peak_intensity": "48.5 mm/h", "city_average_rain": "34.1 mm/h", "active_tipping_buckets": 5, "forecast_next_3h": "76.4 mm"}
            legend = [
                ExperienceLegendItem(label="Cloudburst (>40 mm/h)", color="#a855f7", shape="circle"),
                ExperienceLegendItem(label="Heavy Rain (25-40 mm/h)", color="#ef4444", shape="circle"),
                ExperienceLegendItem(label="Moderate Rain (15-25 mm/h)", color="#f97316", shape="circle"),
                ExperienceLegendItem(label="Light-Moderate (<15 mm/h)", color="#38bdf8", shape="circle"),
            ]
            side_panel = {
                "headline": "Real-Time Telemetry & Radar Scan",
                "provider": "Open-Meteo High-Resolution Grid & IMD Automated Weather Stations",
                "units": "Intensity in mm/h; Cumulative in mm",
                "data_freshness": "Real-time streaming via LoRaWAN telemetry network",
            }

        elif experience_id == "elevation-terrain":
            geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"name": "Highground Natural Ridge", "elevation_masl": 936, "type": "Ridge", "color": "#10b981"},
                        "geometry": {"type": "Point", "coordinates": [77.5850, 12.9920]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Central Plateau", "elevation_masl": 912, "type": "Plateau", "color": "#eab308"},
                        "geometry": {"type": "Point", "coordinates": [77.6050, 12.9650]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Koramangala Lowland Basin", "elevation_masl": 882, "type": "Low Basin (Sump)", "color": "#ef4444"},
                        "geometry": {"type": "Point", "coordinates": [77.6250, 12.9250]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Hebbal Retention Valley", "elevation_masl": 888, "type": "Valley", "color": "#f97316"},
                        "geometry": {"type": "Point", "coordinates": [77.5980, 13.0280]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Vrishabhavathi Outflow Chute", "elevation_masl": 860, "type": "Lowest Outfall", "color": "#ef4444"},
                        "geometry": {"type": "Point", "coordinates": [77.5120, 12.9150]},
                    },
                ],
            }
            metrics = {"highest_elevation": "936m MASL", "lowest_basin": "860m MASL", "elevation_delta": "76 meters", "mean_topographic_gradient": "1.4%"}
            legend = [
                ExperienceLegendItem(label="Elevated Ridge (>920m MASL)", color="#10b981", shape="circle"),
                ExperienceLegendItem(label="Moderate Plateau (895-920m)", color="#eab308", shape="circle"),
                ExperienceLegendItem(label="Low-Lying Inundation Basin (<895m)", color="#ef4444", shape="circle"),
                ExperienceLegendItem(label="OpenTopoMap Contour Lines", color="#64748b", shape="line"),
            ]
            side_panel = {
                "headline": "Topographical Sump & Elevation Gradient",
                "source": "SRTM 30m Global Elevation Dataset & OpenTopoMap Contours",
                "hydrological_implication": "Gravity drainage channels water from 936m Highgrounds down into 882m Koramangala basin.",
            }

        elif experience_id == "drainage-water-body":
            geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"name": "Bellandur Lake Reservoir", "area_sqkm": 3.65, "water_level": "89.4% Capacity", "color": "#06b6d4"},
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [[[77.6650, 12.9380], [77.6850, 12.9420], [77.6920, 12.9300], [77.6700, 12.9280], [77.6650, 12.9380]]],
                        },
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Ulsoor Lake Basin", "area_sqkm": 0.50, "water_level": "72.0% Capacity", "color": "#06b6d4"},
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [[[77.6150, 12.9830], [77.6300, 12.9850], [77.6320, 12.9730], [77.6180, 12.9720], [77.6150, 12.9830]]],
                        },
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Primary Raja Kaluve Arterial Storm Canal", "length_km": 12.4, "color": "#38bdf8"},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [[77.6150, 12.9320], [77.6350, 12.9280], [77.6550, 12.9300], [77.6700, 12.9320]],
                        },
                    },
                ],
            }
            metrics = {"surface_water_bodies": 6, "total_lake_surface": "7.08 km²", "monitored_channels": "34.2 km", "outflow_siphons": 8}
            legend = [
                ExperienceLegendItem(label="Active Lake / Retention Basin", color="#06b6d4", shape="polygon"),
                ExperienceLegendItem(label="Primary Open Raja Kaluve Channel", color="#38bdf8", shape="line"),
                ExperienceLegendItem(label="Storm Drain Outflow Siphon", color="#10b981", shape="circle"),
            ]
            side_panel = {
                "headline": "Civil Drainage & Surface Hydrography",
                "source": "Karnataka Lake Development Authority & OpenStreetMap Verified Waterways",
                "network_coverage": "Verified primary storm canals; unmapped underground tertiary pipes excluded.",
            }

        elif experience_id == "extreme-heat-risk":
            geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"name": "Peenya Industrial Heat Island", "temp_c": 35.8, "heat_index_c": 41.2, "stress": "EXTREME", "color": "#dc2626"},
                        "geometry": {"type": "Point", "coordinates": [77.5250, 13.0320]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "MG Road Commercial Corridor", "temp_c": 34.2, "heat_index_c": 38.6, "stress": "HIGH", "color": "#f97316"},
                        "geometry": {"type": "Point", "coordinates": [77.6080, 12.9750]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Koramangala Mixed Urban Sector", "temp_c": 32.5, "heat_index_c": 36.0, "stress": "MODERATE", "color": "#eab308"},
                        "geometry": {"type": "Point", "coordinates": [77.6250, 12.9300]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Cubbon Park Tree Canopy Oasis", "temp_c": 28.9, "heat_index_c": 30.2, "stress": "LOW", "color": "#10b981"},
                        "geometry": {"type": "Point", "coordinates": [77.5920, 12.9760]},
                    },
                ],
            }
            metrics = {"peak_surface_temp": "35.8°C", "green_canopy_delta": "-5.3°C", "ambient_humidity": "64%", "heat_stress_advisory": "Caution for vulnerable citizens"}
            legend = [
                ExperienceLegendItem(label="Extreme Heat Stress (>40°C Index)", color="#dc2626", shape="circle"),
                ExperienceLegendItem(label="High Heat Stress (36-40°C)", color="#f97316", shape="circle"),
                ExperienceLegendItem(label="Moderate Heat Stress (32-36°C)", color="#eab308", shape="circle"),
                ExperienceLegendItem(label="Low Heat Stress / Vegetated (<32°C)", color="#10b981", shape="circle"),
            ]
            side_panel = {
                "headline": "Urban Microclimate & Thermal Disparity",
                "source": "Open-Meteo Ambient Telemetry + MODIS Surface Temperature Anomaly",
                "measured_vs_modeled": "Temperature is directly measured; Heat Index is calculated via Steadman's bioclimatic formula.",
            }

        elif experience_id == "air-quality-intelligence":
            geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"name": "Silk Board Junction CAAQMS", "aqi": 168, "pm25": 72.4, "pm10": 118.0, "category": "Moderate", "color": "#f59e0b"},
                        "geometry": {"type": "Point", "coordinates": [77.6220, 12.9170]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "City Railway Station", "aqi": 184, "pm25": 84.0, "pm10": 136.2, "category": "Moderate-Poor", "color": "#f97316"},
                        "geometry": {"type": "Point", "coordinates": [77.5700, 12.9780]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "BTM Layout CAAQMS", "aqi": 142, "pm25": 58.2, "pm10": 94.0, "category": "Moderate", "color": "#f59e0b"},
                        "geometry": {"type": "Point", "coordinates": [77.6100, 12.9120]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Saneguruvanahalli Station", "aqi": 88, "pm25": 32.0, "pm10": 58.0, "category": "Satisfactory", "color": "#84cc16"},
                        "geometry": {"type": "Point", "coordinates": [77.5450, 12.9900]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Hebbal North CAAQMS", "aqi": 112, "pm25": 44.5, "pm10": 78.4, "category": "Moderate", "color": "#f59e0b"},
                        "geometry": {"type": "Point", "coordinates": [77.5950, 13.0300]},
                    },
                ],
            }
            metrics = {"city_mean_aqi": 138, "dominant_pollutant": "PM2.5", "active_stations": 5, "cpcb_category": "Moderate"}
            legend = [
                ExperienceLegendItem(label="Good (0-50)", color="#10b981", shape="circle"),
                ExperienceLegendItem(label="Satisfactory (51-100)", color="#84cc16", shape="circle"),
                ExperienceLegendItem(label="Moderate (101-200)", color="#f59e0b", shape="circle"),
                ExperienceLegendItem(label="Poor (201-300)", color="#f97316", shape="circle"),
                ExperienceLegendItem(label="Very Poor (301-400)", color="#ef4444", shape="circle"),
            ]
            side_panel = {
                "headline": "National Air Quality Index (NAQI)",
                "source": "CPCB Continuous Ambient Air Quality Monitoring Network",
                "standard": "Indian CPCB Sub-Index Algorithm based on 24-hr truncated breakpoints",
            }

        elif experience_id == "citizen-hazard-report":
            geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"report_id": "REP-2026-981", "category": "WATERLOGGING", "description": "Standing water 1.5ft deep on 80ft Road", "status": "UNDER_REVIEW", "color": "#f59e0b"},
                        "geometry": {"type": "Point", "coordinates": [77.6240, 12.9330]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"report_id": "REP-2026-874", "category": "WASTE_ACCUMULATION", "description": "Plastic bottles choking storm drain outlet 4B", "status": "VERIFIED", "color": "#10b981"},
                        "geometry": {"type": "Point", "coordinates": [77.6320, 12.9270]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"report_id": "REP-2026-762", "category": "DAMAGED_ROAD", "description": "Asphalt depression 15cm deep posing hazard", "status": "VERIFIED", "color": "#10b981"},
                        "geometry": {"type": "Point", "coordinates": [77.6850, 12.9280]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"report_id": "REP-2026-621", "category": "FALLEN_TREE", "description": "Banyan branch blocking left carriage lane", "status": "REPORTED", "color": "#eab308"},
                        "geometry": {"type": "Point", "coordinates": [77.5600, 12.9850]},
                    },
                ],
            }
            metrics = {"total_community_reports": 12, "verified_reports": 5, "under_review": 4, "resolved_today": 3}
            legend = [
                ExperienceLegendItem(label="Verified Hazard Incident", color="#10b981", shape="circle"),
                ExperienceLegendItem(label="Under Command Review", color="#f59e0b", shape="circle"),
                ExperienceLegendItem(label="Newly Reported (Unverified)", color="#eab308", shape="circle"),
            ]
            side_panel = {
                "headline": "Citizen Ground Perception Stream",
                "privacy_safeguard": "Citizen names, phone numbers, and IP addresses are completely masked.",
                "triage_workflow": "Reports with severity >= 3 are escalated to on-duty municipal engineers.",
            }

        elif experience_id == "verified-incident":
            geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"incident_id": "INC-BBMP-412", "hazard": "Severe Stormwater Silt Backup", "status": "CONFIRMED_SIREN", "severity": "CRITICAL", "officer": "Insp. Rao (EOC-4)", "color": "#ef4444"},
                        "geometry": {"type": "Point", "coordinates": [77.6310, 12.9280]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"incident_id": "INC-BBMP-398", "hazard": "Outer Ring Road Culvert Overflow", "status": "DISPATCHED", "severity": "HIGH", "officer": "Insp. Kumar (EOC-1)", "color": "#f97316"},
                        "geometry": {"type": "Point", "coordinates": [77.6820, 12.9270]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"incident_id": "INC-BBMP-285", "hazard": "Underpass Inversion Sump Waterlogging", "status": "PUMP_DEPLOYED", "severity": "HIGH", "officer": "Insp. Swamy", "color": "#f97316"},
                        "geometry": {"type": "Point", "coordinates": [77.5850, 12.9980]},
                    },
                ],
            }
            metrics = {"active_verified_incidents": 3, "sirens_escalated": 1, "suction_pumps_deployed": 4, "mean_triage_time": "14 mins"}
            legend = [
                ExperienceLegendItem(label="Critical Verified Hazard (Siren Active)", color="#ef4444", shape="circle"),
                ExperienceLegendItem(label="High Priority Verified (Crews Dispatched)", color="#f97316", shape="circle"),
                ExperienceLegendItem(label="Resolved Incident (Closed)", color="#10b981", shape="circle"),
            ]
            side_panel = {
                "headline": "Official Municipal Incident Verification",
                "authority": "Municipal Disaster Operations Center & BBMP Quick Response Teams",
                "audit_integrity": "Cryptographically signed officer decisions logged to immutable audit ledger.",
            }

        elif experience_id == "infrastructure-emergency-facility":
            geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"name": "Victoria Hospital Trauma Center", "type": "Hospital", "beds": 420, "icu": 48, "status": "Operational", "color": "#ef4444"},
                        "geometry": {"type": "Point", "coordinates": [77.5750, 12.9640]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Manipal Hospital HAL Airport Road", "type": "Hospital", "beds": 350, "icu": 36, "status": "Operational", "color": "#ef4444"},
                        "geometry": {"type": "Point", "coordinates": [77.6520, 12.9590]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Koramangala Indoor Evacuation Shelter", "type": "Evacuation Shelter", "capacity": 1200, "status": "Ready", "color": "#10b981"},
                        "geometry": {"type": "Point", "coordinates": [77.6200, 12.9340]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Jayanagar Fire & Rescue Command", "type": "Fire Station", "vehicles": 6, "status": "Dispatched Standby", "color": "#f97316"},
                        "geometry": {"type": "Point", "coordinates": [77.5820, 12.9300]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Whitefield Police & Relief Node", "type": "Police Command", "status": "Operational", "color": "#38bdf8"},
                        "geometry": {"type": "Point", "coordinates": [77.7450, 12.9700]},
                    },
                ],
            }
            metrics = {"trauma_hospitals": 8, "evacuation_shelters": 6, "fire_rescue_stations": 4, "total_shelter_capacity": 6400}
            legend = [
                ExperienceLegendItem(label="Trauma Hospital / Medical Node", color="#ef4444", shape="circle"),
                ExperienceLegendItem(label="Designated Evacuation Shelter", color="#10b981", shape="circle"),
                ExperienceLegendItem(label="Fire & Rescue Command", color="#f97316", shape="circle"),
                ExperienceLegendItem(label="Police & Logistics Node", color="#38bdf8", shape="circle"),
            ]
            side_panel = {
                "headline": "Civil Infrastructure & Relief Topology",
                "source": "District Disaster Management Authority (DDMA) Master Facility Registry",
                "operational_readiness": "All facilities verified with auxiliary power generators and drinking water stores.",
            }

        elif experience_id == "safe-navigation-risk-aware":
            geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"name": "Recommended Risk-Aware Route", "type": "RECOMMENDED_SAFE", "distance_km": 8.4, "time_min": 24, "color": "#10b981"},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [77.6200, 12.9340], [77.6180, 12.9450], [77.6080, 12.9550], [77.5950, 12.9650], [77.5750, 12.9750],
                            ],
                        },
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Standard Arterial Route (Culvert Conflict)", "type": "HIGH_HAZARD_CONFLICT", "distance_km": 7.8, "time_min": 36, "color": "#ef4444"},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [77.6200, 12.9340], [77.6280, 12.9310], [77.6320, 12.9270], [77.6100, 12.9400], [77.5750, 12.9750],
                            ],
                        },
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Secondary Bypass Route", "type": "ALTERNATIVE", "distance_km": 10.2, "time_min": 32, "color": "#38bdf8"},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [77.6200, 12.9340], [77.6350, 12.9450], [77.6300, 12.9650], [77.6000, 12.9780], [77.5750, 12.9750],
                            ],
                        },
                    },
                    {
                        "type": "Feature",
                        "properties": {"name": "Active Inundation Hazard on 80ft Road", "type": "HAZARD_OBSTRUCTION", "color": "#ef4444"},
                        "geometry": {"type": "Point", "coordinates": [77.6320, 12.9270]},
                    },
                ],
            }
            metrics = {"safe_route_distance": "8.4 km", "estimated_travel_time": "24 mins", "hazard_bypass_efficiency": "100%", "active_conflicts_avoided": 1}
            legend = [
                ExperienceLegendItem(label="Risk-Aware Recommended Route (Clear of Hazards)", color="#10b981", shape="line"),
                ExperienceLegendItem(label="Standard Route (Intersects Verified Flood Sump)", color="#ef4444", shape="line"),
                ExperienceLegendItem(label="Alternative Bypass Route", color="#38bdf8", shape="line"),
                ExperienceLegendItem(label="Road Waterlogging Obstruction Point", color="#ef4444", shape="circle"),
            ]
            side_panel = {
                "headline": "Risk-Aware Dynamic Routing Intelligence",
                "routing_engine": "OSRM Multi-Criteria Engine + Turf.js Spatial Hazard Buffering",
                "hazard_intersection": "Route intersects 1 active flood zone at 80ft Road (Culvert 4B backup). Diverted via Inner Ring Rd.",
                "safety_disclaimer": "Safety assessments reflect currently ingested telemetry. Never drive through moving flood waters.",
            }
        else:
            geojson = {"type": "FeatureCollection", "features": []}
            metrics = {}
            legend = []
            side_panel = {}

        return MapStudioExperienceResponse(
            meta=meta,
            geojson=geojson,
            metrics=metrics,
            legend_items=legend,
            side_panel_data=side_panel,
        )


