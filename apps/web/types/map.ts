export interface GeoJSONFeature<P = Record<string, any>> {
  type: "Feature";
  geometry: {
    type: "Point" | "Polygon" | "LineString" | "MultiPolygon";
    coordinates: any;
  };
  properties: P;
}

export interface GeoJSONFeatureCollection<P = Record<string, any>> {
  type: "FeatureCollection";
  features: GeoJSONFeature<P>[];
}

export interface MapLayersData {
  risk_zones: GeoJSONFeatureCollection;
  citizen_reports: GeoJSONFeatureCollection;
  verified_incidents: GeoJSONFeatureCollection;
  facilities: GeoJSONFeatureCollection;
  environmental_sensors: GeoJSONFeatureCollection;
  safe_routes: GeoJSONFeatureCollection;
  metadata: {
    center: [number, number];
    radius_km: number;
    total_features: number;
    attribution: string;
  };
}

export interface LayerVisibilityState {
  floodZones: boolean;
  heatIndicators: boolean;
  airQuality: boolean;
  citizenReports: boolean;
  verifiedIncidents: boolean;
  facilities: boolean;
  safeRoutes: boolean;
  heatmapMode: boolean;
}

export interface SelectedFeatureInfo {
  title: string;
  category: string;
  dataClassification:
    | "OBSERVED_ENVIRONMENTAL_CONDITION"
    | "CITIZEN_REPORTED_HAZARD"
    | "VERIFIED_INCIDENT"
    | "MODEL_GENERATED_RISK_ESTIMATE"
    | "SAFE_AVAILABLE_FACILITY"
    | "SAFE_EVACUATION_CORRIDOR";
  dataClassificationLabel: string;
  severityOrScore?: string | number;
  coordinates: [number, number];
  address?: string;
  description?: string;
  actionDirective?: string;
  metrics?: Record<string, any>;
  contactPhone?: string;
  capacity?: number;
}

